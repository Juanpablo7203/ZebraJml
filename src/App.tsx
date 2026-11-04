/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { OrderStrip } from './components/OrderStrip';
import { ScannerViewport } from './components/ScannerViewport';
import { HudScannedCard } from './components/HudScannedCard';
import { ItemsChecklist } from './components/ItemsChecklist';
import { HandheldUtilities } from './components/HandheldUtilities';
import { BottomNav, NavTab } from './components/BottomNav';
import { HistorialScreen } from './components/screens/HistorialScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SincronizarScreen, LastSyncedDocInfo } from './components/screens/SincronizarScreen';
import { AjustesScreen } from './components/screens/AjustesScreen';
import { DialpadModal } from './components/modals/DialpadModal';
import { DamagedCodeModal } from './components/modals/DamagedCodeModal';
import { CameraScannerModal } from './components/modals/CameraScannerModal';
import { OrderSelectorModal } from './components/modals/OrderSelectorModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { OperatorModal } from './components/modals/OperatorModal';
import { LoadDocumentModal } from './components/modals/LoadDocumentModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { OrderDoc, OrderItem, ScanLog, ScannerSettings } from './types';
import { INITIAL_ORDERS, INITIAL_SCAN_LOGS, DEFAULT_SETTINGS } from './data/mockOrders';
import { playZebraBeep, triggerZebraHaptic } from './utils/audioFeedback';
import { fetchPedido } from './services/pedidosApi';

