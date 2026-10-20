import React from 'react';

interface HandheldUtilitiesProps {
  bipEnabled: boolean;
  onToggleBip: () => void;
  onOpenDamagedCode: () => void;
}

export const HandheldUtilities: React.FC<HandheldUtilitiesProps> = ({
  bipEnabled,
  onToggleBip,
  onOpenDamagedCode,
}) => {
  return (
    <div className="px-gutter flex flex-col gap-space-xs max-w-5xl mx-auto w-full">
      <div className="mt-space-sm grid grid-cols-2 gap-space-xs pb-space-lg">
        {/* Manual Code Entry for Damaged Labels */}
        <button
          type="button"
          onClick={onOpenDamagedCode}
          className="flex items-center justify-center gap-space-xs py-2.5 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-xs active:bg-surface-container transition-colors border border-outline-variant/30 cursor-pointer min-h-[44px]"
          title="Ingresar código manual en caso de etiqueta dañada o ilegible"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">keyboard</span>
          <span className="font-label-md text-label-md font-semibold truncate">
            Código Dañado
          </span>
        </button>

        {/* Haptic / Beep Audio Settings */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest shadow-xs text-on-surface border border-outline-variant/30 min-h-[44px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`material-symbols-outlined text-[18px] ${
                bipEnabled ? 'text-tertiary' : 'text-outline'
              }`}
            >
              {bipEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span className="font-label-sm text-label-sm truncate font-medium">
              Bip y Háptica Zebra
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleBip}
            aria-label="Activar o desactivar sonido y vibración háptica Zebra"
            className={`w-9 h-5 rounded-full relative flex items-center p-0.5 cursor-pointer transition-colors ${
              bipEnabled ? 'bg-primary' : 'bg-outline-variant'
            }`}
            id="feedbackToggle"
            title={bipEnabled ? 'Desactivar Bip & Háptico' : 'Activar Bip & Háptico'}
          >
            <span
              className={`w-4 h-4 rounded-full bg-on-primary shadow-sm transition-transform ${
                bipEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            ></span>
          </button>
        </div>
      </div>
    </div>
  );
};
