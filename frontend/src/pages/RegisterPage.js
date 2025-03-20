import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!formData.email.trim()) {
      errors.push('Email é obrigatório');
    } else if (!formData.email.includes('@')) {
      errors.push('Email inválido');
    }

    if (!formData.password) {
      errors.push('Senha é obrigatória');
    } else if (formData.password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('As senhas não coincidem');
    }

    if (!formData.phone.trim()) {
      errors.push('Telefone é obrigatório');
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('idle');

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');
    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      setStatus('success');
      setTimeout(() => {
        navigate('/request-ride', { replace: true });
      }, 1500);
    } catch (error) {
      setError(error.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <img 
            src={logo} 
            alt="Move" 
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-purple-900">
            Crie sua conta
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">Registro realizado com sucesso! Redirecionando...</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                sm:text-sm transition duration-200"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                sm:text-sm transition duration-200"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                sm:text-sm transition duration-200"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirme a senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                sm:text-sm transition duration-200"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                sm:text-sm transition duration-200"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-200`}
            >
              {loading ? 'Registrando...' : 'Criar conta'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link 
              to="/login"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Faça login
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Quer trabalhar conosco?{' '}
            <Link 
              to="/driver-register"
              className="font-medium text-purple-600 hover:text-purple-500"
              state={{ fromRegister: true }}
            >
              Cadastre-se como motorista
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 