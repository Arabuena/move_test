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
  const user = JSON.parse(localStorage.getItem('user'));
  
  console.log('Configuração da requisição:', {
    url: config.url,
    method: config.method,
    token: token ? 'Bearer ' + token : 'No token',
    userRole: user?.role
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para respostas
api.interceptors.response.use(
  response => {
    // Log da resposta bem-sucedida
    console.log('Resposta recebida:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    // Log detalhado do erro
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      request: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data,
        headers: error.config?.headers
      },
      timestamp: new Date().toISOString()
    };

    console.error('Erro na API:', errorDetails);
    return Promise.reject(error);
  }
);

export default api; 