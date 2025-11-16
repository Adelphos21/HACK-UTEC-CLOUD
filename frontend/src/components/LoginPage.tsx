import React, { useState, type FormEvent } from 'react';
import { authApi } from '../api';

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
      
      console.log('Login response completa:', response);
      
      if (response.success && response.data) {
        const responseData = response.data as any;
        
        console.log('Response data:', responseData);
        
        // El token viene como "token" del backend
        const accessToken = responseData.token || responseData.access_token;
        
        if (!accessToken) {
          console.error('No se encontró token en la respuesta');
          setError('Error: No se recibió token de autenticación');
          setLoading(false);
          return;
        }

        // Decodificar el JWT manualmente para extraer los datos
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
          
          
          
          // Construir objeto user con datos del JWT
          const userData = {
            user_id: decoded.user_id,
            nombre: decoded.nombre || decoded.correo.split('@')[0],
            correo: decoded.correo,
            email: decoded.correo,
            rol: decoded.rol,
            apellidos: '',
            dni: ''
          };
          
          
          
          // Guardar en localStorage antes de llamar a onLogin
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('user_id', decoded.user_id);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          
          
          onLogin(userData, accessToken);
        } catch (err) {
          console.error('❌ Error decodificando JWT:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-cyan-500 rounded-2xl p-4 mb-4">
            <span className="text-white text-3xl font-bold">SOS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS Institucional</h1>
          <p className="text-gray-600">Sistema de Reporte de Incidentes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600 mb-6">Accede con tu cuenta institucional</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Email Institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@institucion.edu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-cyan-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onShowRegister}
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;