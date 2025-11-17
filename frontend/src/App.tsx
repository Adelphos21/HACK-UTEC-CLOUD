import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import AuthorityDashboard from './components/AuthorityDashboard';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔄 Recuperar sesión del localStorage al cargar
  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedToken = localStorage.getItem('access_token');
        const savedUserData = localStorage.getItem('user_data');
        
        
        if (savedToken && savedUserData) {
          const userData = JSON.parse(savedUserData);
          
          setUser(userData);
          setToken(savedToken);
        } else {
          
        }
      } catch (error) {
        console.error('❌ Error restaurando sesión:', error);
        // Si hay error, limpiar datos corruptos
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_id');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    console.log('Login exitoso:', userData);
    
    // Guardar en estado
    setUser(userData);
    setToken(authToken);
    setShowRegister(false);
    
    // Persistir en localStorage
    localStorage.setItem('access_token', authToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('user_id', userData.user_id ?? '');
    
    
  };

  const handleLogout = () => {
    
    
    // Limpiar estado
    setUser(null);
    setToken(null);
    setShowRegister(false);
    
    // Limpiar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    localStorage.removeItem('refresh_token');
    
    console.log(' Sesión cerrada');
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  // 🔄 Mostrar loading mientras se restaura la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-cyan-500 rounded-full w-20 h-20 flex items-center justify-center animate-pulse">
              <span className="text-white text-3xl font-bold">SOS</span>
            </div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si está en modo registro
  if (showRegister) {
    return <RegisterPage onBack={handleBackToLogin} />;
  }

  // Si no está autenticado, mostrar login
  if (!user) {
    return <LoginPage onLogin={handleLogin} onShowRegister={handleShowRegister} />;
  }

  // Si es autoridad o administrativo, mostrar dashboard de autoridad
  if (user.rol === 'Autoridad' || user.rol === 'Personal administrativo') {
    return <AuthorityDashboard user={user} onLogout={handleLogout} />;
  }

  // Si es estudiante, mostrar dashboard de estudiante
  return <StudentDashboard user={user} onLogout={handleLogout} />;
}

export default App;