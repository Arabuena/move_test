import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const register = async (userData) => {
    try {
      console.log('Iniciando registro com dados:', userData);

      const data = {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        phone: userData.phone?.trim() || '',
        role: 'passenger'
      };

      console.log('Enviando dados para registro:', data);

      const response = await api.post('/auth/register', data);
      console.log('Resposta do registro:', response.data);

      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || 'Erro ao registrar usuário');
      }

      const { token, user } = response.data;

      // Salva os dados
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return { user, token };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
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