import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { LogOut, Plus, X, MapPin, Clock, Loader2 } from 'lucide-react';
import type { DashboardProps, Incident } from '../types';
import { incidentsApi, INCIDENT_TYPES, URGENCY_LEVELS, INCIDENT_TYPE_LABELS, URGENCY_LABELS, STATUS_LABELS } from '../api';
import { useWebSocket, type Notification } from '../hooks/useWebSocket';
import NotificationsPanel from './NotificationsPanel';
import ToastContainer from './ToastContainer';

const StudentDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [toasts, setToasts] = useState<Notification[]>([]);

  // 🔔 Hook de WebSocket
  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification
  } = useWebSocket({
    userId: user.user_id,
    rol: user.rol,
    onNotification: (notification) => {
      // Mostrar toast cuando llega una nueva notificación
      setToasts(prev => [...prev, notification]);
      
      // Si es una actualización de incidente del estudiante, recargar la lista
      if (notification.type === 'actualizacion_incidente' || 
          notification.type === 'incidente_editado' ||
          notification.type === 'cambio_estado') {
        loadIncidents();
      }
    }
  });

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };
  
  const [newReport, setNewReport] = useState({
    type: INCIDENT_TYPES.SECURITY,
    floor: 1,
    ambient: '',
    description: '',
    urgency: URGENCY_LEVELS.MEDIUM,
    created_by: user.user_id || ''
  });

  // 🔧 Función auxiliar para formatear fechas de forma segura
  const formatDate = (dateString: string | undefined): { timestamp: string; fecha: string } => {
    try {
      if (!dateString) {
        // Si no hay fecha, usar la actual
        const now = new Date();
        return {
          timestamp: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          fecha: now.toISOString().split('T')[0]
        };
      }

      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida recibida:', dateString);
        const now = new Date();
        return {
          timestamp: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          fecha: now.toISOString().split('T')[0]
        };
      }

      return {
        timestamp: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        fecha: date.toISOString().split('T')[0]
      };
    } catch (err) {
      console.error('Error formateando fecha:', err);
      const now = new Date();
      return {
        timestamp: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        fecha: now.toISOString().split('T')[0]
      };
    }
  };

  // 🔧 Función para convertir datos de API a formato del componente
  const mapIncidentFromAPI = (inc: any): Incident => {
    const { timestamp, fecha } = formatDate(inc.created_at);
    
    return {
      id: inc.incident_id || inc.id || 'unknown',
      tipo: INCIDENT_TYPE_LABELS[inc.type] || inc.type || 'Desconocido',
      urgencia: (URGENCY_LABELS[inc.urgency] || inc.urgency || 'Media') as 'Baja' | 'Media' | 'Alta' | 'Crítica',
      descripcion: inc.description || 'Sin descripción',
      ubicacion: `Piso ${inc.floor || 0}${inc.ambient ? ' - ' + inc.ambient : ''}`,
      estado: (STATUS_LABELS[inc.status] || inc.status || 'Pendiente') as 'Pendiente' | 'En Atención' | 'Resuelto',
      timestamp,
      fecha,
      reportadoPor: inc.created_by || 'Desconocido'
    };
  };

  // Cargar incidentes al montar el componente
  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Obtener user_id del prop user (que ya está en memoria)
      const userId = user.user_id;
      
      if (!userId) {
        setError('No se pudo obtener el ID del usuario');
        console.error('❌ user_id no encontrado en:', user);
        return;
      }

      
      const response = await incidentsApi.getByStudent(userId);
      
      if (response.success && response.data) {
        const formattedIncidents = response.data.map(mapIncidentFromAPI);
        setIncidents(formattedIncidents);
      } else {
        setError(response.error || 'Error al cargar incidentes');
      }
    } catch (err) {
      console.error('Error cargando incidentes:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      
      
      const response = await incidentsApi.create(newReport);
      
      
      
      if (response.success && response.data) {
        // Convertir el incidente usando la función auxiliar
        const newIncident = mapIncidentFromAPI(response.data);
        
        
        
        setIncidents([newIncident, ...incidents]);
        setShowReportForm(false);
        
        // Reset form
        setNewReport({
          type: INCIDENT_TYPES.SECURITY,
          floor: 1,
          ambient: '',
          description: '',
          urgency: URGENCY_LEVELS.MEDIUM,
          created_by: user.user_id || ''
        });
        
        // Mostrar mensaje de éxito
        alert('✅ Incidente reportado exitosamente');
      } else {
        setError(response.error || response.message || 'Error al crear el reporte');
      }
    } catch (err) {
      console.error('Error creando reporte:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyColor = (urgencia: string): string => {
    const colors: Record<string, string> = {
      'Baja': 'bg-green-100 text-green-800',
      'Media': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800'
    };
    return colors[urgencia] || colors['Media'];
  };

  const getStatusColor = (estado: string): string => {
    const colors: Record<string, string> = {
      'Pendiente': 'bg-gray-100 text-gray-800',
      'En Atención': 'bg-cyan-100 text-cyan-800',
      'Resuelto': 'bg-green-100 text-green-800',
      'Rechazado': 'bg-red-100 text-red-800'
    };
    return colors[estado] || colors['Pendiente'];
  };

  const myIncidents = incidents.length;
  const resolved = incidents.filter(i => i.estado === 'Resuelto').length;
  const inProgress = incidents.filter(i => i.estado === 'En Atención').length;
  const pending = incidents.filter(i => i.estado === 'Pendiente').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 rounded-lg p-2">
              <span className="text-white text-xl font-bold">SOS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
              <p className="text-sm text-gray-600">Bienvenido, {user.nombre} ({user.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 🔔 Panel de Notificaciones */}
            <NotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearNotification={clearNotification}
              onClearAll={clearNotifications}
            />
            
            {/* Indicador de conexión WebSocket */}
            {!isConnected && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Reconectando...
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button 
              onClick={loadIncidents}
              className="ml-4 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mis Incidentes</h2>
              <button
                onClick={() => setShowReportForm(true)}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuevo Reporte
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <span className="ml-3 text-gray-600">Cargando incidentes...</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 mb-4">No has reportado ningún incidente</p>
                <button
                  onClick={() => setShowReportForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Crear tu primer reporte
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{incident.tipo}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(incident.urgencia)}`}>
                          {incident.urgencia}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.estado)}`}>
                        {incident.estado}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{incident.descripcion}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{incident.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{incident.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Mi Actividad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{myIncidents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Resueltos</span>
                  <span className="text-2xl font-bold text-green-600">{resolved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">En Atención</span>
                  <span className="text-2xl font-bold text-cyan-600">{inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">{pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reportar Incidente</h2>
                <p className="text-gray-600 text-sm">Completa los detalles del incidente</p>
              </div>
              <button
                onClick={() => setShowReportForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tipo de Incidente</label>
                <select
                  value={newReport.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, type: e.target.value as typeof newReport.type })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={submitting}
                >
                  {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Piso</label>
                  <select
                    value={newReport.floor}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, floor: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={submitting}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(floor => (
                      <option key={floor} value={floor}>Piso {floor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Ambiente</label>
                  <input
                    type="text"
                    value={newReport.ambient}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewReport({ ...newReport, ambient: e.target.value })}
                    placeholder="Ej: S1101"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                <textarea
                  value={newReport.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Describe el incidente..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Urgencia</label>
                <select
                  value={newReport.urgency}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, urgency: e.target.value as typeof newReport.urgency })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={submitting}
                >
                  {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-cyan-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Reporte'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  disabled={submitting}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 🍞 Contenedor de Toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default StudentDashboard;