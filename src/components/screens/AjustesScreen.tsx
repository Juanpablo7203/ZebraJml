import React from 'react';
import { ScannerSettings } from '../../types';
import { playZebraBeep, triggerZebraHaptic } from '../../utils/audioFeedback';

interface AjustesScreenProps {
  settings: ScannerSettings;
  onUpdateSettings: (newSettings: Partial<ScannerSettings>) => void;
}

export const AjustesScreen: React.FC<AjustesScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const testBeep = () => {
    playZebraBeep('success', true, settings.bipVolume, settings.bipFrequency);
    triggerZebraHaptic('success', settings.hapticEnabled);
  };

  const toggleSymbology = (key: keyof ScannerSettings['symbologies']) => {
    onUpdateSettings({
      symbologies: {
        ...settings.symbologies,
        [key]: !settings.symbologies[key],
      },
    });
  };

  return (
    <div className="flex flex-col gap-space-sm px-gutter py-space-sm max-w-5xl mx-auto w-full animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">settings</span>
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
            Configuración del Escáner
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Parámetros ópticos de lectura Zebra SE4710 y DataWedge v11.4 para terminal TC27.
        </p>
      </div>

      {/* 1. Audio & Haptic Feedback */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-label-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">volume_up</span>
            Retroalimentación Sonora y Háptica
          </h3>
          <button
            type="button"
            onClick={testBeep}
            className="px-2.5 py-1 rounded-md bg-primary text-white text-xs font-semibold hover:bg-secondary active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
            Probar Bip
          </button>
        </div>

        {/* Bip Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-on-surface">Sonido de Decodificación</span>
            <span className="text-xs text-on-surface-variant">
              Tono característico de confirmación al leer códigos
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ bipEnabled: !settings.bipEnabled })}
            className={`w-10 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
              settings.bipEnabled ? 'bg-primary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                settings.bipEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            ></span>
          </button>
        </div>

        {/* Volume Slider */}
        {settings.bipEnabled && (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Volumen del Bip:</span>
              <span className="font-data-mono font-bold text-primary">{settings.bipVolume}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.bipVolume}
              onChange={(e) => onUpdateSettings({ bipVolume: Number(e.target.value) })}
              className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Frequency Slider */}
        {settings.bipEnabled && (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Frecuencia de Tono:</span>
              <span className="font-data-mono font-bold text-primary">
                {settings.bipFrequency} Hz
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="2800"
              step="50"
              value={settings.bipFrequency}
              onChange={(e) => onUpdateSettings({ bipFrequency: Number(e.target.value) })}
              className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Haptic Vibration Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-outline-variant/20">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-on-surface">Vibración Háptica</span>
            <span className="text-xs text-on-surface-variant">
              Vibración corta en empuñadura / carcasa al confirmar
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
            className={`w-10 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
              settings.hapticEnabled ? 'bg-primary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform ${
                settings.hapticEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* 2. Optics & Aiming Pattern */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <h3 className="font-label-md font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">center_focus_strong</span>
          Óptica del Motor Lector SE4710
        </h3>

        {/* Aiming Pattern Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-on-surface-variant font-medium">Patrón de Apuntado Láser:</span>
          <div className="grid grid-cols-3 gap-2">
            {(['dot', 'crosshair', 'reticle'] as const).map((pattern) => (
              <button
                type="button"
                key={pattern}
                onClick={() => onUpdateSettings({ aimingBeam: pattern })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  settings.aimingBeam === pattern
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container-low'
                }`}
              >
                {pattern === 'dot' ? 'Punto Rojo' : pattern === 'crosshair' ? 'Cruz' : 'Retícula'}
              </button>
            ))}
          </div>
        </div>

        {/* Illumination LED Level */}
        <div className="flex flex-col gap-1 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Intensidad LED de Iluminación:</span>
            <span className="font-data-mono font-bold text-primary">Nivel {settings.illumination}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.illumination}
            onChange={(e) => onUpdateSettings({ illumination: Number(e.target.value) })}
            className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
          />
        </div>

        {/* Picklist Mode */}
        <div className="flex items-center justify-between py-2 border-t border-outline-variant/20">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-on-surface">Modo Picklist (Alta Densidad)</span>
            <span className="text-xs text-on-surface-variant">
              Decodifica únicamente el código centrado bajo el haz láser
            </span>
          </div>
          <span className="text-xs font-semibold text-on-tertiary-container bg-tertiary-container px-2 py-0.5 rounded">
            Activado
          </span>
        </div>
      </div>

      {/* 3. Symbologies Filter */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <h3 className="font-label-md font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">barcode</span>
          Simbologías Habilitadas (DataWedge)
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(settings.symbologies).map(([key, isEnabled]) => {
            const spanishNames: Record<string, string> = {
              ean128: 'EAN-128',
              code128: 'Código 128',
              qrCode: 'Código QR',
              dataMatrix: 'Data Matrix',
              gs1Databar: 'GS1 DataBar',
              pdf417: 'PDF417',
              code39: 'Código 39',
            };
            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleSymbology(key as keyof ScannerSettings['symbologies'])}
                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isEnabled
                    ? 'bg-surface-container-low border-secondary/40 text-primary font-semibold'
                    : 'bg-surface-container-lowest border-outline-variant/30 text-outline'
                }`}
              >
                <span>{spanishNames[key] || key}</span>
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isEnabled ? 'text-secondary' : 'text-outline'
                  }`}
                >
                  {isEnabled ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Terminal Device Specs Card */}
      <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/40 shadow-xs flex flex-col gap-2">
        <h3 className="font-label-md font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">devices</span>
          Información del Dispositivo Zebra
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant pt-1">
          <div>
            <span className="block text-[11px] text-outline">Modelo:</span>
            <span className="font-bold text-on-surface">Zebra TC27 Portátil Industrial</span>
          </div>
          <div>
            <span className="block text-[11px] text-outline">Motor Óptico:</span>
            <span className="font-bold text-on-surface">SE4710 Cámara 1D/2D</span>
          </div>
          <div>
            <span className="block text-[11px] text-outline">Sistema Operativo:</span>
            <span className="font-bold text-on-surface">Android 13 Enterprise GMS</span>
          </div>
          <div>
            <span className="block text-[11px] text-outline">DataWedge Versión:</span>
            <span className="font-bold text-on-surface">v11.4.24 (Build 3881)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
