import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/logo.png';

export default function DriverRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    carModel: '',
    licensePlate: '',
    carYear: '',
    carColor: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');

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

    if (!formData.carModel.trim()) {
      errors.push('Modelo do carro é obrigatório');
    }

    if (!formData.licensePlate.trim()) {
      errors.push('Placa do veículo é obrigatória');
    }

    if (!formData.carYear.trim()) {
      errors.push('Ano do veículo é obrigatório');
    }

    if (!formData.carColor.trim()) {
      errors.push('Cor do veículo é obrigatória');
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
        ...formData,
        role: 'driver'
      });

      setStatus('success');
      setTimeout(() => {
        navigate('/driver-dashboard', { replace: true });
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
            Cadastro de Motorista
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Junte-se à nossa equipe de motoristas
          </p>
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Dados Pessoais */}
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

            {/* Dados do Veículo */}
            <div className="pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Veículo</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="carModel" className="block text-sm font-medium text-gray-700">
                    Modelo do Carro
                  </label>
                  <input
                    id="carModel"
                    name="carModel"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                    sm:text-sm transition duration-200"
                    placeholder="Ex: Fiat Uno 2020"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="carYear" className="block text-sm font-medium text-gray-700">
                    Ano do Veículo
                  </label>
                  <input
                    id="carYear"
                    name="carYear"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                    sm:text-sm transition duration-200"
                    placeholder="Ex: 2020"
                    value={formData.carYear}
                    onChange={(e) => setFormData({ ...formData, carYear: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="carColor" className="block text-sm font-medium text-gray-700">
                    Cor do Veículo
                  </label>
                  <input
                    id="carColor"
                    name="carColor"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                    sm:text-sm transition duration-200"
                    placeholder="Ex: Prata"
                    value={formData.carColor}
                    onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
                    Placa do Veículo
                  </label>
                  <input
                    id="licensePlate"
                    name="licensePlate"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                    sm:text-sm transition duration-200"
                    placeholder="Ex: ABC1234"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-200`}
            >
              {loading ? 'Registrando...' : 'Cadastrar como Motorista'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link 
              to="/login" 
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 