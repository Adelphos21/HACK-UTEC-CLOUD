import { useState } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import AuthorityDashboard from './components/AuthorityDashboard';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState<boolean>(false);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setShowRegister(false); // Asegurarse de ocultar el registro
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

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