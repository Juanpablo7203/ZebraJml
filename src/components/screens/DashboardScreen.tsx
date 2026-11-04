import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { OrderDoc, ScanLog } from '../../types';

interface DashboardScreenProps {
  orders: OrderDoc[];
  currentOrder: OrderDoc | null;
  scanLogs: ScanLog[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  orders,
  currentOrder,
  scanLogs,
}) => {
  // 1. Overall KPIs
  const kpis = useMemo(() => {
    const activeItems = currentOrder ? currentOrder.items : [];
    const totalExpected = activeItems.reduce((acc, item) => acc + item.expectedQty, 0);
    const totalCounted = activeItems.reduce((acc, item) => acc + item.countedQty, 0);
    const completionPct =
      totalExpected > 0 ? Math.min(100, Math.round((totalCounted / totalExpected) * 100)) : 0;

    const completedSkus = activeItems.filter((i) => i.countedQty >= i.expectedQty).length;
    const totalSkus = activeItems.length;

    const totalScanEvents = scanLogs.length;
    const hardwareScans = scanLogs.filter((l) => l.method === 'hardware_trigger').length;
    const hardwareEfficiencyPct =
      totalScanEvents > 0 ? Math.round((hardwareScans / totalScanEvents) * 100) : 100;

    return {
      totalExpected,
      totalCounted,
      completionPct,
      completedSkus,
      totalSkus,
      totalScanEvents,
      hardwareEfficiencyPct,
    };
  }, [currentOrder, scanLogs]);

  // 2. Order Completion Rate & Scanning Efficiency Trend based on stored scanLogs
  const efficiencyTrendData = useMemo(() => {
    const chronological = [...scanLogs].reverse();
    const totalExpected =
      currentOrder?.totalExpected ||
      currentOrder?.items.reduce((sum, i) => sum + i.expectedQty, 0) ||
      Math.max(
        1,
        chronological.reduce((sum, l) => sum + Math.max(0, l.quantityDelta), 0)
      );

    if (chronological.length === 0) {
      return [];
    }

    let runningCounted = 0;
    return chronological.map((log, idx) => {
      runningCounted = Math.max(0, Math.min(totalExpected, runningCounted + log.quantityDelta));
      const completionRate = Math.min(
        100,
        Math.round((runningCounted / Math.max(1, totalExpected)) * 100)
      );

      // Scanning efficiency score based on capture method and accuracy
      const methodEfficiency =
        log.method === 'hardware_trigger'
          ? 100
          : log.method === 'camera'
          ? 92
          : log.method === 'soft_trigger'
          ? 88
          : 78;

      return {
        step: `#${idx + 1}`,
        time: log.timestamp,
        sku: log.sku,
        delta: log.quantityDelta,
        unidadesAcumuladas: runningCounted,
        tasaCompletitud: completionRate,
        eficienciaEscaneo: methodEfficiency,
        metodo:
          log.method === 'hardware_trigger'
            ? 'Gatillo Zebra EAN-13'
            : log.method === 'dialpad'
            ? 'Teclado Manual'
            : log.method === 'camera'
            ? 'Cámara Óptica'
            : 'Trigger Pantalla',
      };
    });
  }, [scanLogs, currentOrder]);

  // 3. SKU Completion Breakdown for Active Order
  const skuBreakdownData = useMemo(() => {
    if (!currentOrder) return [];
    return currentOrder.items.map((item) => {
      const pct =
        item.expectedQty > 0
          ? Math.min(100, Math.round((item.countedQty / item.expectedQty) * 100))
          : 100;
      return {
        sku: item.sku,
        descripcion: item.description,
        leido: item.countedQty,
        esperado: item.expectedQty,
        porcentaje: pct,
      };
    });
  }, [currentOrder]);

  return (
    <div className="flex flex-col gap-space-sm px-gutter py-space-sm max-w-5xl mx-auto w-full animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">analytics</span>
            <h1 className="font-headline-sm text-headline-sm text-primary font-bold">
              Dashboard de Rendimiento
            </h1>
          </div>
          {currentOrder && (
            <span className="font-data-mono text-xs bg-primary text-white px-2.5 py-1 rounded-md font-bold">
              {currentOrder.id}
            </span>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Visualización en tiempo real de Tasa de Completitud de Orden y Eficiencia de Escaneo EAN-13.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Completitud Orden</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">
              task_alt
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data-mono text-2xl font-extrabold text-primary">
              {kpis.completionPct}%
            </span>
            <span className="text-[11px] text-on-surface-variant font-mono">
              ({kpis.totalCounted}/{kpis.totalExpected} uds)
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>SKUs Completados</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">
              inventory_2
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data-mono text-2xl font-extrabold text-secondary">
              {kpis.completedSkus} / {kpis.totalSkus}
            </span>
            <span className="text-[11px] text-on-surface-variant">ítems</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Lecturas Registradas</span>
            <span className="material-symbols-outlined text-primary text-[18px]">
              barcode_scanner
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data-mono text-2xl font-extrabold text-on-surface">
              {kpis.totalScanEvents}
            </span>
            <span className="text-[11px] text-on-surface-variant">eventos</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span>Eficiencia Láser</span>
            <span className="material-symbols-outlined text-amber-600 text-[18px]">bolt</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data-mono text-2xl font-extrabold text-emerald-700">
              {kpis.hardwareEfficiencyPct}%
            </span>
            <span className="text-[11px] text-on-surface-variant">EAN-13 HW</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Order Completion Rate & Scanning Efficiency Trends (based on scanLogs) */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">
                trending_up
              </span>
              Tendencia de Completitud y Eficiencia de Escaneo (scanLogs)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Evolución porcentual acumulada por cada lectura de código de barras en `scanLogs`.
            </p>
          </div>
          <span className="text-[11px] font-mono bg-surface-container px-2 py-0.5 rounded text-primary font-semibold">
            {scanLogs.length} lecturas en historial
          </span>
        </div>

        {efficiencyTrendData.length === 0 ? (
          <div className="h-56 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center p-4 gap-2">
            <span className="material-symbols-outlined text-[32px] text-outline">
              query_stats
            </span>
            <p className="text-xs font-semibold text-on-surface">
              Sin lecturas registradas todavía en `scanLogs`
            </p>
            <p className="text-[11px] text-on-surface-variant max-w-sm">
              Escanea un código EAN-13 o digita una cantidad en la pestaña "Consultar" para visualizar la curva de completitud y eficiencia en vivo.
            </p>
          </div>
        ) : (
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={efficiencyTrendData}
                margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0f4c81" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [`${value}%`, String(name || '')]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item
                      ? `Hora: ${label} • SKU: ${item.sku} (${item.metodo})`
                      : `Hora: ${label}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey="tasaCompletitud"
                  name="Tasa de Completitud (%)"
                  stroke="#0f4c81"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompletion)"
                />
                <Area
                  type="monotone"
                  dataKey="eficienciaEscaneo"
                  name="Eficiencia de Escaneo (%)"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEfficiency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Order Completion Rate per SKU (Bar Chart) */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                bar_chart
              </span>
              Avance de Unidades por SKU del Documento Activo
            </h2>
            <p className="text-xs text-on-surface-variant">
              Comparativa entre unidades leídas y unidades requeridas por el pedido (sin sobreconteo).
            </p>
          </div>
        </div>

        {skuBreakdownData.length === 0 ? (
          <div className="h-48 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-on-surface-variant">
              Consulta un pedido desde la API para visualizar el avance por SKU.
            </p>
          </div>
        ) : (
          <div className="w-full h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skuBreakdownData}
                margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="sku"
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  stroke="#cbd5e1"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar
                  dataKey="esperado"
                  name="Total Documento (uds)"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="leido" name="Unidades Leídas (uds)" radius={[4, 4, 0, 0]}>
                  {skuBreakdownData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.leido >= entry.esperado ? '#059669' : '#0284c7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
