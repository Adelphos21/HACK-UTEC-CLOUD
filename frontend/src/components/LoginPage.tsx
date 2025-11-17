import React, { useState, type FormEvent } from 'react';
import { authApi } from '../api';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
  onShowRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        const accessToken = responseData.token || responseData.access_token;
        
        if (!accessToken) {
          setError('Error: No se recibió token de autenticación');
          setLoading(false);
          return;
        }

        try {
          const base64Url = accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          
          const userData = {
            user_id: decoded.user_id,
            nombre: decoded.nombre || decoded.correo.split('@')[0],
            correo: decoded.correo,
            email: decoded.correo,
            rol: decoded.rol,
            apellidos: '',
            dni: ''
          };
          
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('user_id', decoded.user_id);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          onLogin(userData, accessToken);
        } catch (err) {
          console.error('Error decodificando JWT:', err);
          setError('Error al procesar la respuesta del servidor');
        }
      } else {
        setError(response.error || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error en login:', err);
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl shadow-2xl p-6 mb-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-900 text-4xl font-bold tracking-tight">Alerta</span>
              <span className="text-cyan-500 text-4xl font-bold tracking-tight">UTEC</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Sistema de Gestión de Incidentes</h1>
          <p className="text-cyan-200 font-medium">Accede de forma segura a tu cuenta</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
              <p className="text-gray-600 text-sm">Ingresa tus credenciales institucionales</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wide text-sm">
                Email Institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-bold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="text-center text-gray-600 mb-3 font-medium">¿No tienes una cuenta?</p>
            <button
              onClick={onShowRegister}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Crear Cuenta Nueva
            </button>
          </div>
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

export default LoginPage;