import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Notification } from '../hooks/useWebSocket';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  
  const getIcon = () => {
    switch (notification.type) {
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

  
  const getBgColor = () => {
    switch (notification.type) {
      case 'nuevo_incidente':
        return 'bg-orange-50 border-orange-200';
      case 'estado_cambiado':
      case 'actualizacion_incidente':
        return 'bg-blue-50 border-blue-200';
      case 'incidente_editado':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={`
        w-96 bg-white rounded-lg shadow-2xl border-2 pointer-events-auto
        transition-all duration-300 transform
        ${getBgColor()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Ícono */}
          <div className="flex-shrink-0 text-2xl">
            {getIcon()}
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* ✅ Título descriptivo */}
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {notification.title}
            </p>
            
            {/* ✅ Mensaje */}
            <p className="text-sm text-gray-700">
              {notification.message}
            </p>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all ease-linear"
            style={{
              animation: `shrink ${duration}ms linear`,
              transformOrigin: 'left'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;