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
      console.log('Iniciando tentativa de login:', { email });
      console.log('URL da API:', api.defaults.baseURL);

      // Adiciona informações do dispositivo
      const loginData = {
        email,
        password,
        deviceType: 'mobile',
        platform: 'android'
      };

      console.log('Dados de login:', loginData);

      const response = await api.post('/auth/login', loginData);
      
      console.log('Resposta completa:', response);
      console.log('Dados da resposta:', response.data);

      if (!response.data.token) {
        throw new Error('Token não encontrado na resposta');
      }

      const { token, user } = response.data;
      
      // Configura o token nas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Salva os dados
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Erro detalhado:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: api.defaults.baseURL
      });

      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao fazer login';
      
      if (!navigator.onLine) {
        errorMessage = 'Sem conexão com a internet';
      } else if (error.response?.status === 401) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.response?.status === 404) {
        errorMessage = 'Servidor não encontrado';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
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