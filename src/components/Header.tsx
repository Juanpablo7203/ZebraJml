import React from 'react';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  batteryLevel?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  batteryLevel = 94,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-gutter flex items-center justify-between gap-space-sm max-w-5xl mx-auto">
        {/* Left: Brand Logo & Terminal Info */}
        <div className="flex items-center gap-space-sm min-w-0">
          <img
            alt="DocStock Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1X56j_FYEfswy-3WlBoGHxRUpjz3MGageShZy-LPwI111v4f-rjgyKNU66RowtLB0LN5beq4my2CfbXE-oTA1QB61VeU5UW8KdABUBWDpyxOWSEH4o39if1ej4XECmbZ_-osOeEV60qbtDhYHSaye-TMK2uqY__LP1ntkDyL6AvyLxTjqi781W5eu2C-Jk97LK1ISj6F_59_f7UDpHS70w2wxuhc2yJqRgKNufwhXiN4mM_vnH6fH-O"
            onError={(e) => {
              // Graceful SVG fallback if network blocks external asset
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const fallback = document.createElement('div');
                fallback.className =
                  'logo-fallback w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs';
                fallback.innerHTML =
                  '<span class="material-symbols-outlined text-[20px]">inventory_2</span>';
                parent.insertBefore(fallback, target);
              }
            }}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                DocStock
              </span>
              <span className="hidden sm:inline-block font-label-sm text-label-sm text-outline">
                |
              </span>
              <span className="truncate font-label-md text-label-md text-on-surface-variant">
                Zebra TC27 • Escáner 2D
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                En línea
              </span>
              <span className="text-[10px] text-outline">·</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Wi-Fi 6E
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-space-sm flex-shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Quick Battery pill for rugged handheld context */}
          <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono font-medium text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md border border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px] text-tertiary">
              battery_charging_90
            </span>
            <span>{batteryLevel}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
