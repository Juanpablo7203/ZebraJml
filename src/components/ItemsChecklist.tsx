import React, { useState } from 'react';
import { OrderItem } from '../types';

interface ItemsChecklistProps {
  items: OrderItem[];
  activeSku: string;
  onSelectItem: (sku: string) => void;
}

export const ItemsChecklist: React.FC<ItemsChecklistProps> = ({
  items,
  activeSku,
  onSelectItem,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="px-gutter flex flex-col gap-space-xs max-w-5xl mx-auto w-full">
      {/* Collapsible Checklist Header */}
      <div
        className="flex items-center justify-between px-space-xs py-space-xs cursor-pointer select-none"
        id="listToggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-secondary text-[20px]">
            checklist_rtl
          </span>
          <span className="font-label-lg text-label-lg text-on-surface font-semibold">
            Ítems de la Orden
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
            {items.length} SKU
          </span>
        </div>

        <div className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="font-label-sm text-label-sm">
            {isCollapsed ? 'Expandir' : 'Colapsar'}
          </span>
          <span
            className="material-symbols-outlined text-[18px] transition-transform duration-200"
            id="chevronIcon"
          >
            {isCollapsed ? 'expand_more' : 'expand_less'}
          </span>
        </div>
      </div>

      {/* Scrollable Items List Container */}
      {!isCollapsed && (
        <div
          className="flex flex-col gap-space-xs transition-all duration-300"
          id="itemsContainer"
        >
          {items.map((item) => {
            const isCompleted = item.countedQty >= item.expectedQty;
            const isStarted = item.countedQty > 0;
            const isSelected = item.sku === activeSku;
            const pendingQty = item.expectedQty - item.countedQty;

            return (
              <button
                type="button"
                key={item.sku}
                onClick={() => onSelectItem(item.sku)}
                className={`text-left w-full rounded-lg p-space-sm shadow-xs flex items-center justify-between transition-all cursor-pointer min-h-[52px] border ${
                  isSelected
                    ? 'bg-surface-container-high border-secondary/50 shadow-sm ring-1 ring-secondary/30'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                }`}
              >
                {/* Left: Status icon & item name */}
                <div className="flex items-center gap-space-sm min-w-0 pr-2">
                  {/* Status Indicator Icon */}
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                  ) : isStarted ? (
                    <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 animate-pulse">
                      <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface-container text-outline flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-data-mono text-label-md font-bold truncate ${
                          isSelected ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {item.sku}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-secondary/10 text-secondary font-semibold px-1 rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* Right: Quantities & Status text */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span
                    className={`font-data-mono text-label-md font-bold ${
                      isCompleted
                        ? 'text-on-tertiary-container'
                        : isStarted
                        ? 'text-secondary'
                        : 'text-outline'
                    }`}
                  >
                    {item.countedQty} / {item.expectedQty}
                  </span>

                  {isCompleted ? (
                    <span className="font-label-sm text-label-sm text-outline">100% OK</span>
                  ) : isStarted ? (
                    <span className="font-label-sm text-label-sm text-error font-semibold">
                      -{pendingQty} pendientes
                    </span>
                  ) : (
                    <span className="font-label-sm text-label-sm text-outline">Sin iniciar</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
