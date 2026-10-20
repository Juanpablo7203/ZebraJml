import React, { useState } from 'react';
import { playZebraBeep } from '../../utils/audioFeedback';

interface SincronizarScreenProps {
  bipEnabled: boolean;
  totalUnsyncedCount?: number;
}

export const SincronizarScreen: React.FC<SincronizarScreenProps> = ({
  bipEnabled,
  totalUnsyncedCount = 6,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Hoy a las 09:20');
  const [pendingRecords, setPendingRecords] = useState<number>(totalUnsyncedCount);

  const handleStartSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setProgressPercent(15);
    setSyncStep('Conectando con SAP S/4HANA & WMS Cloud...');

    setTimeout(() => {
      setProgressPercent(45);
      setSyncStep('Validando tokens de sesión y DataWedge Intent broker...');
    }, 900);

    setTimeout(() => {
      setProgressPercent(75);
      setSyncStep('Empaquetando 6 lecturas de inventario y firmas...');
    }, 1800);

    setTimeout(() => {
      setProgressPercent(100);
      setSyncStep('¡Sincronización exitosa! Registros confirmados.');
      setPendingRecords(0);
      setLastSyncTime(`Hoy a las ${new Date().toLocaleTimeString().slice(0, 5)}`);
      setIsSyncing(false);
      playZebraBeep('success', bipEnabled);
    }, 2800);
  };

  return (
    <div className="flex flex-col gap-space-sm px-gutter py-space-sm max-w-5xl mx-auto w-full animate-fade-in">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">sync</span>
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
            Sincronización de Datos
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Conexión en tiempo real entre la terminal Zebra TC27 y el sistema ERP / WMS central.
        </p>
      </div>

      {/* Connection & Network Card */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="font-label-md font-bold text-on-surface">Servidor WMS Conectado</span>
          </div>
          <span className="font-data-mono text-xs text-on-tertiary-container bg-tertiary-container px-2 py-0.5 rounded font-semibold">
            Latencia: 24ms
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-outline-variant/20">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Red Wi-Fi</span>
            <span className="font-data-mono text-xs font-semibold text-on-surface">
              Bodega_Zebra_5GHz
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Intensidad Señal</span>
            <span className="font-data-mono text-xs font-semibold text-on-surface">
              -48 dBm (Excelente)
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">IP Terminal</span>
            <span className="font-data-mono text-xs font-semibold text-on-surface">
              192.168.14.88
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant">Última Sincronización</span>
            <span className="font-data-mono text-xs font-semibold text-primary">
              {lastSyncTime}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status Banner & Big Action */}
      <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md font-bold text-on-surface">
                Cola Local de Transmisión
              </span>
              <span className="text-xs text-on-surface-variant">
                {pendingRecords > 0
                  ? `${pendingRecords} ítems pendientes de envío al servidor`
                  : 'Todos los ítems están sincronizados con SAP WMS'}
              </span>
            </div>
          </div>

          <span
            className={`font-data-mono text-xs font-bold px-2 py-1 rounded-md ${
              pendingRecords > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-tertiary-container text-on-tertiary-container'
            }`}
          >
            {pendingRecords > 0 ? `${pendingRecords} Pendientes` : 'Al día'}
          </span>
        </div>

        {/* Progress bar if running */}
        {isSyncing && (
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="font-body-sm text-xs text-primary font-medium animate-pulse">
              {syncStep} ({progressPercent}%)
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartSync}
          disabled={isSyncing}
          className={`w-full py-3 px-4 rounded-lg font-label-md font-bold text-white tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm ${
            isSyncing
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-secondary hover:bg-primary cursor-pointer'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin' : ''}`}
          >
            {isSyncing ? 'refresh' : 'sync'}
          </span>
          {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR LOTE AHORA'}
        </button>
      </div>

      {/* Diagnostic & Integration Protocols */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-2">
        <h3 className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
          Protocolos de Integración Activos
        </h3>

        <div className="space-y-2 text-xs text-on-surface-variant pt-1">
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span>Zebra DataWedge Intent Filter:</span>
            <span className="font-mono text-on-surface font-medium">
              com.zebra.datacapture.ACTION
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span>Middleware Endpoint:</span>
            <span className="font-mono text-on-surface font-medium">
              https://wms-api.docstock.net/v2/scans
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span>Modo Fuera de Línea Automático:</span>
            <span className="text-on-tertiary-container font-semibold">Activado (Caché SQLite)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Cifrado de Carga:</span>
            <span className="font-mono text-on-surface font-medium">TLS 1.3 / AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
