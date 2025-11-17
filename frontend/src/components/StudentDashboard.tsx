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

  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearNotification,
  } = useWebSocket({
    userId: user.user_id,
    rol: user.rol,
    token: localStorage.getItem('access_token'),
    onNotification: (notification) => {
      setToasts(prev => [...prev, notification]);
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

  const formatDate = (dateString: string | undefined): { timestamp: string; fecha: string } => {
    try {
      if (!dateString) {
        const now = new Date();
        return {
          timestamp: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          fecha: now.toISOString().split('T')[0]
        };
      }

      const date = new Date(dateString);
      
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

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    setError('');
    
    try {
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
        const newIncident = mapIncidentFromAPI(response.data);
        setIncidents([newIncident, ...incidents]);
        setShowReportForm(false);
        
        setNewReport({
          type: INCIDENT_TYPES.SECURITY,
          floor: 1,
          ambient: '',
          description: '',
          urgency: URGENCY_LEVELS.MEDIUM,
          created_by: user.user_id || ''
        });
        
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
      'Baja': 'bg-green-100 text-green-800 border-green-200',
      'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Alta': 'bg-orange-100 text-orange-800 border-orange-200',
      'Crítica': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[urgencia] || colors['Media'];
  };

  const getStatusColor = (estado: string): string => {
    const colors: Record<string, string> = {
      'Pendiente': 'bg-gray-100 text-gray-800 border-gray-200',
      'En Atención': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Resuelto': 'bg-green-100 text-green-800 border-green-200',
      'Rechazado': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[estado] || colors['Pendiente'];
  };

  const myIncidents = incidents.length;
  const resolved = incidents.filter(i => i.estado === 'Resuelto').length;
  const inProgress = incidents.filter(i => i.estado === 'En Atención').length;
  const pending = incidents.filter(i => i.estado === 'Pendiente').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header mejorado */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b-4 border-cyan-500 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <div className="flex items-center">
                <span className="text-gray-900 text-2xl font-bold tracking-tight">Alerta</span>
                <span className="text-cyan-500 text-2xl font-bold tracking-tight">UTEC</span>
              </div>
            </div>
            <div className="border-l-2 border-gray-600 pl-4">
              <h1 className="text-2xl font-bold text-white tracking-tight">Mis Reportes</h1>
              <p className="text-sm text-gray-300">Bienvenido, <span className="font-semibold">{user.nombre}</span> • <span className="text-cyan-400 font-semibold">{user.rol}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearNotification={clearNotification}
              onClearAll={clearNotifications}
            />
            
            {!isConnected && (
              <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-900/30 px-3 py-2 rounded-lg border border-yellow-700 animate-pulse">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Reconectando...
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <span className="font-medium">{error}</span>
            <button 
              onClick={loadIncidents}
              className="ml-4 underline hover:no-underline font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Mis Incidentes</h2>
              <button
                onClick={() => setShowReportForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Nuevo Reporte
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-lg">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                <span className="text-gray-600 font-medium">Cargando incidentes...</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-16 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-6 text-lg font-medium">No has reportado ningún incidente</p>
                <button
                  onClick={() => setShowReportForm(true)}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Crear tu primer reporte
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-cyan-500 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{incident.tipo}</h3>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getUrgencyColor(incident.urgencia)} shadow-sm`}>
                          {incident.urgencia}
                        </span>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(incident.estado)} shadow-sm`}>
                        {incident.estado}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4 font-medium">{incident.descripcion}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium">{incident.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium">{incident.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-cyan-500 sticky top-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Mi Actividad</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="text-3xl font-bold text-gray-900">{myIncidents}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <span className="text-gray-700 font-semibold">Resueltos</span>
                  <span className="text-3xl font-bold text-green-600">{resolved}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg">
                  <span className="text-gray-700 font-semibold">En Atención</span>
                  <span className="text-3xl font-bold text-cyan-600">{inProgress}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <span className="text-gray-700 font-semibold">Pendientes</span>
                  <span className="text-3xl font-bold text-orange-600">{pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal mejorado */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto border-t-4 border-cyan-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reportar Incidente</h2>
                <p className="text-gray-600 text-sm font-medium">Completa los detalles del incidente</p>
              </div>
              <button
                onClick={() => setShowReportForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={submitting}
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">Tipo de Incidente</label>
                <select
                  value={newReport.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, type: e.target.value as typeof newReport.type })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  disabled={submitting}
                >
                  {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">Piso</label>
                  <select
                    value={newReport.floor}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, floor: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                    disabled={submitting}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(floor => (
                      <option key={floor} value={floor}>Piso {floor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">Ambiente</label>
                  <input
                    type="text"
                    value={newReport.ambient}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewReport({ ...newReport, ambient: e.target.value })}
                    placeholder="Ej: S1101"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">Descripción</label>
                <textarea
                  value={newReport.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Describe el incidente..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">Urgencia</label>
                <select
                  value={newReport.urgency}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, urgency: e.target.value as typeof newReport.urgency })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
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
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
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
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg border-2 border-gray-300 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default StudentDashboard;