import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Iniciando login:', { email });
      const response = await api.post('/auth/login', { 
        email, 
        password,
        deviceType: 'mobile',
        platform: 'android'
      });
      
      if (response?.data?.token) {
        const userData = response.data.user;
        console.log('Dados do usuário:', userData);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Determina o tipo de usuário
        const userType = userData.type || userData.role || 'user';
        console.log('Login bem sucedido:', {
          userType,
          userData,
          redirectTo: userType === 'driver' ? '/driver-dashboard' 
                     : userType === 'admin' ? '/admin'
                     : '/request-ride'
        });
        
        return {
          success: true,
          userType: userType
        };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro no login:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 