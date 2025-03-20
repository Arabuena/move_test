import axios from 'axios';
import apiConfig from '../config/api.config';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Adiciona o token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Token nas requisições:', token ? 'Presente' : 'Ausente');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('Configuração da requisição:', {
    url: config.url,
    method: config.method,
    headers: config.headers
  });

  return config;
});

// Interceptor para respostas
api.interceptors.response.use(
  response => {
    console.log('Resposta recebida:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Erro na requisição:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api; 