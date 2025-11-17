import { useEffect, useRef, useState } from 'react';
import { websocketApi } from '../api';

export interface Notification {
  id: string;
  type: 'nuevo_incidente' | 'cambio_estado' | 'incidente_editado' | 'actualizacion_incidente' | 'estado_cambiado';
  title: string;
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

// ✅ Función auxiliar para formatear notificaciones según estructura del backend
const formatNotification = (data: any, userRole: string): { title: string; message: string } => {
  const tipo = data.tipo || data.type;
  
  // Mapeos de etiquetas
  
  
  const urgencyEmojis: Record<string, string> = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'critical': '🔴'
  };
  
  const statusLabels: Record<string, string> = {
    'pending': 'Pendiente',
    'in_progress': 'En Atención',
    'completed': 'Resuelto',
    'rejected': 'Rechazado'
  };
  
  // ✅ Formatear según el tipo de notificación del backend
  switch (tipo) {
    // ========== NUEVO INCIDENTE (a admins) ==========
    case 'nuevo_incidente': {
      const urgency = data.urgencia || 'medium';
      const urgencyEmoji = urgencyEmojis[urgency] || '🔔';
      const incidentType = data.tipo_incidente || 'Incidente';
      const location = data.piso && data.ambiente 
        ? `Piso ${data.piso} - ${data.ambiente}`
        : 'ubicación no especificada';
      const reportedBy = data.reportado_por || 'Usuario desconocido';
      
      return {
        title: 'Nuevo reporte',
        message: `${urgencyEmoji} ${incidentType} en ${location}${reportedBy !== 'Usuario desconocido' ? ` (${reportedBy})` : ''}`
      };
    }
    
    // ========== ESTADO CAMBIADO (a admins) ==========
    case 'estado_cambiado': {
      const oldStatus = statusLabels[data.estado_anterior] || data.estado_anterior;
      const newStatus = statusLabels[data.nuevo_estado] || data.nuevo_estado;
      
      return {
        title: 'Estado actualizado',
        message: `Incidente cambió de ${oldStatus} a ${newStatus}`
      };
    }
    
    // ========== ACTUALIZACIÓN DE INCIDENTE (a estudiante) ==========
    case 'actualizacion_incidente': {
      // El backend ya envía el mensaje formateado
      if (data.mensaje) {
        const newStatus = statusLabels[data.nuevo_estado] || data.nuevo_estado;
        return {
          title: 'Estado actualizado',
          message: `Tu reporte está ahora ${newStatus}`
        };
      }
      
      return {
        title: 'Actualización importante',
        message: data.mensaje || 'Tu incidente ha sido actualizado'
      };
    }
    
    // ========== INCIDENTE EDITADO (a estudiante) ==========
    case 'incidente_editado': {
      const fields = data.campos_actualizados || [];
      const fieldLabels: Record<string, string> = {
        'description': 'descripción',
        'urgency': 'urgencia',
        'type': 'tipo',
        'floor': 'piso',
        'ambient': 'ambiente'
      };
      
      const updatedFields = fields
        .map((f: string) => fieldLabels[f] || f)
        .join(', ');
      
      return {
        title: 'Reporte modificado',
        message: updatedFields 
          ? `Se actualizó: ${updatedFields}`
          : 'Se actualizó tu incidente'
      };
    }
    
    // ========== CAMBIO DE ESTADO (genérico - fallback) ==========
    case 'cambio_estado': {
      const status = statusLabels[data.status || data.new_status || data.nuevo_estado] || '';
      
      if (userRole === 'Estudiante') {
        return {
          title: 'Estado actualizado',
          message: status ? `Tu reporte está ahora ${status}` : 'El estado de tu reporte cambió'
        };
      } else {
        return {
          title: 'Estado actualizado',
          message: status ? `Incidente marcado como ${status}` : 'Estado de incidente actualizado'
        };
      }
    }
    
    // ========== DEFAULT ==========
    default: {
      return {
        title: 'Nueva notificación',
        message: data.mensaje || data.message || 'Tienes una nueva actualización'
      };
    }
  }
};

export const useWebSocket = ({ userId, rol, token, onNotification }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const manuallyClosedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const connectionIdRef = useRef<string | null>(null);

  const connect = () => {
    if (!userId || !token) {
      console.warn("⚠️ No se puede conectar WebSocket: falta userId o token");
      return;
    }

    if (isConnectingRef.current) {
      console.warn("⚠️ Ya hay una conexión en progreso, saltando...");
      return;
    }

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
        if (connectionIdRef.current !== currentConnectionId) {
          console.warn(`⚠️ Conexión obsoleta [${currentConnectionId.slice(0, 8)}], cerrando...`);
          ws.close();
          return;
        }

        console.log(`✅ WebSocket conectado [${currentConnectionId.slice(0, 8)}]`);
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
          console.log('📨 Mensaje WebSocket recibido:', data); // Debug
          
          // ✅ Generar título y mensaje descriptivos basados en datos reales del backend
          const { title, message } = formatNotification(data, rol);
          
          const notification: Notification = {
            id: data.notification_id || data.incident_id || crypto.randomUUID(),
            type: data.tipo || data.type || 'actualizacion_incidente',
            title: title,
            message: message,
            timestamp: new Date(data.timestamp || Date.now()),
            read: false,
            data: data
          };
          
          console.log('✅ Notificación formateada:', notification); // Debug
          
          setNotifications(prev => [notification, ...prev]);
          onNotification?.(notification);
        } catch (e) {
          console.error("❌ Error parseando mensaje:", e);
        }
      };

      ws.onerror = (ev) => {
        if (isConnectingRef.current) {
          console.error(`❌ WS error [${currentConnectionId.slice(0, 8)}]:`, ev);
        }
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        if (event.code === 1006 && !manuallyClosedRef.current) {
          console.log(`⚠️ Conexión cerrada prematuramente (Strict Mode) [${currentConnectionId.slice(0, 8)}]`);
        } else if (event.code === 1000) {
          console.log(`✅ Conexión cerrada normalmente [${currentConnectionId.slice(0, 8)}]`);
        } else {
          console.log(`🔌 WS CLOSED [${currentConnectionId.slice(0, 8)}]: ${event.code} - ${event.reason || 'Sin razón'}`);
        }
        
        setIsConnected(false);
        isConnectingRef.current = false;
        
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (manuallyClosedRef.current) {
          console.log("✅ Cierre manual, no reconectar");
          return;
        }

        if (event.code === 1006) {
          console.log("ℹ️ No reconectar (cierre prematuro)");
          return;
        }

        if (event.code !== 1000 && token && userId) {
          console.log("🔄 Reconectando en 3s...");
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    } catch (error) {
      console.error("❌ Error creando WebSocket:", error);
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
    if (!userId || !token) {
      disconnect();
      setNotifications([]);
      return;
    }

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