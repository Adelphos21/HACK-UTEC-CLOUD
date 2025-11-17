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
  token: string | null;
  onNotification?: (notification: Notification) => void;
}

export const useWebSocket = ({ userId, rol, token, onNotification }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const manuallyClosedRef = useRef(false);
  const isConnectingRef = useRef(false); // ✅ NUEVO: Prevenir conexiones simultáneas
  const connectionIdRef = useRef<string | null>(null); // ✅ NUEVO: Rastrear ID único de conexión

  const connect = () => {
    //  Validar que tengamos userId Y token
    if (!userId || !token) {
      console.warn("⚠️ No se puede conectar WebSocket: falta userId o token");
      return;
    }

    //  Prevenir múltiples conexiones simultáneas
    if (isConnectingRef.current) {
      console.warn("⚠️ Ya hay una conexión en progreso, saltando...");
      return;
    }

    //  Si ya hay una conexión abierta, no crear otra
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.warn("⚠️ WebSocket ya está conectado o conectando");
      return;
    }

    manuallyClosedRef.current = false;
    isConnectingRef.current = true; 
    const currentConnectionId = crypto.randomUUID(); 
    connectionIdRef.current = currentConnectionId;

    console.log(`🔌 Conectando WebSocket [${currentConnectionId.slice(0, 8)}]...`);
    
    try {
      const ws = websocketApi.connect(userId, rol, token);
      wsRef.current = ws;

      ws.onopen = () => {
        //  Verificar que esta conexión sigue siendo la actual
        if (connectionIdRef.current !== currentConnectionId) {
          console.warn(`⚠️ Conexión obsoleta [${currentConnectionId.slice(0, 8)}], cerrando...`);
          ws.close();
          return;
        }

        console.log(` WebSocket conectado [${currentConnectionId.slice(0, 8)}]`);
        setIsConnected(true);
        isConnectingRef.current = false;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notification: Notification = {
            id: crypto.randomUUID(),
            type: data.type || data.tipo,
            message: data.message || data.mensaje || 'Nueva notificación',
            timestamp: new Date(),
            read: false,
            data
          };
          setNotifications(prev => [notification, ...prev]);
          onNotification?.(notification);
        } catch (e) {
          console.error(" Error parseando mensaje:", e);
        }
      };

      ws.onerror = (ev) => {
        console.error(` WS error [${currentConnectionId.slice(0, 8)}]:`, ev);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log(`🔌 WS CLOSED [${currentConnectionId.slice(0, 8)}]: ${event.code} - ${event.reason || 'Sin razón'}`);
        
        setIsConnected(false);
        isConnectingRef.current = false;
        
        
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        //  No reconectar si fue cierre manual
        if (manuallyClosedRef.current) {
          console.log(" Cierre manual, no reconectar");
          return;
        }

        
        if (event.code !== 1000 && token && userId) {
          console.log("🔄 Reconectando en 3s...");
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    } catch (error) {
      console.error(" Error creando WebSocket:", error);
      isConnectingRef.current = false;
    }
  };

  const disconnect = () => {
    console.log("🔌 Desconectando WebSocket...");
    manuallyClosedRef.current = true;
    isConnectingRef.current = false;
    connectionIdRef.current = null; 

    if (wsRef.current) {
      
      const readyState = wsRef.current.readyState;
      
      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, "Logout");
      }
      
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  };

  useEffect(() => {
    //  Si no hay userId o token, desconectar y limpiar
    if (!userId || !token) {
      disconnect();
      setNotifications([]);
      return;
    }

    //  Conectar
    setNotifications([]);
    connect();

    
    return () => {
      console.log("🧹 Cleanup de useWebSocket ejecutado");
      disconnect();
    };
  }, [userId, token]); 

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead: (id: string) => setNotifications(n => n.map(x => x.id === id ? {...x, read: true} : x)),
    markAllAsRead: () => setNotifications(n => n.map(x => ({...x, read: true}))),
    clearNotification: (id: string) => setNotifications(n => n.filter(x => x.id !== id)),
    clearNotifications: () => setNotifications([]),
    reconnect: connect,
    disconnect
  };
};
