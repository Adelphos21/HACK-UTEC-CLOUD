import { useState, useEffect } from 'react';
import { authApi } from '../api';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const saveToken = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const removeToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      removeToken();
      return false;
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      if (response.success && response.data) {
        saveToken(response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        return true;
      } else {
        removeToken();
        return false;
      }
    } catch (error) {
      removeToken();
      return false;
    }
  };

  return {
    token,
    isAuthenticated,
    saveToken,
    removeToken,
    refreshAuthToken
  };
};