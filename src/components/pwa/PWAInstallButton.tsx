import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running installed in standalone mode, do not show any install/download button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Zebra TC27 flow when beforeinstallprompt is ready
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-secondary/90 active:scale-95 transition cursor-pointer ${className}`}
          title="Instalar DocStock en pantalla principal"
        >
          <span className="material-symbols-outlined text-[16px]">install_mobile</span>
          <span className="font-bold">Instalar App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`w-full flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-secondary/90 active:scale-98 transition cursor-pointer ${className}`}
      >
        <span className="material-symbols-outlined text-[20px]">install_mobile</span>
        Instalar en Pantalla Principal
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface hover:bg-surface-container active:scale-95 transition cursor-pointer ${className}`}
        >
          <span className="material-symbols-outlined text-[15px]">add_to_home_screen</span>
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/30 text-on-surface">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">phone_iphone</span>
                Instalar en iPhone / iPad
              </h3>
              <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                1. Toca el botón <strong>Compartir</strong> (ícono de flecha hacia arriba) en la barra inferior de Safari.<br />
                2. Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-surface-container py-2 text-xs font-bold text-primary hover:bg-surface-container-high transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not installable and not on iOS, hide button completely (no APK download option)
  return null;
};
