import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://move-test.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Log de todas as requisições
api.interceptors.request.use(config => {
  const isLocalhost = window.location.hostname === 'localhost';
  
  // Ajusta a baseURL dependendo do ambiente
  if (isLocalhost && !process.env.REACT_APP_API_URL) {
    config.baseURL = 'http://localhost:5000/api';
  }

  console.log('Requisição:', {
    baseURL: config.baseURL,
    url: config.url,
    fullURL: config.baseURL + config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
    environment: isLocalhost ? 'development' : 'production'
  });

  const token = localStorage.getItem('token');
  console.log('Token sendo enviado:', token);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log de todas as respostas
api.interceptors.response.use(
  response => {
    console.log('Resposta:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    console.error('Erro na requisição:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
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