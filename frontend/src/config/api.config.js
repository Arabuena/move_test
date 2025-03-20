const apiConfig = {
    baseURL: process.env.NODE_ENV === 'production' 
        ? '/api'  // Em produção, usa path relativo
        : 'http://localhost:5000/api' // Em desenvolvimento, usa localhost
};

export default apiConfig; 