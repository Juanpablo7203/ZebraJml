/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OrderStrip } from './components/OrderStrip';
import { ScannerViewport } from './components/ScannerViewport';
import { HudScannedCard } from './components/HudScannedCard';
import { ItemsChecklist } from './components/ItemsChecklist';
import { HandheldUtilities } from './components/HandheldUtilities';
import { BottomNav, NavTab } from './components/BottomNav';
import { HistorialScreen } from './components/screens/HistorialScreen';
import { SincronizarScreen } from './components/screens/SincronizarScreen';
import { AjustesScreen } from './components/screens/AjustesScreen';
import { DialpadModal } from './components/modals/DialpadModal';
import { DamagedCodeModal } from './components/modals/DamagedCodeModal';
import { CameraScannerModal } from './components/modals/CameraScannerModal';
import { OrderSelectorModal } from './components/modals/OrderSelectorModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { OperatorModal } from './components/modals/OperatorModal';
import { LoadDocumentModal } from './components/modals/LoadDocumentModal';
import { OrderDoc, OrderItem, ScanLog, ScannerSettings } from './types';
import { INITIAL_ORDERS, INITIAL_SCAN_LOGS, DEFAULT_SETTINGS } from './data/mockOrders';
import { playZebraBeep, triggerZebraHaptic } from './utils/audioFeedback';
import { fetchPedido } from './services/pedidosApi';

