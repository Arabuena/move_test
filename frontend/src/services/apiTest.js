import axios from 'axios';

// Teste 1: URL base
axios.get('https://move-test.onrender.com')
  .then(response => console.log('Base URL OK:', response.data))
  .catch(error => console.error('Base URL Error:', error.message));

// Teste 2: Com /l
axios.get('https://move-test.onrender.com/l')
  .then(response => console.log('/l OK:', response.data))
  .catch(error => console.error('/l Error:', error.message));

// Teste 3: Rota de login
axios.post('https://move-test.onrender.com/l/auth/login', {
  email: 'test@example.com',
  password: 'test123'
})
  .then(response => console.log('Login OK:', response.data))
  .catch(error => console.log('Login Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  })); 