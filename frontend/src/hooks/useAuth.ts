import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const saveToken = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('token', newToken); // ✅ Guardar también como 'token'
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const removeToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token'); // ✅ Limpiar ambos
    setToken(null);
    setIsAuthenticated(false);
  };

  return {
    token,
    isAuthenticated,
    saveToken,
    removeToken,
  };
};