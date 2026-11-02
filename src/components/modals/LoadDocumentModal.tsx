import React, { useState } from 'react';
import { fetchPedido } from '../../services/pedidosApi';
import { OrderDoc } from '../../types';

interface LoadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderLoaded: (order: OrderDoc) => void;
  currentDocumentNumber?: string;
}

export const LoadDocumentModal: React.FC<LoadDocumentModalProps> = ({
  isOpen,
  onClose,
  onOrderLoaded,
  currentDocumentNumber = '',
}) => {
  const [docNumber, setDocNumber] = useState(
    currentDocumentNumber.replace(/\D/g, '') || '20'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetch = async (targetDoc?: string) => {
    const docToLoad = targetDoc || docNumber;
    if (!docToLoad.trim()) {
      setErrorMessage('Por favor ingrese un número de documento válido');
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
          : 'Error al conectar con la API de pedidos'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">assignment</span>
            </div>
            <div>
              <h2 className="font-headline-sm font-bold text-on-surface text-base">
                Cargar Pedido
              </h2>
              <p className="text-xs text-on-surface-variant">
                Ingrese el número de pedido a auditar
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
                placeholder="Ejemplo: 20, 10, 100, 1..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-2 border-outline-variant/40 focus:border-secondary rounded-xl text-base font-data-mono font-bold text-primary placeholder-on-surface-variant/50 focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5">
                error
              </span>
              <div className="flex flex-col">
                <span className="font-bold">No se pudo cargar el documento</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Quick Suggestions for Testing */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Accesos rápidos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['20', '10', '100', '1'].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setDocNumber(preset);
                    handleFetch(preset);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    docNumber === preset
                      ? 'bg-secondary text-white border-secondary shadow-xs'
                      : 'bg-surface-container-low text-primary border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  Pedido #{preset}
                </button>
              ))}
            </div>
          </div>
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
            onClick={() => handleFetch()}
            disabled={isLoading}
            className={`flex-2 py-2.5 px-4 rounded-xl font-label-md font-bold text-white tracking-wide active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-primary hover:bg-secondary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}
            >
              {isLoading ? 'progress_activity' : 'cloud_download'}
            </span>
            {isLoading ? 'Consultando...' : 'Consultar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};
