import React, { useState, useEffect, type ChangeEvent } from 'react';
import { LogOut, X, MapPin, Clock, Filter, Loader2, RefreshCw } from 'lucide-react';
import type { DashboardProps, Incident } from '../types';
import { incidentsApi, INCIDENT_STATUS, URGENCY_LEVELS, STATUS_LABELS, URGENCY_LABELS, INCIDENT_TYPE_LABELS } from '../api';
import { useWebSocket, type Notification } from '../hooks/useWebSocket';
import NotificationsPanel from './NotificationsPanel';
import ToastContainer from './ToastContainer';

const AuthorityDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [toasts, setToasts] = useState<Notification[]>([]);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    floor: '',
    urgency: '',
    status: '',
    studentId: ''
  });

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
      // Mostrar toast
      setToasts(prev => [...prev, notification]);
      
      // Recargar incidentes cuando hay cambios
      if (notification.type === 'nuevo_incidente' || 
          notification.type === 'cambio_estado') {
        loadIncidents();
      }
    }
  });

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // 🔧 Función auxiliar para formatear fechas de forma segura
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

  // Mapear incidente de API al formato del componente
  const mapIncidentFromAPI = (inc: any): Incident => {
    const { timestamp, fecha } = formatDate(inc.created_at);
    
    return {
      id: inc.incident_id || 'unknown',
      tipo: INCIDENT_TYPE_LABELS[inc.type] || inc.type || 'Desconocido',
      urgencia: (URGENCY_LABELS[inc.urgency] || inc.urgency || 'Media') as 'Baja' | 'Media' | 'Alta' | 'Crítica',
      descripcion: inc.description || 'Sin descripción',
      ubicacion: `Piso ${inc.floor || 0}${inc.ambient ? ' - ' + inc.ambient : ''}`,
      estado: (STATUS_LABELS[inc.status] || inc.status || 'Pendiente') as 'Pendiente' | 'En Atención' | 'Resuelto',
      timestamp,
      fecha,
      reportadoPor: inc.reported_by_name || inc.created_by || 'Desconocido',
      // Guardar datos originales para filtrado
      _raw: {
        floor: inc.floor,
        urgency: inc.urgency,
        status: inc.status,
        created_by: inc.created_by
      }
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
      // 🔧 SIEMPRE obtener TODOS los incidentes y filtrar en el cliente
      const response = await incidentsApi.getAll();
      
      if (response.success && response.data) {
        const allIncidents = response.data.map(mapIncidentFromAPI);
        
        // 🔧 Aplicar filtros en el cliente
        const filteredIncidents = allIncidents.filter(incident => {
          // Filtro por piso
          if (filters.floor && incident._raw?.floor !== parseInt(filters.floor)) {
            return false;
          }
          
          // Filtro por urgencia
          if (filters.urgency && incident._raw?.urgency !== filters.urgency) {
            return false;
          }
          
          // Filtro por estado
          if (filters.status && incident._raw?.status !== filters.status) {
            return false;
          }
          
          // Filtro por estudiante
          if (filters.studentId && incident._raw?.created_by !== filters.studentId) {
            return false;
          }
          
          return true;
        });
        
        setIncidents(filteredIncidents);
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

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      floor: '',
      urgency: '',
      status: '',
      studentId: ''
    });
  };

  // Recargar incidentes cuando cambien los filtros
  useEffect(() => {
    if (!loading) {
      loadIncidents();
    }
  }, [filters.floor, filters.urgency, filters.status, filters.studentId]);

  const updateIncidentStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    setError('');
    
    try {
      const userId = user.user_id || localStorage.getItem('user_id') || 'admin';
      
      const response = await incidentsApi.updateStatus({
        incident_id: id,
        new_status: newStatus,
        user_id: userId
      });
      
      if (response.success) {
        await loadIncidents();
        setSelectedIncident(null);
      } else {
        setError(response.error || 'Error al actualizar el estado');
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setError('Error de conexión');
    } finally {
      setUpdating(false);
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

  const totalIncidents = incidents.length;
  const resolved = incidents.filter(i => i.estado === 'Resuelto').length;
  const inProgress = incidents.filter(i => i.estado === 'En Atención').length;
  const pending = incidents.filter(i => i.estado === 'Pendiente').length;

  // Contador de filtros activos
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 rounded-lg p-2">
              <span className="text-white text-xl font-bold">SOS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
              <p className="text-sm text-gray-600">Bienvenido, {user.nombre} ({user.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={loadIncidents}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={loading}
              title="Recargar incidentes"
            >
              <RefreshCw className={`w-6 h-6 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={loadIncidents}
              className="underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm mb-1">Total de Incidentes</div>
            <div className="text-3xl font-bold text-gray-900">{totalIncidents}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm mb-1">Resueltos</div>
            <div className="text-3xl font-bold text-green-600">{resolved}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm mb-1">En Atención</div>
            <div className="text-3xl font-bold text-cyan-600">{inProgress}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm mb-1">Pendientes</div>
            <div className="text-3xl font-bold text-orange-600">{pending}</div>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              {activeFiltersCount > 0 && (
                <span className="bg-cyan-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} filtros
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piso
                </label>
                <select
                  name="floor"
                  value={filters.floor}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={loading}
                >
                  <option value="">Todos</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(floor => (
                    <option key={floor} value={floor}>Piso {floor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgencia
                </label>
                <select
                  name="urgency"
                  value={filters.urgency}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={loading}
                >
                  <option value="">Todas</option>
                  <option value={URGENCY_LEVELS.LOW}>Baja</option>
                  <option value={URGENCY_LEVELS.MEDIUM}>Media</option>
                  <option value={URGENCY_LEVELS.HIGH}>Alta</option>
                  <option value={URGENCY_LEVELS.CRITICAL}>Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={loading}
                >
                  <option value="">Todos</option>
                  <option value={INCIDENT_STATUS.PENDING}>Pendiente</option>
                  <option value={INCIDENT_STATUS.IN_PROGRESS}>En Atención</option>
                  <option value={INCIDENT_STATUS.COMPLETED}>Resuelto</option>
                  <option value={INCIDENT_STATUS.REJECTED}>Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Estudiante
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={filters.studentId}
                  onChange={handleFilterChange}
                  placeholder="UUID del estudiante"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lista de Incidentes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Todos los Incidentes
              <span className="text-gray-500 text-lg ml-2">
                ({incidents.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando incidentes...</span>
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-2">
                <Filter className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No se encontraron incidentes
              </h3>
              <p className="text-gray-500">
                {activeFiltersCount > 0 
                  ? 'Intenta ajustar los filtros para ver más resultados'
                  : 'No hay incidentes registrados en el sistema'}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
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
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.estado)}`}>
                        {incident.estado}
                      </span>
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Cambiar Estado
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{incident.descripcion}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Reportado por: <span className="font-medium">{incident.reportadoPor}</span>
                  </p>
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
      </div>

      {/* Modal de Cambiar Estado */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cambiar Estado</h2>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={updating}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2"><strong>Incidente:</strong> {selectedIncident.tipo}</p>
              <p className="text-gray-700 mb-2"><strong>Ubicación:</strong> {selectedIncident.ubicacion}</p>
              <p className="text-gray-700 mb-2"><strong>Reportado por:</strong> {selectedIncident.reportadoPor}</p>
              <p className="text-gray-700"><strong>Estado actual:</strong> {selectedIncident.estado}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => updateIncidentStatus(selectedIncident.id, INCIDENT_STATUS.PENDING)}
                disabled={updating}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  'Pendiente'
                )}
              </button>
              <button
                onClick={() => updateIncidentStatus(selectedIncident.id, INCIDENT_STATUS.IN_PROGRESS)}
                disabled={updating}
                className="w-full px-4 py-3 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-semibold rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                En Atención
              </button>
              <button
                onClick={() => updateIncidentStatus(selectedIncident.id, INCIDENT_STATUS.COMPLETED)}
                disabled={updating}
                className="w-full px-4 py-3 bg-green-100 hover:bg-green-200 text-green-800 font-semibold rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resuelto
              </button>
              <button
                onClick={() => updateIncidentStatus(selectedIncident.id, INCIDENT_STATUS.REJECTED)}
                disabled={updating}
                className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rechazado
              </button>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              disabled={updating}
              className="w-full mt-4 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* 🍞 Contenedor de Toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default AuthorityDashboard;