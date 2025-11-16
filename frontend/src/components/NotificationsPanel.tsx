import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Notification } from '../hooks/useWebSocket';

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nuevo_incidente':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'cambio_estado':
      case 'cambio_estado_incidente':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'actualizacion_incidente':
      case 'incidente_editado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  Limpiar todo
                </button>
              </div>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-cyan-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="mt-1 text-xs text-gray-500">
                            {notification.data.incident_id && (
                              <span>ID: {notification.data.incident_id.slice(0, 8)}...</span>
                            )}
                            {notification.data.urgencia && (
                              <span className="ml-2">• {notification.data.urgencia}</span>
                            )}
                            {notification.data.new_status && (
                              <span className="ml-2">• {notification.data.new_status}</span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => onClearNotification(notification.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;