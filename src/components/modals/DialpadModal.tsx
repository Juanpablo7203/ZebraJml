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
  const maxAllowed = item.expectedQty;
  const [valueStr, setValueStr] = useState<string>(
    Math.min(maxAllowed, item.countedQty).toString()
  );
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVal = parseInt(valueStr, 10) || 0;

  const handleDigit = (digit: string) => {
    setWarningMsg(null);
    const candidateStr = valueStr === '0' ? digit : valueStr + digit;
    const candidateNum = parseInt(candidateStr, 10);

    if (candidateNum > maxAllowed) {
      // Strictly prevent entering more than document has!
      setValueStr(maxAllowed.toString());
      setWarningMsg(`Límite máximo: ${maxAllowed} uds (según documento). No se permite sobreconteo.`);
      return;
    }

    if (candidateStr.length <= 6) {
      setValueStr(candidateStr);
    }
  };

  const handleBackspace = () => {
    setWarningMsg(null);
    if (valueStr.length <= 1) {
      setValueStr('0');
    } else {
      setValueStr(valueStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setWarningMsg(null);
    setValueStr('0');
  };

  const handleQuickAdd = (amount: number) => {
    setWarningMsg(null);
    const current = parseInt(valueStr, 10) || 0;
    const nextVal = current + amount;
    if (nextVal > maxAllowed) {
      setValueStr(maxAllowed.toString());
      setWarningMsg(`Ajustado al máximo del documento (${maxAllowed} uds).`);
    } else {
      setValueStr(nextVal.toString());
    }
  };

  const handleSetMax = () => {
    setWarningMsg(null);
    setValueStr(maxAllowed.toString());
  };

  const handleConfirm = () => {
    const parsed = parseInt(valueStr, 10) || 0;
    const finalCount = Math.max(0, Math.min(maxAllowed, parsed));
    onSaveCount(finalCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-secondary uppercase font-bold tracking-wider text-[11px]">
              Digitar Cantidad Manualmente
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
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
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
              / {maxAllowed} uds
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs mt-1 text-on-surface-variant">
            <span>En Pedido: <strong className="text-on-surface">{maxAllowed} uds</strong></span>
            <span>·</span>
            <span>
              Faltan:{' '}
              <strong
                className={
                  currentVal === maxAllowed
                    ? 'text-emerald-600 font-bold'
                    : 'text-amber-600 font-bold'
                }
              >
                {Math.max(0, maxAllowed - currentVal)} uds
              </strong>
            </span>
          </div>

          {/* Warning Message if user attempted to exceed */}
          {warningMsg && (
            <div className="mt-2 py-1 px-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-error font-semibold text-center flex items-center gap-1 animate-fade-in">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Quick Increment Chips (Capped at maxAllowed) */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
            {maxAllowed >= 5 && (
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                disabled={currentVal >= maxAllowed}
                className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer disabled:opacity-40"
              >
                +1
              </button>
            )}
            {maxAllowed >= 10 && (
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                disabled={currentVal >= maxAllowed}
                className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer disabled:opacity-40"
              >
                +5
              </button>
            )}
            {maxAllowed >= 20 && (
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                disabled={currentVal >= maxAllowed}
                className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors cursor-pointer disabled:opacity-40"
              >
                +10
              </button>
            )}
            <button
              type="button"
              onClick={handleSetMax}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              = Total ({maxAllowed})
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

        {/* Note on limit */}
        <div className="px-4 py-1 text-[11px] text-center text-on-surface-variant font-medium bg-surface-container-lowest">
          Máximo permitido: <strong>{maxAllowed} uds</strong> (según pedido)
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
