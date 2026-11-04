import React, { useState } from 'react';

interface HandheldUtilitiesProps {
  bipEnabled: boolean;
  onToggleBip: () => void;
  onCancelAndClearOrder: () => void;
  orderName?: string;
}

export const HandheldUtilities: React.FC<HandheldUtilitiesProps> = ({
  bipEnabled,
  onToggleBip,
  onCancelAndClearOrder,
  orderName,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="px-gutter flex flex-col gap-space-xs max-w-5xl mx-auto w-full">
      <div className="mt-space-sm grid grid-cols-2 gap-space-xs pb-space-lg">
        {/* Cancel & Clear Order Button */}
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center justify-center gap-space-xs py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-error shadow-xs active:bg-red-200 transition-colors border border-red-200 cursor-pointer min-h-[44px]"
          title="Cancelar pedido actual y limpiar pantalla para ingresar otro pedido"
        >
          <span className="material-symbols-outlined text-[18px] text-error">delete_sweep</span>
          <span className="font-label-md text-label-md font-bold truncate">
            Cancelar / Limpiar
          </span>
        </button>

        {/* Haptic / Beep Audio Settings */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest shadow-xs text-on-surface border border-outline-variant/30 min-h-[44px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`material-symbols-outlined text-[18px] ${
                bipEnabled ? 'text-tertiary' : 'text-outline'
              }`}
            >
              {bipEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span className="font-label-sm text-label-sm truncate font-medium">
              Bip y Háptica Zebra
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleBip}
            aria-label="Activar o desactivar sonido y vibración háptica Zebra"
            className={`w-9 h-5 rounded-full relative flex items-center p-0.5 cursor-pointer transition-colors ${
              bipEnabled ? 'bg-primary' : 'bg-outline-variant'
            }`}
            id="feedbackToggle"
            title={bipEnabled ? 'Desactivar Bip & Háptico' : 'Activar Bip & Háptico'}
          >
            <span
              className={`w-4 h-4 rounded-full bg-on-primary shadow-sm transition-transform ${
                bipEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-error text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm font-bold text-error text-sm">
                  ¿Cancelar y limpiar pedido?
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  {orderName || 'Documento actual en curso'}
                </p>
              </div>
            </div>

            <div className="p-4 text-xs text-on-surface leading-relaxed">
              Se descartarán las lecturas no sincronizadas de este documento y se limpiará la pantalla para que puedas consultar e ingresar otro pedido.
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md font-semibold text-xs cursor-pointer transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmOpen(false);
                  onCancelAndClearOrder();
                }}
                className="py-2.5 px-3 rounded-xl bg-error hover:bg-red-700 text-white font-label-md font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                Sí, Limpiar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
