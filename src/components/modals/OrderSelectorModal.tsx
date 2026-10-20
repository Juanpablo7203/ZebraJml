import React from 'react';
import { OrderDoc } from '../../types';

interface OrderSelectorModalProps {
  orders: OrderDoc[];
  activeOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const OrderSelectorModal: React.FC<OrderSelectorModalProps> = ({
  orders,
  activeOrderId,
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
            </div>
            <div>
              <h2 className="font-label-md font-bold text-on-surface">Seleccionar Orden Activa</h2>
              <p className="text-[11px] text-on-surface-variant">
                Documentos asignados a esta terminal Zebra TC27
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Order List */}
        <div className="p-3 overflow-y-auto flex flex-col gap-2.5">
          {orders.map((order) => {
            const isSelected = order.id === activeOrderId;
            const completed = order.items.filter((i) => i.countedQty >= i.expectedQty).length;
            const total = order.items.length;
            const pct = Math.round((completed / total) * 100);

            return (
              <button
                type="button"
                key={order.id}
                onClick={() => {
                  onSelectOrder(order.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container-high border-secondary shadow-sm ring-1 ring-secondary/40'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono font-bold text-primary text-base">
                      {order.id}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-white font-label-sm text-[10px] font-bold">
                        En curso
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-on-surface-variant font-medium">
                    {order.bay}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{order.name}</span>
                  <span>{order.type}</span>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-on-surface-variant">
                      {completed} de {total} ítems completados
                    </span>
                    <span className="font-bold text-secondary">{pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-on-surface-variant"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
