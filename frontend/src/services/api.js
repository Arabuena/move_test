import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api'  // Em produção, usa o caminho relativo
    : 'http://localhost:5000/api' // Em desenvolvimento, usa localhost
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
    return Promise.reject(error);
  }
);

export default api; 