import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://move-test.onrender.com',
  timeout: 5000,
});

// Adiciona logs para debug
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Token sendo enviado:', token);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na requisição:', error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (!navigator.onLine) {
      // Tratar modo offline
      return Promise.reject(new Error('Você está offline. Por favor, verifique sua conexão.'));
    }
    return Promise.reject(error);
  }
);

export default api; 