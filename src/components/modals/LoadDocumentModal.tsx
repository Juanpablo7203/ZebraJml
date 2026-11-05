import React, { useState, useEffect } from 'react';
import { fetchPedido } from '../../services/pedidosApi';
import { OrderDoc } from '../../types';
import { LastSyncedDocInfo } from '../screens/SincronizarScreen';

interface LoadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderLoaded: (order: OrderDoc) => void;
  currentDocumentNumber?: string;
  lastSyncedDoc?: LastSyncedDocInfo | null;
}

export const LoadDocumentModal: React.FC<LoadDocumentModalProps> = ({
  isOpen,
  onClose,
  onOrderLoaded,
  currentDocumentNumber = '',
  lastSyncedDoc = null,
}) => {
  const [docNumber, setDocNumber] = useState(
    currentDocumentNumber.replace(/\D/g, '') || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDocNumber(currentDocumentNumber.replace(/\D/g, '') || '');
      setErrorMessage(null);
    }
  }, [isOpen, currentDocumentNumber]);

  if (!isOpen) return null;

  const handleFetch = async () => {
    const docToLoad = docNumber.trim();
    if (!docToLoad) {
      setErrorMessage('Por favor ingrese el número del pedido a consultar');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const order = await fetchPedido(docToLoad);
      onOrderLoaded(order);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error al consultar el pedido en el servidor'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">cloud_download</span>
            </div>
            <div>
              <h2 className="font-headline-sm font-bold text-on-surface text-base">
                Consultar Pedido
              </h2>
              <p className="text-xs text-on-surface-variant">
                Extracción directa desde API Servidor (/api/pedido/:doc/001)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 flex flex-col gap-3.5 overflow-y-auto">
          {lastSyncedDoc && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0">
                verified
              </span>
              <div className="flex flex-col text-xs">
                <span className="font-bold text-emerald-900">
                  Último documento leído y sincronizado: Pedido #{lastSyncedDoc.docNumber}
                </span>
                <span className="text-[11px] text-emerald-800">
                  {lastSyncedDoc.itemsCount} SKUs ({lastSyncedDoc.totalUnits} uds) • {lastSyncedDoc.syncedAt}
                </span>
              </div>
            </div>
          )}

          {/* Document Number Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="docInput" className="font-label-md font-semibold text-on-surface text-xs">
              Número del Documento / Pedido:
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-primary text-[20px]">
                tag
              </span>
              <input
                id="docInput"
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={docNumber}
                onChange={(e) => {
                  setDocNumber(e.target.value.replace(/\D/g, ''));
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFetch();
                  }
                }}
                placeholder="Ingresa el número de documento (Ej: 20)"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-2 border-outline-variant/40 focus:border-secondary rounded-xl text-base font-data-mono font-bold text-primary placeholder-on-surface-variant/50 focus:outline-none transition-all"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Solo se consultan pedidos reales registrados en la base de datos de la API.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error flex flex-col gap-1.5 animate-fade-in">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-error">Error al consultar pedido</span>
                  <span className="text-[11px] text-on-surface leading-tight mt-0.5">{errorMessage}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md font-semibold text-center transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleFetch}
            disabled={isLoading || !docNumber.trim()}
            className={`flex-2 py-2.5 px-4 rounded-xl font-label-md font-bold text-white tracking-wide active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isLoading || !docNumber.trim()
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-primary hover:bg-secondary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}
            >
              {isLoading ? 'progress_activity' : 'cloud_download'}
            </span>
            {isLoading ? 'Consultando...' : 'Consultar en API'}
          </button>
        </div>
      </div>
    </div>
  );
};