export default function App() {
  const [orders, setOrders] = useState<OrderDoc[]>(INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [activeSku, setActiveSku] = useState<string>('');
  const [activeTab, setActiveTab] = useState<NavTab>('consultar');
  const [scanLogs, setScanLogs] = useState<ScanLog[]>(INITIAL_SCAN_LOGS);
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoadingInitialOrder, setIsLoadingInitialOrder] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [lastSyncedDoc, setLastSyncedDoc] = useState<LastSyncedDocInfo | null>(null);

  // Modals state
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const [isDamagedCodeOpen, setIsDamagedCodeOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoadDocOpen, setIsLoadDocOpen] = useState(false);

  // Automatically fetch live Pedido #20 from Railway API on initial mount (no mock fallbacks)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingInitialOrder(true);
    setInitialError(null);
    fetchPedido(20)
      .then((liveOrder) => {
        if (!isMounted) return;
        setOrders([liveOrder]);
        setActiveOrderId(liveOrder.id);
        if (liveOrder.items.length > 0) {
          setActiveSku(liveOrder.items[0].sku);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Initial live API load failed:', err);
        setInitialError(err instanceof Error ? err.message : 'Error al conectar con la API');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingInitialOrder(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Active Order & Item references
  const currentOrder = orders.find((o) => o.id === activeOrderId) || orders[0] || null;
  const currentItem = currentOrder
    ? currentOrder.items.find((i) => i.sku === activeSku) || currentOrder.items[0] || null
    : null;

  // Helper to append a scan log
  const logScanAction = (
    sku: string,
    description: string,
    symbology: string,
    delta: number,
    newTotal: number,
    expected: number,
    method: ScanLog['method']
  ) => {
    const newLog: ScanLog = {
      id: `scan-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      sku,
      description,
      symbology,
      quantityDelta: delta,
      totalCounted: newTotal,
      expectedQty: expected,
      method,
      status: newTotal === expected ? 'success' : 'warning',
    };
    setScanLogs((prev) => [newLog, ...prev]);
  };

  // Helper normalizer for Zebra DataWedge barcodes and SKUs
  const cleanBarcodeString = (raw: string): string => {
    if (!raw) return '';
    return raw
      .replace(/^\][a-zA-Z0-9]{2}/, '') // Remove AIM symbology identifier (e.g., ]C1, ]E0)
      .replace(/[\r\n\t\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  };

  // EAN-13 Checksum validator (GS1 standard algorithm)
  const isValidEan13 = (code: string): boolean => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 13) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const num = parseInt(digits[i], 10);
      sum += i % 2 === 0 ? num : num * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(digits[12], 10);
  };

  // Detect Barcode Symbology from scanned text (Default: EAN-13)
  const detectBarcodeSymbology = (code: string): string => {
    const clean = cleanBarcodeString(code);
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 13) {
      return 'EAN-13';
    }
    if (digits.length === 8) return 'EAN-8';
    if (digits.length === 12) return 'UPC-A (EAN-13)';
    if (digits.length === 14) return 'EAN-14';
    if (clean.startsWith('(01)') || clean.startsWith('01')) return 'EAN-128';
    if (clean.length > 20) return 'DataMatrix';
    // Por defecto los códigos son EAN-13
    return 'EAN-13';
  };

  // Strictly validate scanned barcode or SKU against items in the current order
  const findMatchingOrderItem = useCallback(
    (order: OrderDoc | null, scannedCode: string): OrderItem | null => {
      if (!order) return null;
      const code = cleanBarcodeString(scannedCode).toLowerCase();
      if (!code) return null;

      // 1. Exact match on barcode or sku
      const exact = order.items.find(
        (i) =>
          cleanBarcodeString(i.barcode).toLowerCase() === code ||
          cleanBarcodeString(i.sku).toLowerCase() === code
      );
      if (exact) return exact;

      // 2. EAN-13 & UPC-A cross-matching (e.g. 13-digit EAN-13 vs 12-digit UPC or leading zeros)
      const codeDigits = code.replace(/\D/g, '');
      if (codeDigits.length === 13 || codeDigits.length === 12) {
        const ean13 = codeDigits.length === 12 ? '0' + codeDigits : codeDigits;
        const upcA = codeDigits.length === 13 && codeDigits.startsWith('0') ? codeDigits.slice(1) : codeDigits;

        const eanMatch = order.items.find((i) => {
          const itemDigits = cleanBarcodeString(i.barcode).replace(/\D/g, '');
          const skuDigits = cleanBarcodeString(i.sku).replace(/\D/g, '');
          return (
            itemDigits === ean13 ||
            itemDigits === upcA ||
            skuDigits === ean13 ||
            skuDigits === upcA ||
            (itemDigits.length === 12 && '0' + itemDigits === ean13)
          );
        });
        if (eanMatch) return eanMatch;
      }

      // 3. Exact numeric match (ignoring leading zeros) e.g. 001002052 vs 1002052
      if (codeDigits && codeDigits.length >= 4) {
        const strippedCode = codeDigits.replace(/^0+/, '');
        const numMatch = order.items.find((i) => {
          const bDigits = cleanBarcodeString(i.barcode).replace(/\D/g, '').replace(/^0+/, '');
          const sDigits = cleanBarcodeString(i.sku).replace(/\D/g, '').replace(/^0+/, '');
          return (bDigits && bDigits === strippedCode) || (sDigits && sDigits === strippedCode);
        });
        if (numMatch) return numMatch;
      }

      // If no item in the order matches this barcode/SKU, return null
      return null;
    },
    []
  );

  const [scanFeedbackNotice, setScanFeedbackNotice] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);

  // Bulletproof functional state increment with strict document limits
  // "no se debe permitir ingresar más cantidad de las que tiene el documento"
  const handleIncrementItem = useCallback(
    (targetSku: string, delta: number = 1, method: ScanLog['method'] = 'hardware_trigger') => {
      const activeOrder = orders.find((o) => o.id === activeOrderId);
      if (!activeOrder) return;

      const targetItem = activeOrder.items.find(
        (i) =>
          cleanBarcodeString(i.sku).toLowerCase() === cleanBarcodeString(targetSku).toLowerCase() ||
          cleanBarcodeString(i.barcode).toLowerCase() === cleanBarcodeString(targetSku).toLowerCase()
      );

      if (!targetItem) return;

      if (delta > 0 && targetItem.countedQty >= targetItem.expectedQty) {
        playZebraBeep('error', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
        triggerZebraHaptic('error', settings.hapticEnabled);
        setScanFeedbackNotice({
          text: `Cantidad completa para ${targetItem.sku}: ya alcanzó las ${targetItem.expectedQty} uds del documento. No se permite sobreconteo.`,
          type: 'error',
        });
        return;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== activeOrderId) return order;

          const updatedItems = order.items.map((item) => {
            const isTarget =
              cleanBarcodeString(item.sku).toLowerCase() === cleanBarcodeString(targetSku).toLowerCase() ||
              cleanBarcodeString(item.barcode).toLowerCase() === cleanBarcodeString(targetSku).toLowerCase();

            if (!isTarget) return item;

            const nextCount = Math.max(0, Math.min(item.expectedQty, item.countedQty + delta));
            const actualDelta = nextCount - item.countedQty;

            if (actualDelta === 0 && delta > 0) {
              return item;
            }

            const updatedStatus: OrderItem['status'] =
              nextCount === item.expectedQty ? 'ok' : 'discrepancy';

            // Play Zebra decode sound & haptic
            playZebraBeep(
              nextCount === item.expectedQty ? 'success' : 'warning',
              settings.bipEnabled,
              settings.bipVolume,
              settings.bipFrequency
            );
            triggerZebraHaptic(
              nextCount === item.expectedQty ? 'success' : 'warning',
              settings.hapticEnabled
            );

            // Append scan log
            logScanAction(
              item.sku,
              item.description,
              item.symbology,
              actualDelta,
              nextCount,
              item.expectedQty,
              method
            );

            return {
              ...item,
              countedQty: nextCount,
              status: updatedStatus,
              lastScannedAt: new Date().toLocaleTimeString(),
            };
          });

          return {
            ...order,
            items: updatedItems,
          };
        })
      );
    },
    [orders, activeOrderId, settings]
  );

  // Dialpad manual entry save (conservando la opción de digitar manualmente)
  const handleSaveDialpadCount = (newCount: number) => {
    if (!currentItem) return;
    const capped = Math.max(0, Math.min(currentItem.expectedQty, newCount));
    const delta = capped - currentItem.countedQty;
    if (delta !== 0) {
      handleIncrementItem(currentItem.sku, delta, 'dialpad');
    }
  };

  // Reference to invisible always-focused hardware scanner input for Zebra TC27 DataWedge
  const hardwareInputRef = useRef<HTMLInputElement | null>(null);
  const hwDebounceRef = useRef<any>(null);

  // Focus the invisible hardware scanner input ONLY when the user interacts inside the app
  // or presses the Zebra hardware trigger (never on a timer, so it never steals focus from outside)
  const focusHardwareInput = useCallback(() => {
    // Only auto-focus if the document itself already has focus or user clicked inside
    if (
      activeTab === 'consultar' &&
      !isDialpadOpen &&
      !isDamagedCodeOpen &&
      !isCameraOpen &&
      !isLoadDocOpen &&
      !isOrderSelectorOpen
    ) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isUserTypingInManualBox =
        activeEl &&
        ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) &&
        activeEl !== hardwareInputRef.current;

      if (!isUserTypingInManualBox && hardwareInputRef.current) {
        hardwareInputRef.current.focus({ preventScroll: true });
      }
    }
  }, [
    activeTab,
    isDialpadOpen,
    isDamagedCodeOpen,
    isCameraOpen,
    isLoadDocOpen,
    isOrderSelectorOpen,
  ]);

  // Barcode / SKU scan decoder handler
  // Validates strictly that the scanned barcode matches the item and increments by +1
  const handleBarcodeDecoded = useCallback(
    (scannedCode: string, method: ScanLog['method'] = 'hardware_trigger') => {
      const cleaned = cleanBarcodeString(scannedCode);
      if (!cleaned) return;

      setLastScannedCode(cleaned);

      // 1. Check if the scanned code matches the currently selected item first
      const activeMatch =
        currentItem && currentOrder
          ? findMatchingOrderItem({ ...currentOrder, items: [currentItem] }, cleaned)
          : null;

      // 2. Otherwise check if it matches any item in the active order
      const target = activeMatch || findMatchingOrderItem(currentOrder, cleaned);

      if (target) {
        setUnmatchedCode(null);
        setActiveSku(target.sku);

        // Strict limit check: do not increment if already at document expected count
        if (target.countedQty >= target.expectedQty) {
          playZebraBeep('error', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
          triggerZebraHaptic('error', settings.hapticEnabled);
          setScanFeedbackNotice({
            text: `¡Cantidad completa! ${target.sku} ya alcanzó las ${target.expectedQty} uds del documento. No se permite sobreconteo.`,
            type: 'error',
          });
          return;
        }

        // Each valid barcode scan increments the matched item by 1 unit
        const delta = 1;
        handleIncrementItem(target.sku, delta, method);

        setScanFeedbackNotice({
          text: `Lectura EAN-13 OK: ${target.sku} (${cleaned}) +1 ud (${target.countedQty + 1}/${target.expectedQty})`,
          type: 'success',
        });
      } else {
        setUnmatchedCode(cleaned);
        playZebraBeep('error', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
        triggerZebraHaptic('error', settings.hapticEnabled);
        setScanFeedbackNotice({
          text: `Código no corresponde: "${cleaned}" no coincide con ${currentItem ? currentItem.sku : 'ningún ítem del pedido'}.`,
          type: 'error',
        });
      }

      setTimeout(() => {
        setScanFeedbackNotice((prev) => (prev?.text.includes(cleaned) ? null : prev));
      }, 5000);
    },
    [currentOrder, currentItem, findMatchingOrderItem, handleIncrementItem, settings]
  );

  // Hardware barcode wedge listener & physical trigger listener (Zebra TC27)
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const scanTimerRef = useRef<any>(null);

  useEffect(() => {
    const flushBuffer = (method: ScanLog['method'] = 'hardware_trigger') => {
      const scanned = keyBufferRef.current.trim();
      keyBufferRef.current = '';
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      setIsScanning(false);
      // Only decode and validate if DataWedge actually sent barcode characters
      if (scanned.length > 0) {
        handleBarcodeDecoded(scanned, method);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetElement = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(targetElement?.tagName);
      // Allow events from our invisible hardware input (data-hw-scanner="true"), block only if user is typing in another input
      if (isInput && !targetElement.getAttribute('data-barcode-capture')) {
        return;
      }
      // If event came from the invisible hardware input, its own onChange/onKeyDown handles it cleanly
      if (targetElement && targetElement.getAttribute('data-hw-scanner') === 'true') {
        return;
      }
      if (isDialpadOpen || isDamagedCodeOpen || isCameraOpen || isLoadDocOpen) {
        return;
      }

      const now = Date.now();

      // Zebra TC27 hardware trigger keycodes (293, 294, 'Scan', 'F12', 10036):
      // Ensure invisible hardware receiver has focus immediately so DataWedge injects the barcode!
      if (
        e.keyCode === 293 ||
        e.keyCode === 294 ||
        e.keyCode === 10036 ||
        e.key === 'Scan' ||
        e.key === 'F12'
      ) {
        setIsScanning(true);
        if (hardwareInputRef.current) {
          hardwareInputRef.current.focus({ preventScroll: true });
        }
        setTimeout(() => setIsScanning(false), 600);
        return;
      }

      // Enter, Tab or NumpadEnter signals end of barcode in DataWedge Keystroke output
      if (
        e.key === 'Enter' ||
        e.key === 'Tab' ||
        e.code === 'NumpadEnter' ||
        e.keyCode === 13 ||
        e.keyCode === 9
      ) {
        if (keyBufferRef.current.trim().length > 0) {
          e.preventDefault();
          flushBuffer('hardware_trigger');
        }
        return;
      }

      // If user paused for > 350ms, start fresh buffer
      if (now - lastKeyTimeRef.current > 350) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      // Accumulate standard printable characters sent by DataWedge
      if (e.key && e.key.length === 1) {
        keyBufferRef.current += e.key;

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          if (keyBufferRef.current.trim().length >= 2) {
            flushBuffer('hardware_trigger');
          }
        }, 120);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const targetElement = e.target as HTMLElement;
      const isRegularInput =
        ['INPUT', 'TEXTAREA'].includes(targetElement?.tagName) &&
        !targetElement?.getAttribute('data-hw-scanner');
      if (isRegularInput || isDialpadOpen || isDamagedCodeOpen || isCameraOpen || isLoadDocOpen) {
        return;
      }
      const pasted = e.clipboardData?.getData('text')?.trim();
      if (pasted) {
        e.preventDefault();
        handleBarcodeDecoded(pasted, 'hardware_trigger');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [handleBarcodeDecoded, isDialpadOpen, isDamagedCodeOpen, isCameraOpen, isLoadDocOpen]);

  // Toggle Bip & Haptic directly
  const handleToggleBipAndHaptic = () => {
    const nextState = !settings.bipEnabled;
    setSettings((prev) => ({
      ...prev,
      bipEnabled: nextState,
      hapticEnabled: nextState,
    }));
    if (nextState) {
      playZebraBeep('success', true, settings.bipVolume, settings.bipFrequency);
      triggerZebraHaptic('success', true);
    }
  };

  // Camera scan decoded
  const handleCameraDecoded = (sku: string, barcode: string) => {
    const code = barcode || sku;
    handleBarcodeDecoded(code, 'camera');
  };

  return (
    <div
      className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen relative selection:bg-secondary/20"
      onClick={() => focusHardwareInput()}
    >
      {/* Invisible Always-Active Hardware Barcode Receiver for Zebra TC27 DataWedge */}
      <input
        ref={hardwareInputRef}
        type="text"
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-barcode-capture="true"
        data-hw-scanner="true"
        aria-label="Receptor de escáner láser Zebra"
        className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-10"
        onChange={(e) => {
          const val = e.target.value;
          if (hwDebounceRef.current) clearTimeout(hwDebounceRef.current);
          if (val.includes('\n') || val.includes('\r')) {
            const clean = val.trim();
            e.target.value = '';
            if (clean) handleBarcodeDecoded(clean, 'hardware_trigger');
            return;
          }
          hwDebounceRef.current = setTimeout(() => {
            if (hardwareInputRef.current) {
              const currentVal = hardwareInputRef.current.value.trim();
              hardwareInputRef.current.value = '';
              if (currentVal.length >= 2) {
                handleBarcodeDecoded(currentVal, 'hardware_trigger');
              }
            }
          }, 110);
        }}
        onKeyDown={(e) => {
          if (
            e.keyCode === 293 ||
            e.keyCode === 294 ||
            e.keyCode === 10036 ||
            e.key === 'Scan' ||
            e.key === 'F12'
          ) {
            setIsScanning(true);
            setTimeout(() => setIsScanning(false), 600);
            return;
          }
          if (e.key === 'Enter' || e.key === 'Tab' || e.keyCode === 13 || e.keyCode === 9) {
            e.preventDefault();
            if (hwDebounceRef.current) clearTimeout(hwDebounceRef.current);
            const val = e.currentTarget.value.trim();
            e.currentTarget.value = '';
            if (val.length > 0) {
              handleBarcodeDecoded(val, 'hardware_trigger');
            }
          }
        }}
      />

      {/* 1. Header Navigation Bar */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        batteryLevel={94}
      />

      {/* 2. Main Content Area */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen">
        {/* Floating Scan Toast Banner */}
        {scanFeedbackNotice && (
          <div className="fixed top-16 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-fade-in">
            <div
              className={`max-w-md w-full py-2.5 px-3 rounded-lg shadow-xl text-xs font-semibold flex items-center justify-between gap-2 border pointer-events-auto ${
                scanFeedbackNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-error border-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="material-symbols-outlined text-[18px] shrink-0">
                  {scanFeedbackNotice.type === 'success' ? 'check_circle' : 'warning'}
                </span>
                <span className="truncate">{scanFeedbackNotice.text}</span>
              </div>

              <button
                type="button"
                onClick={() => setScanFeedbackNotice(null)}
                className="text-[14px] opacity-70 hover:opacity-100 cursor-pointer p-0.5"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {activeTab === 'consultar' && (
          currentOrder && currentItem ? (
            <div className="flex flex-col w-full animate-fade-in">
              {/* Status & Document Strip */}
              <OrderStrip
                order={currentOrder}
                onOpenOrderSelector={() => setIsLoadDocOpen(true)}
              />

              {/* Primary Camera & Scanner Viewport Card */}
              <ScannerViewport
                isScanning={isScanning}
                onOpenLiveCamera={() => setIsCameraOpen(true)}
                batteryLevel={94}
                onManualBarcodeSubmit={(code) => handleBarcodeDecoded(code, 'manual')}
                lastScannedCode={lastScannedCode}
              />

              {/* HUD Real-Time Scanned Item Card */}
              <HudScannedCard
                item={currentItem}
                onOpenDialpad={() => setIsDialpadOpen(true)}
              />

              {/* Verification List & Handheld Hardware Panel */}
              <ItemsChecklist
                items={currentOrder.items}
                activeSku={activeSku}
                onSelectItem={(sku) => setActiveSku(sku)}
              />

              {/* Handheld Zebra/Honeywell & Fallback Utility Buttons */}
              <HandheldUtilities
                bipEnabled={settings.bipEnabled}
                onToggleBip={handleToggleBipAndHaptic}
                orderName={currentOrder.name}
                onCancelAndClearOrder={() => {
                  const canceledId = currentOrder.id;
                  setOrders((prev) => prev.filter((o) => o.id !== canceledId));
                  setActiveOrderId('');
                  setActiveSku('');
                  setLastScannedCode('');
                  setUnmatchedCode(null);
                  setIsLoadDocOpen(true);
                  setScanFeedbackNotice({
                    text: 'Pedido cancelado y pantalla limpia. Ingresa un nuevo documento.',
                    type: 'success',
                  });
                }}
              />
            </div>
          ) : (
            <div className="p-6 max-w-md mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto mt-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-md">
              {lastSyncedDoc && (
                <div className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-left flex items-center gap-3 animate-fade-in">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Último Documento Leído y Sincronizado
                    </span>
                    <span className="font-data-mono text-sm font-extrabold text-emerald-950 truncate">
                      Pedido #{lastSyncedDoc.docNumber} ({lastSyncedDoc.orderId})
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {lastSyncedDoc.itemsCount} SKUs ({lastSyncedDoc.totalUnits} uds) • {lastSyncedDoc.syncedAt}
                    </span>
                  </div>
                </div>
              )}

              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px]">
                  {isLoadingInitialOrder ? 'cloud_sync' : 'assignment'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-headline-sm font-bold text-on-surface text-base">
                  {isLoadingInitialOrder
                    ? 'Consultando Pedido en API...'
                    : lastSyncedDoc
                    ? 'Listo para un Nuevo Documento'
                    : 'Sin Pedido Activo'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isLoadingInitialOrder
                    ? 'Conectando con el servidor de pedidos para descargar los datos reales...'
                    : lastSyncedDoc
                    ? `El pedido #${lastSyncedDoc.docNumber} fue sincronizado correctamente. Ingresa el número del siguiente documento para continuar.`
                    : initialError || 'Ingresa el número de pedido para extraerlo desde la API.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLoadDocOpen(true)}
                className="py-3 px-5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Consultar Nuevo Documento
              </button>
            </div>
          )
        )}

        {activeTab === 'dashboard' && (
          <DashboardScreen
            orders={orders}
            currentOrder={currentOrder}
            scanLogs={scanLogs}
          />
        )}

        {activeTab === 'historial' && (
          <HistorialScreen
            logs={scanLogs}
            onClearLogs={() => setScanLogs([])}
          />
        )}

        {activeTab === 'sincronizar' && (
          <SincronizarScreen
            bipEnabled={settings.bipEnabled}
            hapticEnabled={settings.hapticEnabled}
            currentOrder={currentOrder}
            lastSyncedDoc={lastSyncedDoc}
            onOpenLoadDocument={() => setIsLoadDocOpen(true)}
            onSyncSuccess={(syncedInfo) => {
              setLastSyncedDoc(syncedInfo);
              // Clear current order and screen state to request a new document
              setOrders((prev) => prev.filter((o) => o.id !== syncedInfo.orderId));
              setActiveOrderId('');
              setActiveSku('');
              setLastScannedCode('');
              setUnmatchedCode(null);
              setActiveTab('consultar');
              setIsLoadDocOpen(true);
              setScanFeedbackNotice({
                text: `¡Pedido #${syncedInfo.docNumber} sincronizado! Pantalla lista para un nuevo documento.`,
                type: 'success',
              });
            }}
          />
        )}

        {activeTab === 'ajustes' && (
          <AjustesScreen
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
          />
        )}
      </main>

      {/* 3. Bottom Navigation & Floating Quick Scan Trigger */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onQuickScan={() => setIsCameraOpen(true)}
      />

      {/* 4. Modals and Drawers */}
      {currentItem && (
        <DialpadModal
          item={currentItem}
          isOpen={isDialpadOpen}
          onClose={() => setIsDialpadOpen(false)}
          onSaveCount={handleSaveDialpadCount}
        />
      )}

      {currentOrder && (
        <>
          <DamagedCodeModal
            items={currentOrder.items}
            isOpen={isDamagedCodeOpen}
            onClose={() => setIsDamagedCodeOpen(false)}
            onSelectItem={(sku) => setActiveSku(sku)}
          />

          <CameraScannerModal
            items={currentOrder.items}
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onBarcodeDecoded={handleCameraDecoded}
          />
        </>
      )}

      <OrderSelectorModal
        orders={orders}
        activeOrderId={activeOrderId}
        isOpen={isOrderSelectorOpen}
        onClose={() => setIsOrderSelectorOpen(false)}
        onOpenLoadDocument={() => setIsLoadDocOpen(true)}
        onSelectOrder={(id) => {
          setActiveOrderId(id);
          const sel = orders.find((o) => o.id === id);
          if (sel && sel.items.length > 0) {
            setActiveSku(sel.items[0].sku);
          }
        }}
      />

      <LoadDocumentModal
        isOpen={isLoadDocOpen}
        onClose={() => setIsLoadDocOpen(false)}
        currentDocumentNumber={currentOrder?.id || ''}
        lastSyncedDoc={lastSyncedDoc}
        onOrderLoaded={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
          setActiveOrderId(newOrder.id);
          if (newOrder.items.length > 0) {
            setActiveSku(newOrder.items[0].sku);
          }
          playZebraBeep('success', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
          triggerZebraHaptic('success', settings.hapticEnabled);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <OperatorModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* PWA Offline Banner */}
      <OfflineIndicator />
    </div>
  );
}
