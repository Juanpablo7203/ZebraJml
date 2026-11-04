import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-4 py-2.5 shadow-xl border border-amber-400/40 backdrop-blur-md animate-bounce"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
      <div className="flex flex-col text-xs">
        <span className="font-bold tracking-tight">Modo Sin Conexión (Offline)</span>
        <span className="text-[11px] text-amber-100">
          Datos en caché disponibles en terminal Zebra TC27.
        </span>
      </div>
    </div>
  );
};
