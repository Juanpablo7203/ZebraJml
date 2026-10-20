import React from 'react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: 'Discrepancia detectada en SKU PROD-4412',
      time: 'Hace 5 min',
      description: 'Faltan 60 unidades según el albarán de despacho DOC-2024-8849.',
      type: 'warning',
      icon: 'warning',
    },
    {
      id: '2',
      title: 'Batería Terminal TC27 al 94%',
      time: 'Hace 20 min',
      description: 'Autonomía estimada: 11 horas de escaneo continuo en turno.',
      type: 'info',
      icon: 'battery_charging_90',
    },
    {
      id: '3',
      title: 'Lote de sincronización completado',
      time: 'Hace 45 min',
      description: '12 ítems transmitidos a SAP S/4HANA exitosamente.',
      type: 'success',
      icon: 'cloud_done',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-end sm:justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm sm:rounded-2xl rounded-b-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              notifications
            </span>
            <h2 className="font-label-md font-bold text-on-surface">Notificaciones del Sistema</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-3"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : n.type === 'success'
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-surface-container text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-label-sm font-bold text-on-surface text-xs leading-snug">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-outline font-mono flex-shrink-0">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {n.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-on-surface-variant cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
