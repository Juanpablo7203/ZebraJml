import React, { useState, useEffect, useRef } from 'react';
import { OrderItem } from '../../types';
import { fetchPassAlto } from '../../services/pedidosApi';

interface SkipItemAuthModalProps {
  isOpen: boolean;
  blockingItem: OrderItem | null;
  targetItem: OrderItem | null;
  pendingScanCode?: string | null;
  onClose: () => void;
  onAuthorized: () => void;
}

export const SkipItemAuthModal: React.FC<SkipItemAuthModalProps> = ({
  isOpen,
  blockingItem,
  targetItem,
  pendingScanCode,
  onClose,
  onAuthorized,
}) => {
  const [inputPass, setInputPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cachedServerPass, setCachedServerPass] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputPass('');
      setErrorMsg(null);
      setIsVerifying(false);

      // Pre-fetch clave from /api/loadpassalto on open for fast validation
      fetchPassAlto()
        .then((pass) => {
          setCachedServerPass(pass);
        })
        .catch(() => {
          // Will retry on submit if pre-fetch fails
          setCachedServerPass(null);
        });

      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, blockingItem?.sku, targetItem?.sku]);

  if (!isOpen || !blockingItem) return null;

  const cleanString = (val: string) =>
    val
      .replace(/^\][a-zA-Z0-9]{2}/, '')
      .replace(/[\r\n\t\x00-\x1F\x7F]/g, '')
      .trim();

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = cleanString(inputPass);
    if (!entered) {
      setErrorMsg('Ingresa la clave de autorización para continuar.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const validPass = cachedServerPass || (await fetchPassAlto());
      setCachedServerPass(validPass);

      if (entered === cleanString(validPass)) {
        onAuthorized();
      } else {
        setErrorMsg('Clave incorrecta. No coincide con la clave de autorización del servidor.');
        setInputPass('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error al consultar la clave en el servidor (/api/loadpassalto).'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const remaining = Math.max(0, blockingItem.expectedQty - blockingItem.countedQty);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">lock_clock</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface leading-tight">
                Validación en Orden
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Se requiere clave para saltar el ítem en curso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Incomplete Item Warning Box */}
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
              Ítem en curso incompleto
            </span>
            <span className="font-data-mono font-extrabold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
              {blockingItem.countedQty} / {blockingItem.expectedQty} uds (Faltan {remaining})
            </span>
          </div>
          <div className="font-data-mono font-bold text-amber-950 text-sm">
            {blockingItem.sku}{' '}
            <span className="font-normal text-[11px] text-amber-800">
              · Barra: {blockingItem.barcode}
            </span>
          </div>
          <div className="text-[11px] text-amber-900 truncate">{blockingItem.description}</div>
        </div>

        {/* Target Item Info */}
        {targetItem && (
          <div className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant font-semibold">
                Continuar con siguiente ítem:
              </span>
              <span className="font-data-mono font-bold text-primary truncate">
                {targetItem.sku} — {targetItem.description}
              </span>
            </div>
            {pendingScanCode && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-mono text-[10px] font-bold shrink-0">
                +1 Escaneo
              </span>
            )}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="authPassInput"
              className="text-xs font-bold text-on-surface flex items-center justify-between"
            >
              <span>Clave de Autorización</span>
              <span className="text-[10px] font-normal text-on-surface-variant">
                Digitar o escanear clave
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 pointer-events-none">
                key
              </span>
              <input
                ref={inputRef}
                id="authPassInput"
                type={showPass ? 'text' : 'password'}
                value={inputPass}
                onChange={(e) => {
                  setInputPass(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ingresa o escanea la clave..."
                autoComplete="off"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none font-data-mono text-sm text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                tabIndex={-1}
                aria-label="Mostrar u ocultar clave"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-error text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="py-2.5 px-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isVerifying ? 'sync' : 'lock_open'}
              </span>
              <span>{isVerifying ? 'Validando...' : 'Autorizar y Continuar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
