import React from 'react';

export type NavTab = 'consultar' | 'historial' | 'sincronizar' | 'ajustes';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onQuickScan: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onQuickScan,
}) => {
  return (
    <>
      {/* Floating Barcode Scanner Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-40 pb-safe">
        <button
          type="button"
          onClick={onQuickScan}
          aria-label="Escanear código rápido"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-lg shadow-primary/30 active:scale-95 hover:bg-secondary-container transition-all cursor-pointer ring-2 ring-white/60"
          data-path="escaner-rapido"
          title="Escáner rápido / Visor de cámara"
        >
          <span className="material-symbols-outlined text-[28px]">barcode_scanner</span>
        </button>
      </div>

      {/* Primary Fixed Bottom Navigation */}
      <nav
        className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.03)] border-t border-outline-variant/30"
        data-active-classes="text-primary font-bold"
      >
        <div className="grid grid-cols-4 items-center h-16 px-space-xs max-w-5xl mx-auto">
          {/* 1. Consultar */}
          <button
            type="button"
            onClick={() => onSelectTab('consultar')}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full transition-colors cursor-pointer ${
              activeTab === 'consultar'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
            data-path="consultar"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                activeTab === 'consultar' ? 'scale-110 text-primary' : ''
              }`}
            >
              search
            </span>
            <span className="font-label-sm text-label-sm tracking-tight">Consultar</span>
            {activeTab === 'consultar' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
            )}
          </button>

          {/* 2. Historial */}
          <button
            type="button"
            onClick={() => onSelectTab('historial')}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full transition-colors cursor-pointer ${
              activeTab === 'historial'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
            data-path="historial"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                activeTab === 'historial' ? 'scale-110 text-primary' : ''
              }`}
            >
              history
            </span>
            <span className="font-label-sm text-label-sm tracking-tight">Historial</span>
            {activeTab === 'historial' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
            )}
          </button>

          {/* 3. Sincronizar */}
          <button
            type="button"
            onClick={() => onSelectTab('sincronizar')}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full transition-colors cursor-pointer relative ${
              activeTab === 'sincronizar'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
            data-path="sincronizar"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                activeTab === 'sincronizar' ? 'scale-110 text-primary' : ''
              }`}
            >
              sync
            </span>
            <span className="font-label-sm text-label-sm tracking-tight">Sincronizar</span>
            {activeTab === 'sincronizar' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
            )}
          </button>

          {/* 4. Ajustes */}
          <button
            type="button"
            onClick={() => onSelectTab('ajustes')}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full transition-colors cursor-pointer ${
              activeTab === 'ajustes'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
            data-path="ajustes"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                activeTab === 'ajustes' ? 'scale-110 text-primary' : ''
              }`}
            >
              settings
            </span>
            <span className="font-label-sm text-label-sm tracking-tight">Ajustes</span>
            {activeTab === 'ajustes' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
