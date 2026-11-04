import React, { useState } from 'react';

interface ScannerViewportProps {
  isScanning: boolean;
  onOpenLiveCamera: () => void;
  batteryLevel?: number;
  onManualBarcodeSubmit?: (code: string) => void;
  lastScannedCode?: string;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({
  isScanning,
  onOpenLiveCamera,
  batteryLevel = 94,
  onManualBarcodeSubmit,
  lastScannedCode,
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

        {/* Viewport Dark Rugged Target Area */}
        <div
          className={`bg-inverse-surface rounded-lg p-space-sm flex flex-col items-center justify-center relative overflow-hidden text-center transition-all duration-200 min-h-[100px] select-none ${
            isScanning ? 'ring-2 ring-red-500/80 shadow-[inset_0_0_24px_rgba(239,68,68,0.4)]' : ''
          }`}
        >
          {/* Ambient Scan Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-tertiary-fixed/10 to-transparent pointer-events-none"></div>

          {/* Real-time Laser Line Animation when scanning */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444,0_0_2px_#ffffff] animate-laser"></div>
              <div className="absolute w-12 h-12 border border-red-500/60 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
              </div>
            </div>
          )}

          {/* Aiming Beam Label */}
          <div className="flex items-center justify-center gap-2 mb-1 z-10">
            <span className="h-0.5 w-14 bg-gradient-to-r from-transparent to-tertiary-fixed"></span>
            <span className="font-data-mono text-label-sm text-tertiary-fixed-dim font-bold tracking-widest uppercase">
              {isScanning ? 'DECODIFICANDO CÓDIGO...' : 'HAZ LÁSER ACTIVO'}
            </span>
            <span className="h-0.5 w-14 bg-gradient-to-l from-transparent to-tertiary-fixed"></span>
          </div>

          <p className="font-body-sm text-body-sm text-inverse-on-surface/90 max-w-xs z-10 text-xs">
            Apunta al código de barras y presiona el <strong>gatillo físico lateral</strong> de la Zebra TC27.
          </p>

          <div className="mt-1.5 flex items-center gap-2 z-10 flex-wrap justify-center text-[11px]">
            {lastScannedCode && (
              <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-mono font-bold flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[13px]">qr_code</span>
                Último leído: {lastScannedCode}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface/10 text-inverse-on-surface font-data-mono font-medium">
              +1 por código válido (EAN-13)
            </span>
            <span className="px-2 py-0.5 rounded bg-surface/10 text-inverse-on-surface font-data-mono">
              TC27: {batteryLevel}%
            </span>
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
