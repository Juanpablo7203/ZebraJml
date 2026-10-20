import React from 'react';
import { OrderItem } from '../types';

interface HudScannedCardProps {
  item: OrderItem;
  onAddQty: (delta: number) => void;
  onOpenDialpad: () => void;
  onVerifyItem: () => void;
  lastScannedTime?: string;
}

export const HudScannedCard: React.FC<HudScannedCardProps> = ({
  item,
  onAddQty,
  onOpenDialpad,
  onVerifyItem,
}) => {
  const discrepancy = item.countedQty - item.expectedQty;
  const isConforming = discrepancy === 0;
  const isSurplus = discrepancy > 0;

  return (
    <div className="px-gutter mb-space-sm max-w-5xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden border border-outline-variant/30">
        {/* Glow indicator on successful detection */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-300 ${
            isConforming
              ? 'bg-on-tertiary-container'
              : isSurplus
              ? 'bg-secondary'
              : 'bg-tertiary-fixed-dim'
          }`}
        ></div>

        {/* Card Top: Detection Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              ¡Lectura Confirmada!
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-data-mono text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-bold">
              {item.symbology || 'EAN-128'}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">hardware</span>
              Zebra HW
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
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
            {item.description}
          </p>
        </div>

        {/* Inventory Comparison Metrics */}
        <div className="grid grid-cols-3 gap-space-xs bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/20">
          {/* Esperado */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Esperado</span>
            <span className="font-data-mono text-body-lg font-bold text-on-surface text-base sm:text-lg">
              {item.expectedQty} uds
            </span>
          </div>

          {/* Contado */}
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Contado</span>
            <div className="flex flex-col">
              <span className="font-data-mono text-body-lg font-bold text-secondary text-base sm:text-lg">
                {item.countedQty} uds
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-data-mono text-[10px] text-secondary bg-surface-container px-1 rounded font-semibold">
                  {item.symbology}
                </span>
                <span className="font-label-sm text-[10px] text-on-tertiary-container bg-tertiary-container px-1 rounded font-medium flex items-center">
                  HW
                </span>
              </div>
            </div>
          </div>

          {/* Discrepancia */}
          <div className="flex flex-col">
            <span
              className={`font-label-sm text-label-sm ${
                isConforming
                  ? 'text-on-tertiary-container font-semibold'
                  : isSurplus
                  ? 'text-secondary font-semibold'
                  : 'text-error font-semibold'
              }`}
            >
              Discrepancia
            </span>
            <span
              className={`font-data-mono text-body-lg font-bold text-base sm:text-lg ${
                isConforming
                  ? 'text-on-tertiary-container'
                  : isSurplus
                  ? 'text-secondary'
                  : 'text-error'
              }`}
              id="diffQty"
            >
              {isConforming ? 'Conforme' : isSurplus ? `+${discrepancy} uds` : `${discrepancy} uds`}
            </span>
          </div>
        </div>

        {/* Fast Quantity Increment & Adjustment Strip */}
        <div className="flex items-center gap-space-xs pt-space-xs flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => onAddQty(1)}
            className="flex-1 py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-xs cursor-pointer min-h-[44px]"
            id="addOneBtn"
            title="Sumar 1 unidad"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>1 ud
          </button>

          <button
            type="button"
            onClick={() => onAddQty(10)}
            className="flex-1 py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-xs cursor-pointer min-h-[44px]"
            id="addTenBtn"
            title="Sumar 10 unidades"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>10 uds
          </button>

          <button
            type="button"
            onClick={onOpenDialpad}
            className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-label-md text-label-md active:scale-95 transition-transform flex items-center justify-center shadow-xs cursor-pointer min-h-[44px] min-w-[44px]"
            id="manualEditBtn"
            title="Modificar cantidad manualmente con teclado numérico"
          >
            <span className="material-symbols-outlined text-[18px]">dialpad</span>
          </button>

          <button
            type="button"
            onClick={onVerifyItem}
            className={`flex-2 py-2 px-4 rounded-lg font-label-md text-label-md font-bold tracking-wide active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer min-h-[44px] ${
              isConforming
                ? 'bg-tertiary-container text-on-tertiary-container ring-1 ring-tertiary-fixed'
                : 'bg-primary hover:bg-secondary text-on-primary'
            }`}
            id="confirmMatchBtn"
            title="Confirmar y verificar SKU en la orden"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isConforming ? 'verified' : 'done_all'}
            </span>
            {isConforming ? 'Verificado OK' : 'Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
};
