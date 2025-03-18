import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';

export default function DriverRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'driver',
    vehicle: {
      model: '',
      plate: '',
      year: '',
      color: ''
    },
    documents: {
      cnh: '',
      cpf: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
      alert('Cadastro realizado com sucesso! Aguarde a aprovação.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cadastro de Motorista
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/register/passenger" className="font-medium text-indigo-600 hover:text-indigo-500">
              cadastre-se como passageiro
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Dados pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                name="name"
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <input
                name="phone"
                type="tel"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Dados do veículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dados do Veículo</h3>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                name="vehicle.model"
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Modelo do veículo"
                value={formData.vehicle.model}
                onChange={(e) => setFormData({
                  ...formData,
                  vehicle: { ...formData.vehicle, model: e.target.value }
                })}
              />
              <input
                name="vehicle.plate"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Placa"
                value={formData.vehicle.plate}
                onChange={(e) => setFormData({
                  ...formData,
                  vehicle: { ...formData.vehicle, plate: e.target.value }
                })}
              />
              <input
                name="vehicle.year"
                type="number"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Ano"
                value={formData.vehicle.year}
                onChange={(e) => setFormData({
                  ...formData,
                  vehicle: { ...formData.vehicle, year: e.target.value }
                })}
              />
              <input
                name="vehicle.color"
                type="text"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Cor"
                value={formData.vehicle.color}
                onChange={(e) => setFormData({
                  ...formData,
                  vehicle: { ...formData.vehicle, color: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                name="documents.cnh"
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="CNH"
                value={formData.documents.cnh}
                onChange={(e) => setFormData({
                  ...formData,
                  documents: { ...formData.documents, cnh: e.target.value }
                })}
              />
              <input
                name="documents.cpf"
                type="text"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="CPF"
                value={formData.documents.cpf}
                onChange={(e) => setFormData({
                  ...formData,
                  documents: { ...formData.documents, cpf: e.target.value }
                })}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar como Motorista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 