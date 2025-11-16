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
        
        // Intentar extraer el access_token de diferentes estructuras posibles
        let accessToken = responseData.access_token || 
                         responseData.token || 
                         responseData.accessToken;
        
        // Intentar extraer user_id de diferentes ubicaciones
        let userId = responseData.user_id || 
                    responseData.user?.user_id ||
                    responseData.data?.user_id;
        
        // Intentar extraer el objeto user o construirlo
        let userData = responseData.user || 
                      responseData.usuario || 
                      responseData.data;
        
        console.log('Token extraído:', accessToken);
        console.log('User ID extraído:', userId);
        console.log('User data extraído:', userData);
        
        // Verificar que tengamos al menos el token
        if (!accessToken) {
          console.error('No se encontró token en la respuesta:', responseData);
          setError('Respuesta de servidor inválida: falta token');
          setLoading(false);
          return;
        }
        
        // Verificar que tengamos user_id
        if (!userId) {
          console.error('No se encontró user_id en la respuesta:', responseData);
          setError('Respuesta de servidor inválida: falta user_id');
          setLoading(false);
          return;
        }
        
        // Construir el objeto user con toda la información necesaria
        const userFormatted = {
          user_id: userId,
          nombre: userData?.nombre ?? userData?.nombres ?? email.split('@')[0],
          apellidos: userData?.apellidos ?? "",
          email: userData?.email ?? userData?.correo ?? email,
          rol: userData?.rol ?? "Estudiante",
          dni: userData?.dni ?? '',
};
        console.log("ROL recibido desde backend:", userData?.rol, responseData.rol);
        console.log('User formatted final:', userFormatted);
        
        // Guardar tokens y user_id en localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('user_id', userId);
        localStorage.setItem('user_data', JSON.stringify(userFormatted));
        
        if (responseData.refresh_token || responseData.refreshToken) {
          localStorage.setItem('refresh_token', 
            responseData.refresh_token || responseData.refreshToken);
        }
        
        console.log('Datos guardados en localStorage');
        console.log('user_id:', localStorage.getItem('user_id'));
        
        onLogin(userFormatted, accessToken);
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