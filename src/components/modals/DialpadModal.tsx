import React, { useState } from 'react';
import { OrderItem } from '../../types';

interface DialpadModalProps {
  item: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveCount: (newCount: number) => void;
}

export const DialpadModal: React.FC<DialpadModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveCount,
}) => {
  const [valueStr, setValueStr] = useState<string>(item.countedQty.toString());

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (valueStr === '0') {
      setValueStr(digit);
    } else {
      if (valueStr.length < 6) {
        setValueStr(valueStr + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (valueStr.length <= 1) {
      setValueStr('0');
    } else {
      setValueStr(valueStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setValueStr('0');
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseInt(valueStr, 10) || 0;
    setValueStr((current + amount).toString());
  };

  const handleConfirm = () => {
    const parsed = parseInt(valueStr, 10) || 0;
    onSaveCount(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-secondary uppercase font-bold tracking-wider">
              Ajuste Manual de Cantidad
            </span>
            <span className="font-data-mono font-bold text-primary text-base">
              {item.sku}
            </span>
            <span className="text-xs text-on-surface-variant truncate max-w-[240px]">
              {item.description}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Display Box */}
        <div className="p-4 bg-surface-container-low flex flex-col items-center justify-center border-b border-outline-variant/20">
          <div className="flex items-baseline gap-2">
            <span className="font-data-mono text-3xl font-extrabold text-primary">
              {valueStr}
            </span>
            <span className="font-label-sm text-on-surface-variant text-sm font-semibold">
              uds
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs mt-1 text-on-surface-variant">
            <span>Esperado: <strong className="text-on-surface">{item.expectedQty} uds</strong></span>
            <span>·</span>
            <span>
              Diferencia:{' '}
              <strong
                className={
                  parseInt(valueStr, 10) === item.expectedQty
                    ? 'text-on-tertiary-container'
                    : parseInt(valueStr, 10) > item.expectedQty
                    ? 'text-secondary'
                    : 'text-error'
                }
              >
                {parseInt(valueStr, 10) - item.expectedQty} uds
              </strong>
            </span>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => handleQuickAdd(5)}
              className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(25)}
              className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              +25
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(100)}
              className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              +100
            </button>
            <button
              type="button"
              onClick={() => setValueStr(item.expectedQty.toString())}
              className="px-2 py-1 bg-tertiary-container hover:bg-tertiary-fixed text-on-tertiary-container rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              = Esperado ({item.expectedQty})
            </button>
          </div>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="p-3 grid grid-cols-3 gap-2 bg-surface-container-lowest">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              type="button"
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high active:bg-secondary active:text-white font-data-mono text-xl font-bold text-on-surface flex items-center justify-center shadow-xs transition-colors cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-error font-label-md font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none"
          >
            C
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high active:bg-secondary active:text-white font-data-mono text-xl font-bold text-on-surface flex items-center justify-center shadow-xs transition-colors cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer select-none"
            title="Borrar dígito"
          >
            <span className="material-symbols-outlined text-[20px]">backspace</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md font-semibold text-center transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="py-3 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-label-md font-bold text-center transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Guardar Cantidad
          </button>
        </div>
      </div>
    </div>
  );
};
