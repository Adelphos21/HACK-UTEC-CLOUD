import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import type { RegisterPageProps, RegisterData } from '../types';
import { authApi } from '../api';

const RegisterPage: React.FC<RegisterPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<RegisterData>({
    nombres: '',
    apellidos: '',
    dni: '',
    correo: '',
    password: '',
    rol: 'Estudiante'
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Llamada real a la API
      const response = await authApi.register(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => onBack(), 2000);
      } else {
        setError(response.error || 'Error al registrar usuario');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-cyan-500 rounded-2xl p-4 mb-4">
            <span className="text-white text-3xl font-bold">SOS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS Institucional</h1>
          <p className="text-gray-600">Sistema de Reporte de Incidentes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Crear Cuenta</h2>
          <p className="text-gray-600 mb-6">Regístrate con tus credenciales institucionales</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              Registro exitoso. Redirigiendo...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Nombres</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Juan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Pérez Gómez"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">DNI</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
                maxLength={8}
                pattern="\d{8}"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Email Institucional</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="usuario@institucion.edu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Autoridad">Autoridad</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors mb-4 disabled:bg-cyan-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
            >
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;