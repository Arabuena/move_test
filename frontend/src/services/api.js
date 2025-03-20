import axios from 'axios';
import apiConfig from '../config/api.config';

// Função para criar instância do Axios com retry
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: 30000, // Aumentado para 30 segundos
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Permitir retry em falhas
    retry: 3,
    retryDelay: 1000
  });

  // Adicionar interceptor de retry
  instance.interceptors.response.use(null, async error => {
    const { config } = error;
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount || 0;

    if (config._retryCount >= config.retry) {
      return Promise.reject(error);
    }

    config._retryCount += 1;
    console.log(`Tentativa ${config._retryCount} de ${config.retry}`);

    // Delay exponencial
    const delay = config.retryDelay * Math.pow(2, config._retryCount - 1);
    await new Promise(resolve => setTimeout(resolve, delay));

    return instance(config);
  });

  // Interceptor para token
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    
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
  instance.interceptors.response.use(
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

  return instance;
};

const api = createAxiosInstance();

export default api; 