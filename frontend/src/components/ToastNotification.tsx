import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, Bell } from 'lucide-react';
import type { Notification } from '../hooks/useWebSocket';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  duration?: number; // milisegundos
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);

    // Auto cerrar después de la duración
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300); // Duración de la animación de salida
  };

  const getIcon = () => {
    switch (notification.type) {
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

  const getBgColor = () => {
    switch (notification.type) {
      case 'nuevo_incidente':
        return 'bg-orange-50 border-orange-200';
      case 'cambio_estado':
      case 'cambio_estado_incidente':
        return 'bg-blue-50 border-blue-200';
      case 'actualizacion_incidente':
      case 'incidente_editado':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 w-96 bg-white rounded-lg shadow-2xl border-2 pointer-events-auto z-[9999]
        transition-all duration-300 transform
        ${getBgColor()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Nueva notificación
            </p>
            <p className="text-sm text-gray-700">
              {notification.message}
            </p>
            
            {notification.data && notification.data.descripcion && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {notification.data.descripcion}
              </p>
            )}
          </div>

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
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;