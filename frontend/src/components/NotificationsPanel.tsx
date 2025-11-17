import React, { useState } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
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

  //  Función para formatear timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nuevo_incidente':
        return '🆕';
      case 'estado_cambiado':
      case 'actualizacion_incidente':
        return '🔄';
      case 'incidente_editado':
        return '✏️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Notificaciones
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex gap-2 text-sm">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                  <button
                    onClick={onClearAll}
                    className="text-gray-600 hover:text-gray-700 font-medium ml-auto"
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
                        {/* Ícono */}
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          {/* Título */}
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          
                          {/* Mensaje */}
                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Timestamp */}
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => onClearNotification(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPanel;