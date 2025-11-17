import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import type { RegisterPageProps } from '../types';
import { authApi, USER_ROLES } from '../api';
import { UserPlus, ArrowLeft } from 'lucide-react';

const RegisterPage: React.FC<RegisterPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    correo: '',
    password: '',
    rol: USER_ROLES.STUDENT
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
      const response = await authApi.register(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => onBack(), 2500);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Botón volver */}
        <button
          onClick={onBack}
          disabled={loading}
          className="mb-6 flex items-center gap-2 text-white hover:text-cyan-400 transition-colors font-semibold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio de sesión
        </button>

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl shadow-2xl p-5 mb-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-900 text-3xl font-bold tracking-tight">Alerta</span>
              <span className="text-cyan-500 text-3xl font-bold tracking-tight">UTEC</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crear Nueva Cuenta</h1>
          <p className="text-cyan-200 font-medium">Regístrate con tus credenciales institucionales</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Registro</h2>
              <p className="text-gray-600 text-sm">Completa todos los campos</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 shadow-md">
              <p className="font-bold">✅ Registro exitoso!</p>
              <p className="text-sm mt-1">Redirigiendo al inicio de sesión...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                  Nombres
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  placeholder="Juan Carlos"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Pérez Gómez"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                DNI
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
                maxLength={8}
                pattern="\d{8}"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1 font-medium">Ingresa tu DNI de 8 dígitos</p>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                Email Institucional
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="tu.correo@utec.edu.pe"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1 font-medium">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                Rol
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                disabled={loading}
              >
                <option value={USER_ROLES.STUDENT}>Estudiante</option>
                <option value={USER_ROLES.ADMINISTRATIVE}>Personal Administrativo</option>
                <option value={USER_ROLES.AUTHORITY}>Autoridad</option>
              </select>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-bold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg border-2 border-gray-300 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-cyan-200 mt-6 text-sm font-medium">
          © 2025 UTEC - Todos los derechos reservados
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;