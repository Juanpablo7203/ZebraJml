import React from 'react';
import { OrderItem } from '../types';

interface HudScannedCardProps {
  item: OrderItem;
  onOpenDialpad: () => void;
  hasNextItem?: boolean;
  onSkipToNextWithAuth?: () => void;
  lastScannedTime?: string;
}

export const HudScannedCard: React.FC<HudScannedCardProps> = ({
  item,
  onOpenDialpad,
  hasNextItem = false,
  onSkipToNextWithAuth,
}) => {
  const isComplete = item.countedQty >= item.expectedQty;
  const remaining = Math.max(0, item.expectedQty - item.countedQty);

  return (
    <div className="px-gutter mb-space-sm max-w-5xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden border border-outline-variant/30">
        {/* Glow indicator on item status */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-300 ${
            isComplete
              ? 'bg-emerald-600'
              : 'bg-amber-500'
          }`}
        ></div>

        {/* Card Top: Detection Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full ${
                isComplete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-tertiary-container text-on-tertiary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isComplete ? 'check_circle' : 'barcode_scanner'}
              </span>
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {isComplete ? '¡Ítem Completado!' : 'Ítem en Curso'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-data-mono text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-bold">
              {item.symbology || 'EAN-13'}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">qr_code_scanner</span>
              EAN-13
            </span>
          </div>
        </div>

        {/* Product Meta */}
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
              {item.sku}
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Ubicación: <strong className="text-on-surface">{item.location}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono">
            <span className="text-[11px] text-outline">Código EAN-13:</span>
            <strong className="text-on-surface font-semibold">{item.barcode}</strong>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>

        {/* Inventory Comparison Metrics */}
        <div className="grid grid-cols-3 gap-space-xs bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/20">
          {/* A Validar (documento) */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Pedido</span>
            <span className="font-data-mono text-body-lg font-bold text-on-surface text-base sm:text-lg">
              {item.expectedQty} uds
            </span>
          </div>

          {/* Contado por escaneo */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Leído</span>
            <div className="flex flex-col">
              <span className="font-data-mono text-body-lg font-bold text-secondary text-base sm:text-lg">
                {item.countedQty} uds
              </span>
              <span className="font-data-mono text-[10px] text-on-surface-variant">
                {item.countedQty} de {item.expectedQty}
              </span>
            </div>
          </div>

          {/* Estado / Faltantes */}
          <div className="flex flex-col">
            <span
              className={`font-label-sm text-label-sm font-semibold ${
                isComplete ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              Estado
            </span>
            <span
              className={`font-data-mono text-body-lg font-bold text-base sm:text-lg ${
                isComplete ? 'text-emerald-600' : 'text-amber-600'
              }`}
              id="diffQty"
            >
              {isComplete ? 'Completo' : `Faltan ${remaining}`}
            </span>
          </div>
        </div>

        {/* Action Bar: Manual Keypad & Skip with Key */}
        <div className="flex items-center gap-space-xs pt-space-xs flex-wrap sm:flex-nowrap">
          {/* Manual Digitize Button */}
          <button
            type="button"
            onClick={onOpenDialpad}
            className="flex-1 py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px] border border-outline-variant/40"
            id="manualEditBtn"
            title="Digitar manualmente la cantidad del documento"
          >
            <span className="material-symbols-outlined text-[18px]">dialpad</span>
            <span>Digitar Cantidad</span>
          </button>

          {/* Skip to Next Item with Key button (shown when incomplete and there is a next item) */}
          {!isComplete && hasNextItem && onSkipToNextWithAuth && (
            <button
              type="button"
              onClick={onSkipToNextWithAuth}
              className="py-2.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-label-sm text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer min-h-[44px] border border-amber-300 shrink-0"
              title="Continuar con el siguiente ítem ingresando clave de autorización"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>Siguiente (Clave)</span>
            </button>
          )}

          {/* Status Badge */}
          <div
            className={`px-3 py-2 rounded-lg font-label-sm text-xs font-bold flex items-center gap-1 min-h-[44px] shrink-0 border ${
              isComplete
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isComplete ? 'verified' : 'pending'}
            </span>
            <span>{isComplete ? 'Completo' : `${remaining} pend.`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
