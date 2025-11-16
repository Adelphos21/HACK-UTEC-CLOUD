import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Bell, LogOut, Plus, X, MapPin, Clock, Loader2 } from 'lucide-react';
import type { DashboardProps, Incident, NewReport } from '../types';
import { incidentsApi } from '../api';

const StudentDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [newReport, setNewReport] = useState<NewReport>({
    tipo: 'Seguridad',
    ubicacion: '',
    descripcion: '',
    urgencia: 'Media'
  });

  // Obtener token del localStorage
  const getToken = (): string => {
    return localStorage.getItem('access_token') || '';
  };

  // Cargar incidentes al montar el componente
  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      const response = await incidentsApi.getAll(token);
      
      if (response.success && response.data) {
        // Convertir formato de API al formato del componente
        const formattedIncidents: Incident[] = response.data.map(inc => ({
          id: inc.incident_id,
          tipo: inc.tipo,
          urgencia: inc.urgencia,
          descripcion: inc.descripcion,
          ubicacion: inc.ubicacion,
          estado: inc.estado,
          timestamp: new Date(inc.created_at).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          fecha: new Date(inc.created_at).toISOString().split('T')[0],
          reportadoPor: inc.reportado_por
        }));
        
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
      const token = getToken();
      const response = await incidentsApi.create(token, newReport);
      
      if (response.success && response.data) {
        // Agregar el nuevo incidente a la lista
        const newIncident: Incident = {
          id: response.data.incident_id,
          tipo: response.data.tipo,
          urgencia: response.data.urgencia,
          descripcion: response.data.descripcion,
          ubicacion: response.data.ubicacion,
          estado: response.data.estado,
          timestamp: new Date(response.data.created_at).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          fecha: new Date(response.data.created_at).toISOString().split('T')[0],
          reportadoPor: response.data.reportado_por
        };
        
        setIncidents([newIncident, ...incidents]);
        setShowReportForm(false);
        setNewReport({
          tipo: 'Seguridad',
          ubicacion: '',
          descripcion: '',
          urgencia: 'Media'
        });
      } else {
        setError(response.error || 'Error al crear el reporte');
      }
    } catch (err) {
      console.error('Error creando reporte:', err);
      setError('Error de conexión');
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
      'Resuelto': 'bg-green-100 text-green-800'
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
              <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
              <p className="text-sm text-gray-600">Bienvenido, {user.nombre} ({user.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-6 h-6 text-gray-600" />
            </button>
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
              <h2 className="text-2xl font-bold text-gray-900">Incidentes Recientes</h2>
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
                <p className="text-gray-500">No hay incidentes reportados</p>
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
                  <span className="text-gray-700">Reportes Total</span>
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
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
                  value={newReport.tipo}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, tipo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={submitting}
                >
                  <option value="Seguridad">Seguridad</option>
                  <option value="Salud">Salud</option>
                  <option value="Propiedad">Propiedad</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Ubicación</label>
                <input
                  type="text"
                  value={newReport.ubicacion}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewReport({ ...newReport, ubicacion: e.target.value })}
                  placeholder="Ej: Edificio A, Aula 301"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                <textarea
                  value={newReport.descripcion}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewReport({ ...newReport, descripcion: e.target.value })}
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
                  value={newReport.urgencia}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewReport({ ...newReport, urgencia: e.target.value as NewReport['urgencia'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={submitting}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
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
    </div>
  );
};

export default StudentDashboard;