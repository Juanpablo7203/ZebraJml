import React, { useState } from 'react';

interface ScannerViewportProps {
  isScanning: boolean;
  onSoftTrigger: () => void;
  onOpenLiveCamera: () => void;
  batteryLevel?: number;
  multiScanMode: boolean;
  onToggleMultiScan: () => void;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({
  isScanning,
  onSoftTrigger,
  onOpenLiveCamera,
  batteryLevel = 94,
  multiScanMode,
  onToggleMultiScan,
}) => {
  const [activeTorch, setActiveTorch] = useState(false);

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
                DataWedge v11.4 • Salida Intent Activa
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenLiveCamera}
              className="p-1.5 rounded-md bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all flex items-center gap-1 text-[11px] font-semibold"
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
          className={`bg-inverse-surface rounded-lg p-space-sm flex flex-col items-center justify-center relative overflow-hidden text-center transition-all duration-200 min-h-[108px] select-none ${
            isScanning ? 'ring-2 ring-red-500/80 shadow-[inset_0_0_24px_rgba(239,68,68,0.4)]' : ''
          }`}
        >
          {/* Subtle Ambient Scan Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-tertiary-fixed/10 to-transparent pointer-events-none"></div>

          {/* Real-time Laser Line Animation when scanning */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
              {/* Red Laser Sweep Line */}
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444,0_0_2px_#ffffff] animate-laser"></div>
              {/* Aiming Crosshair */}
              <div className="absolute w-12 h-12 border border-red-500/60 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
              </div>
            </div>
          )}

          {/* Aiming Beam Label */}
          <div className="flex items-center justify-center gap-2 mb-1 z-10">
            <span className="h-0.5 w-14 bg-gradient-to-r from-transparent to-tertiary-fixed"></span>
            <span className="font-data-mono text-label-sm text-tertiary-fixed-dim font-bold tracking-widest uppercase">
              {isScanning ? 'DECODIFICANDO CÓDIGO...' : 'HAZ LÁSER / PUNTO DE MIRA'}
            </span>
            <span className="h-0.5 w-14 bg-gradient-to-l from-transparent to-tertiary-fixed"></span>
          </div>

          <p className="font-body-sm text-body-sm text-inverse-on-surface/90 max-w-xs z-10">
            Presione el <strong>gatillo físico lateral/pistola</strong> de la terminal Zebra TC27 o
            use el botón virtual.
          </p>

          <div className="mt-2 flex items-center gap-2 z-10 flex-wrap justify-center">
            <button
              type="button"
              onClick={onToggleMultiScan}
              className={`px-2 py-0.5 rounded font-data-mono text-label-sm transition-colors cursor-pointer ${
                multiScanMode
                  ? 'bg-secondary text-on-secondary font-semibold'
                  : 'bg-surface/10 text-inverse-on-surface hover:bg-surface/20'
              }`}
              title="Cambiar entre modo Ráfaga / Individual"
            >
              Modo: {multiScanMode ? 'Ráfaga / Multi-Escaneo' : 'Escaneo Individual'}
            </button>
            <span className="px-2 py-0.5 rounded bg-surface/10 text-inverse-on-surface font-data-mono text-label-sm">
              Batería TC27: {batteryLevel}%
            </span>
            <button
              type="button"
              onClick={() => setActiveTorch(!activeTorch)}
              className={`px-2 py-0.5 rounded font-data-mono text-label-sm transition-colors cursor-pointer flex items-center gap-1 ${
                activeTorch
                  ? 'bg-amber-400 text-slate-900 font-bold'
                  : 'bg-surface/10 text-inverse-on-surface hover:bg-surface/20'
              }`}
              title="Linterna / LED de iluminación del escáner"
            >
              <span className="material-symbols-outlined text-[13px]">
                {activeTorch ? 'flashlight_on' : 'flashlight_off'}
              </span>
              LED {activeTorch ? 'Encendido' : 'Apagado'}
            </button>
          </div>
        </div>

        {/* Big Soft Trigger Button */}
        <button
          type="button"
          onClick={onSoftTrigger}
          className={`w-full py-2.5 px-4 rounded-lg text-on-secondary font-label-md text-label-md font-bold tracking-wide active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            isScanning
              ? 'bg-red-600 shadow-md ring-2 ring-red-400'
              : 'bg-secondary hover:bg-secondary-container active:bg-primary'
          }`}
          id="softTriggerBtn"
          title="Disparar escaneo de código de barras (SE4710)"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isScanning ? 'radar' : 'flash_on'}
          </span>
          {isScanning ? 'LEYENDO CÓDIGO...' : 'DISPARAR LECTOR (GATILLO DIGITAL)'}
        </button>
      </div>
    </div>
  );
};
