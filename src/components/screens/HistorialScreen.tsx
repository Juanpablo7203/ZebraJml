import React, { useState } from 'react';
import { ScanLog } from '../../types';

interface HistorialScreenProps {
  logs: ScanLog[];
  onClearLogs: () => void;
}

export const HistorialScreen: React.FC<HistorialScreenProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'success' | 'warning'>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.symbology.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const exportCSV = () => {
    const headers = 'ID,Hora,SKU,Descripcion,Simbologia,Cantidad,Total,Estado\n';
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.sku}","${l.description}","${l.symbology}","${l.quantityDelta}","${l.totalCounted}","${l.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocStock_Historial_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-space-sm px-gutter py-space-sm max-w-5xl mx-auto w-full animate-fade-in">
      {/* Screen Title & KPI Summary */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">history</span>
            <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
              Historial de Lecturas
            </h1>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1 transition-all"
            title="Exportar archivo CSV para SAP / WMS"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Exportar CSV
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Registro cronológico auditado de capturas mediante escáner Zebra SE4710.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-3 gap-space-xs">
        <div className="bg-surface-container-lowest p- space-sm p-3 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Lecturas Hoy</span>
          <span className="font-data-mono text-lg font-bold text-primary">{logs.length}</span>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Precisión</span>
          <span className="font-data-mono text-lg font-bold text-on-tertiary-container">98.2%</span>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Tiempo Prom.</span>
          <span className="font-data-mono text-lg font-bold text-secondary">0.8 seg</span>
        </div>
      </div>

      {/* Search Bar & Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, descripción o simbología..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-sm text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded text-label-sm font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('success')}
            className={`px-2.5 py-1 rounded text-label-sm font-semibold transition-all ${
              filterType === 'success'
                ? 'bg-surface-container-lowest text-on-tertiary-container shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Conforme
          </button>
          <button
            type="button"
            onClick={() => setFilterType('warning')}
            className={`px-2.5 py-1 rounded text-label-sm font-semibold transition-all ${
              filterType === 'warning'
                ? 'bg-surface-container-lowest text-error shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Discrepancia
          </button>
        </div>
      </div>

      {/* Log Rows List */}
      <div className="flex flex-col gap-space-xs mt-1">
        {filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center flex flex-col items-center justify-center border border-outline-variant/30 text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2">
              receipt_long
            </span>
            <p className="font-label-md font-semibold text-on-surface">No se encontraron lecturas</p>
            <p className="font-body-sm text-on-surface-variant text-xs mt-1">
              Pruebe cambiando los filtros de búsqueda o escanee ítems con el gatillo.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/30 shadow-xs flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.status === 'success'
                      ? 'bg-tertiary-container text-on-tertiary-container'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {log.status === 'success' ? 'check' : 'priority_high'}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-data-mono font-bold text-primary text-sm">
                      {log.sku}
                    </span>
                    <span className="text-[10px] bg-surface-container text-secondary font-mono px-1.5 py-0.2 rounded font-semibold">
                      {log.symbology}
                    </span>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container-low px-1.5 py-0.2 rounded border border-outline-variant/20">
                      {log.method === 'hardware_trigger'
                        ? 'Gatillo Físico'
                        : log.method === 'soft_trigger'
                        ? 'Gatillo Digital'
                        : log.method === 'camera'
                        ? 'Cámara'
                        : 'Manual'}
                    </span>
                  </div>
                  <span className="font-body-sm text-xs text-on-surface-variant truncate">
                    {log.description}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 text-right">
                <div className="flex items-center gap-1">
                  <span className="font-data-mono text-xs text-secondary font-semibold">
                    +{log.quantityDelta}
                  </span>
                  <span className="text-outline text-xs">/</span>
                  <span className="font-data-mono text-sm font-bold text-on-surface">
                    {log.totalCounted} uds
                  </span>
                </div>
                <span className="font-data-mono text-[10px] text-outline">{log.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClearLogs}
            className="text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 p-1"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
            Limpiar registro local
          </button>
        </div>
      )}
    </div>
  );
};