export default function App() {
  const [orders, setOrders] = useState<OrderDoc[]>(INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string>('DOC-2024-8849');
  const [activeSku, setActiveSku] = useState<string>('PROD-4412');
  const [activeTab, setActiveTab] = useState<NavTab>('consultar');
  const [scanLogs, setScanLogs] = useState<ScanLog[]>(INITIAL_SCAN_LOGS);
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Modals state
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const [isDamagedCodeOpen, setIsDamagedCodeOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoadDocOpen, setIsLoadDocOpen] = useState(false);

  // Automatically fetch live Pedido #20 from Railway API on initial mount
  useEffect(() => {
    let isMounted = true;
    fetchPedido(20)
      .then((liveOrder) => {
        if (!isMounted) return;
        setOrders((prev) => [liveOrder, ...prev]);
        setActiveOrderId(liveOrder.id);
        if (liveOrder.items.length > 0) {
          setActiveSku(liveOrder.items[0].sku);
        }
      })
      .catch((err) => {
        console.warn('Initial live API load fallback to mock order:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Active Order & Item references
  const currentOrder = orders.find((o) => o.id === activeOrderId) || orders[0];
  const currentItem =
    currentOrder.items.find((i) => i.sku === activeSku) || currentOrder.items[0];

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

  // Update item count for the current order
  const handleUpdateItemCount = useCallback(
    (targetSku: string, newCount: number, delta: number, method: ScanLog['method']) => {
      const targetItem = currentOrder.items.find((i) => i.sku === targetSku) || currentItem;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== activeOrderId) return order;
          return {
            ...order,
            items: order.items.map((item) => {
              if (item.sku !== targetSku) return item;
              const updatedStatus: OrderItem['status'] =
                newCount === item.expectedQty
                  ? 'ok'
                  : newCount > 0
                  ? 'discrepancy'
                  : 'pending';
              return {
                ...item,
                countedQty: newCount,
                status: updatedStatus,
                lastScannedAt: new Date().toLocaleTimeString(),
              };
            }),
          };
        })
      );

      // Play Zebra decode sound & haptic
      playZebraBeep(
        newCount === targetItem.expectedQty ? 'success' : 'warning',
        settings.bipEnabled,
        settings.bipVolume,
        settings.bipFrequency
      );
      triggerZebraHaptic(
        newCount === targetItem.expectedQty ? 'success' : 'warning',
        settings.hapticEnabled
      );

      // Append log
      logScanAction(
        targetSku,
        targetItem.description,
        targetItem.symbology,
        delta,
        newCount,
        targetItem.expectedQty,
        method
      );
    },
    [activeOrderId, currentOrder.items, currentItem, settings]
  );

  // Soft trigger hardware simulation
  const handleSoftTrigger = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      // Increment 10 or 1 depending on multiScanMode
      const delta = settings.multiScanMode ? 10 : 1;
      const nextCount = currentItem.countedQty + delta;
      handleUpdateItemCount(currentItem.sku, nextCount, delta, 'soft_trigger');
    }, 280);
  }, [isScanning, settings.multiScanMode, currentItem, handleUpdateItemCount]);

  // Quick increments
  const handleAddQty = (delta: number) => {
    const nextCount = currentItem.countedQty + delta;
    handleUpdateItemCount(currentItem.sku, nextCount, delta, 'soft_trigger');
  };

  // Dialpad manual entry save
  const handleSaveDialpadCount = (newCount: number) => {
    const delta = newCount - currentItem.countedQty;
    handleUpdateItemCount(currentItem.sku, newCount, delta, 'dialpad');
  };

  // Verify item button (confirms item, if matches expected, plays celebratory chime)
  const handleVerifyItem = () => {
    if (currentItem.countedQty === currentItem.expectedQty) {
      playZebraBeep('success', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
      triggerZebraHaptic('success', settings.hapticEnabled);
    } else {
      // Prompt user or automatically set as matched if operator wishes to verify
      const diff = currentItem.expectedQty - currentItem.countedQty;
      handleUpdateItemCount(
        currentItem.sku,
        currentItem.expectedQty,
        diff,
        'hardware_trigger'
      );
    }
  };

  const [scanFeedbackNotice, setScanFeedbackNotice] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Barcode / SKU scan decoder handler
  const handleBarcodeDecoded = useCallback(
    (scannedCode: string, method: ScanLog['method'] = 'hardware_trigger') => {
      const clean = scannedCode.trim().toLowerCase();
      const target = currentOrder.items.find(
        (i) => i.barcode.trim().toLowerCase() === clean || i.sku.trim().toLowerCase() === clean
      );
      if (target) {
        setActiveSku(target.sku);
        const nextCount = target.countedQty + 1;
        handleUpdateItemCount(target.sku, nextCount, 1, method);
        setScanFeedbackNotice({
          text: `Lectura OK: ${target.sku} (${scannedCode.trim()}) +1 ud`,
          type: 'success',
        });
      } else {
        playZebraBeep('error', settings.bipEnabled, settings.bipVolume, settings.bipFrequency);
        triggerZebraHaptic('error', settings.hapticEnabled);
        setScanFeedbackNotice({
          text: `Código no encontrado en pedido: "${scannedCode.trim()}"`,
          type: 'error',
        });
      }

      setTimeout(() => {
        setScanFeedbackNotice((prev) => (prev?.text.includes(scannedCode.trim()) ? null : prev));
      }, 3500);
    },
    [currentOrder.items, handleUpdateItemCount, settings]
  );

  // Hardware barcode wedge listener & physical trigger listener (Zebra TC27)
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (isDialpadOpen || isDamagedCodeOpen || isCameraOpen) {
        return;
      }

      const now = Date.now();
      // If keystrokes are spaced out (manual typing pause), clear buffer
      if (now - lastKeyTime > 300) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (keyBuffer.trim().length > 0) {
          const scanned = keyBuffer.trim();
          keyBuffer = '';
          handleBarcodeDecoded(scanned, 'hardware_trigger');
        } else {
          keyBuffer = '';
          handleSoftTrigger();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        keyBuffer = '';
        handleSoftTrigger();
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSoftTrigger, handleBarcodeDecoded, isDialpadOpen, isDamagedCodeOpen, isCameraOpen]);

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
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen relative selection:bg-secondary/20">
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
              className={`max-w-md w-full py-2 px-3 rounded-lg shadow-lg text-xs font-semibold flex items-center justify-between gap-2 border pointer-events-auto ${
                scanFeedbackNotice.type === 'success'
                  ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-fixed'
                  : 'bg-red-50 text-error border-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[18px]">
                  {scanFeedbackNotice.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span className="truncate">{scanFeedbackNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedbackNotice(null)}
                className="text-[14px] opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {activeTab === 'consultar' && (
          <div className="flex flex-col w-full animate-fade-in">
            {/* Status & Document Strip */}
            <OrderStrip
              order={currentOrder}
              onOpenOrderSelector={() => setIsLoadDocOpen(true)}
            />

            {/* Primary Camera & Scanner Viewport Card */}
            <ScannerViewport
              isScanning={isScanning}
              onSoftTrigger={handleSoftTrigger}
              onOpenLiveCamera={() => setIsCameraOpen(true)}
              batteryLevel={94}
              multiScanMode={settings.multiScanMode}
              onToggleMultiScan={() =>
                setSettings((prev) => ({ ...prev, multiScanMode: !prev.multiScanMode }))
              }
            />

            {/* HUD Real-Time Scanned Item Card */}
            <HudScannedCard
              item={currentItem}
              onAddQty={handleAddQty}
              onOpenDialpad={() => setIsDialpadOpen(true)}
              onVerifyItem={handleVerifyItem}
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
              onOpenDamagedCode={() => setIsDamagedCodeOpen(true)}
            />
          </div>
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
            totalUnsyncedCount={
              currentOrder.items.filter((i) => i.status === 'discrepancy' || i.countedQty > 0)
                .length
            }
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
      <DialpadModal
        item={currentItem}
        isOpen={isDialpadOpen}
        onClose={() => setIsDialpadOpen(false)}
        onSaveCount={handleSaveDialpadCount}
      />

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
        currentDocumentNumber={currentOrder.id}
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
    </div>
  );
}
