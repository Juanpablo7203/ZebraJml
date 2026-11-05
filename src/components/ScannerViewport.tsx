import React, { useState } from 'react';

interface ScannerViewportProps {
  isScanning: boolean;
  onOpenLiveCamera: () => void;
  batteryLevel?: number;
  onManualBarcodeSubmit?: (code: string) => void;
  lastScannedCode?: string;
  documentNumber?: string;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({
  isScanning,
  onOpenLiveCamera,
  onManualBarcodeSubmit,
  documentNumber = '',
}) => {
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;
    onManualBarcodeSubmit?.(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="px-gutter mb-space-sm max-w-5xl mx-auto w-full">
      <div className="bg-surface-container-high rounded-xl p-space-sm shadow-sm border border-outline-variant/40 flex flex-col gap-space-xs">
        {/* Top Scanner Engine Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md font-bold text-primary flex items-center gap-1">
                Lector 2D Integrado (Zebra SE4710)
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse inline-block"></span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                DataWedge v11.4 • Validación Estricta EAN-13
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenLiveCamera}
              className="p-1.5 rounded-md bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              title="Abrir cámara óptica real"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span className="hidden sm:inline">Cámara</span>
            </button>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">sensors</span>
              Listo
            </span>
          </div>
        </div>

        {/* Compact Dark Bar for Active Order Number */}
        <div
          className={`bg-inverse-surface rounded-lg px-3 py-1.5 flex items-center justify-center relative overflow-hidden text-center transition-all duration-200 select-none ${
            isScanning ? 'ring-2 ring-red-500/80 shadow-[inset_0_0_16px_rgba(239,68,68,0.4)]' : ''
          }`}
        >
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center">
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-laser"></div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 z-10 text-xs font-mono">
            <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">
              assignment
            </span>
            <strong className="text-tertiary-fixed-dim font-bold">
              Validando pedido Nro {documentNumber}
            </strong>
          </div>
        </div>

        {/* Dedicated Barcode Verification Input Bar */}
        <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 pt-0.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[18px]">
              barcode_scanner
            </span>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Escanear con gatillo o escribir código de barra / SKU..."
              className="w-full pl-8 pr-2 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs font-mono font-medium text-primary placeholder-on-surface-variant/50 focus:border-secondary focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
            Validar Código
          </button>
        </form>
      </div>
    </div>
  );
};
