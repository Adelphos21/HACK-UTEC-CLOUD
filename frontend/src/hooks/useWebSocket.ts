import { useEffect, useRef, useState } from 'react';
import { websocketApi } from '../api';

export interface Notification {
  id: string;
  type: 'nuevo_incidente' | 'cambio_estado' | 'incidente_editado' | 'actualizacion_incidente';
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface UseWebSocketProps {
  userId: string | null;
  rol: string;
  onNotification?: (notification: Notification) => void;
}

export const useWebSocket = ({ userId, rol, onNotification }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const connect = () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('token');
      console.log('🔌 Conectando WebSocket...', { userId, rol });
      
      
      const ws = websocketApi.connect(userId, rol, token || undefined);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        
        // Limpiar timeout de reconexión si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Mensaje WebSocket recibido:', data);

          // Crear notificación
          const notification: Notification = {
            id: `${Date.now()}-${Math.random()}`,
            type: data.type || data.tipo,
            message: data.message || data.mensaje || 'Nueva notificación',
            timestamp: new Date(),
            read: false,
            data: data
          };

          // Agregar a la lista de notificaciones
          setNotifications(prev => [notification, ...prev]);

          // Callback personalizado
          if (onNotification) {
            onNotification(notification);
          }
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Intentar reconectar después de 3 segundos
        if (event.code !== 1000) { // 1000 = cierre normal
          console.log('🔄 Intentando reconectar en 3 segundos...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      console.log('🔌 Desconectando WebSocket...');
      wsRef.current.close(1000, 'Cierre normal');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Conectar al montar, desconectar al desmontar
    useEffect(() => {
    if (!userId) return;  

    connect();
    return () => disconnect();
    }, [userId, rol]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
    reconnect: connect
  };
};