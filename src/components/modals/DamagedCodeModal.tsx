import React, { useState } from 'react';
import { OrderItem } from '../../types';

interface DamagedCodeModalProps {
  items: OrderItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (sku: string) => void;
}

export const DamagedCodeModal: React.FC<DamagedCodeModalProps> = ({
  items,
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = items.filter(
    (item) =>
      item.sku.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.barcode.includes(query) ||
      item.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
            </div>
            <div>
              <h2 className="font-label-md font-bold text-on-surface">
                Entrada Manual / Código Dañado
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Localice el ítem si la etiqueta física está rota o ilegible
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

        {/* Search input */}
        <div className="p-3 bg-surface-container-low border-b border-outline-variant/20">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escriba SKU, dígitos de barra o ubicación..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="p-3 overflow-y-auto flex flex-col gap-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-xs">
              No se encontraron ítems coincidentes en esta orden.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                type="button"
                key={item.sku}
                onClick={() => {
                  onSelectItem(item.sku);
                  onClose();
                }}
                className="p-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono font-bold text-primary text-sm group-hover:text-secondary">
                      {item.sku}
                    </span>
                    <span className="text-[10px] bg-surface-container text-on-surface-variant font-mono px-1 rounded">
                      Ub: {item.location}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant truncate">
                    {item.description}
                  </span>
                  <span className="font-mono text-[10px] text-outline mt-0.5">
                    Código: {item.barcode}
                  </span>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="font-data-mono text-xs font-bold text-on-surface">
                    {item.countedQty} / {item.expectedQty}
                  </span>
                  <span className="text-[11px] text-secondary font-semibold group-hover:underline">
                    Seleccionar
                  </span>
                </div>
              </button>
            ))
          )}
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
