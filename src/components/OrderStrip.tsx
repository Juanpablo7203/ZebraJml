import React from 'react';
import { OrderDoc } from '../types';

interface OrderStripProps {
  order: OrderDoc;
  onOpenOrderSelector: () => void;
}

export const OrderStrip: React.FC<OrderStripProps> = ({ order, onOpenOrderSelector }) => {
  const totalItems = order.items.length;
  const processedItems = order.items.filter((item) => item.countedQty >= item.expectedQty).length;
  const percentage = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;

  return (
    <div className="px-gutter pt-space-xs pb-space-sm flex flex-col gap-space-xs max-w-5xl mx-auto w-full">
      <div className="bg-surface-container-high rounded-xl p-space-sm shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenOrderSelector}
          className="flex items-center gap-space-sm min-w-0 text-left group cursor-pointer focus:outline-none"
          title="Cambiar o seleccionar otra orden de auditoría"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                Orden Activa
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-data-mono text-data-mono font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                {order.id}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                unfold_more
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {processedItems} de {totalItems} ítems procesados ({percentage}%)
            </p>
          </div>
        </button>

        <div className="flex items-center gap-space-xs flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-ping"></span>
            {percentage === 100 ? 'Completada' : 'Auditando'}
          </span>
        </div>
      </div>

      {/* Progress Indicator Strip */}
      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-secondary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
