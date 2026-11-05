import React, { useState, useMemo } from 'react';
import { OrderDoc } from '../../types';
import { confirmarPedido, ConfirmarItemPayload } from '../../services/pedidosApi';
import { playZebraBeep, triggerZebraHaptic } from '../../utils/audioFeedback';

export interface LastSyncedDocInfo {
  docNumber: string;
  orderId: string;
  orderName: string;
  syncedAt: string;
  itemsCount: number;
  totalUnits: number;
}

interface SincronizarScreenProps {
  bipEnabled: boolean;
  hapticEnabled?: boolean;
  currentOrder: OrderDoc | null;
  lastSyncedDoc: LastSyncedDocInfo | null;
  onSyncSuccess: (info: LastSyncedDocInfo) => void;
  onOpenLoadDocument: () => void;
}

export const SincronizarScreen: React.FC<SincronizarScreenProps> = ({
  bipEnabled,
  hapticEnabled = true,
  currentOrder,
  lastSyncedDoc,
  onSyncSuccess,
  onOpenLoadDocument,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const docNumber = useMemo(() => {
    if (!currentOrder) return '';
    return currentOrder.id.replace(/\D/g, '') || currentOrder.id;
  }, [currentOrder]);

  const sucursal = '001';

  // Build the exact JSON body required: only send codes that have a counted quantity (> 0)
  const payload: ConfirmarItemPayload[] = useMemo(() => {
    if (!currentOrder) return [];
    return currentOrder.items
      .filter((item) => item.countedQty > 0)
      .map((item) => ({
        codigo: item.sku,
        cantidad: item.countedQty,
      }));
  }, [currentOrder]);

  const handleConfirmSync = async () => {
    if (isSyncing || !currentOrder || !docNumber) return;

    if (payload.length === 0) {
      setSyncResult({
        type: 'error',
        message: 'No hay códigos con cantidad leída (> 0) para enviar.',
      });
      playZebraBeep('error', bipEnabled);
      triggerZebraHaptic('error', hapticEnabled);
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await confirmarPedido(docNumber, payload, sucursal);
      const nowTime = new Date().toLocaleTimeString();
      const totalUnits = payload.reduce((acc, item) => acc + item.cantidad, 0);

      playZebraBeep('success', bipEnabled);
      triggerZebraHaptic('success', hapticEnabled);

      setSyncResult({
        type: 'success',
        message: response.mensaje || `Confirmación enviada exitosamente para el Pedido #${docNumber}.`,
      });

      // Notify parent to clear current order and store last synced document info
      onSyncSuccess({
        docNumber,
        orderId: currentOrder.id,
        orderName: currentOrder.name,
        syncedAt: nowTime,
        itemsCount: payload.length,
        totalUnits,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al enviar la confirmación al servidor.';
      setSyncResult({
        type: 'error',
        message: msg,
      });
      playZebraBeep('error', bipEnabled);
      triggerZebraHaptic('error', hapticEnabled);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-sm px-gutter py-space-sm max-w-5xl mx-auto w-full animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">cloud_upload</span>
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
            Sincronizar y Confirmar Pedido
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Envío de cantidades leídas a Gestión Comercial.
        </p>
      </div>

      {/* Last Synced Document Banner */}
      {lastSyncedDoc && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Último Documento Leído y Sincronizado
              </span>
              <span className="font-data-mono text-sm font-extrabold text-emerald-950">
                Pedido #{lastSyncedDoc.docNumber} ({lastSyncedDoc.orderId})
              </span>
              <span className="text-xs text-emerald-800">
                {lastSyncedDoc.itemsCount} SKUs ({lastSyncedDoc.totalUnits} uds) • Sincronizado a las {lastSyncedDoc.syncedAt}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLoadDocument}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Nuevo Pedido
          </button>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Número de Pedido</span>
            <span className="font-data-mono text-sm font-bold text-on-surface">
              {docNumber ? `#${docNumber}` : 'Esperando nuevo'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Sucursal</span>
            <span className="font-data-mono text-sm font-bold text-on-surface">
              {sucursal}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Ítems con Cantidad</span>
            <span className="font-data-mono text-sm font-bold text-secondary">
              {payload.length} SKUs
            </span>
          </div>
        </div>
      </div>

      {/* Sync Action Card */}
      <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
        {!currentOrder ? (
          <div className="p-5 bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant/40 text-center flex flex-col items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">find_in_page</span>
            <p className="text-xs text-on-surface font-semibold">
              Pantalla limpia y lista para un nuevo documento.
            </p>
            <button
              type="button"
              onClick={onOpenLoadDocument}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              Consultar Nuevo Documento
            </button>
          </div>
        ) : payload.length === 0 ? (
          <div className="p-4 bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant/40 text-center text-xs text-on-surface-variant">
            Aún no hay códigos con cantidad leída mayor a 0 en este pedido.
          </div>
        ) : null}

        {/* Sync Feedback Banner */}
        {syncResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
              syncResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-200 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
              {syncResult.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div className="flex flex-col">
              <span className="font-bold">
                {syncResult.type === 'success'
                  ? '¡Confirmación enviada con éxito!'
                  : 'Error al sincronizar pedido'}
              </span>
              <span className="text-[11px] mt-0.5 leading-snug">{syncResult.message}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirmSync}
          disabled={isSyncing || !currentOrder || payload.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-label-md font-bold text-white tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm ${
            isSyncing || !currentOrder || payload.length === 0
              ? 'bg-slate-400 cursor-not-allowed opacity-60'
              : 'bg-primary hover:bg-secondary cursor-pointer'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin' : ''}`}
          >
            {isSyncing ? 'progress_activity' : 'send'}
          </span>
          {isSyncing
            ? 'ENVIANDO CONFIRMACIÓN...'
            : `SINCRONIZAR PEDIDO #${docNumber || ''}`}
        </button>
      </div>
    </div>
  );
};
