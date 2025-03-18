import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rides, setRides] = useState([]);
  const [tab, setTab] = useState('drivers'); // 'drivers' ou 'rides'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversResponse, statsResponse] = await Promise.all([
        api.get('/admin/pending-drivers'),
        api.get('/admin/stats')
      ]);
      
      setPendingDrivers(driversResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driverId) => {
    try {
      await api.post(`/admin/approve-driver/${driverId}`);
      fetchData(); // Recarrega os dados
      alert('Motorista aprovado com sucesso!');
    } catch (err) {
      setError('Erro ao aprovar motorista');
      console.error(err);
    }
  };

  const handleReject = async (driverId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este motorista?')) {
      return;
    }

    try {
      await api.post(`/admin/reject-driver/${driverId}`);
      fetchData(); // Recarrega os dados
      alert('Motorista rejeitado com sucesso!');
    } catch (err) {
      setError('Erro ao rejeitar motorista');
      console.error(err);
    }
  };

  const fetchRides = async () => {
    try {
      setError(''); // Limpa erro anterior
      const response = await api.get('/admin/rides');
      setRides(response.data);
    } catch (error) {
      console.error('Erro ao carregar corridas:', error);
      setError(error.response?.data?.message || 'Erro ao carregar corridas');
    }
  };

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm('Tem certeza que deseja remover esta corrida?')) {
      return;
    }

    try {
      setError(''); // Limpa erro anterior
      await api.delete(`/admin/rides/${rideId}`);
      setRides(rides.filter(ride => ride._id !== rideId));
    } catch (error) {
      console.error('Erro ao remover corrida:', error);
      setError(error.response?.data?.message || 'Erro ao remover corrida');
    }
  };

  useEffect(() => {
    if (tab === 'rides') {
      fetchRides();
    }
  }, [tab]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>

      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 ${tab === 'drivers' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setTab('drivers')}
        >
          Motoristas
        </button>
        <button
          className={`py-2 px-4 ${tab === 'rides' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setTab('rides')}
        >
          Corridas
        </button>
      </div>

      {/* Conteúdo das tabs */}
      {tab === 'drivers' ? (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Cabeçalho */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {/* Estatísticas */}
            {stats && (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Motoristas Ativos
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.activeDrivers}
                    </dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Motoristas Pendentes
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.pendingDrivers}
                    </dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Passageiros
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalPassengers}
                    </dd>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Motoristas Pendentes */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">
                Motoristas Pendentes ({pendingDrivers.length})
              </h2>

              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
                {pendingDrivers.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {pendingDrivers.map((driver) => (
                      <li key={driver._id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {driver.name}
                            </h3>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{driver.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Telefone</p>
                                <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Veículo</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.vehicle.model} - {driver.vehicle.plate}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Documentos</p>
                                <p className="text-sm font-medium text-gray-900">
                                  CNH: {driver.documents.cnh}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApprove(driver._id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(driver._id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 text-center text-gray-500">
                    Nenhum motorista pendente de aprovação
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passageiro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motorista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rides.map(ride => (
                <tr key={ride._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(ride.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ride.origin?.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ride.destination?.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ride.passenger?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ride.passenger?.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ride.driver?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ride.driver?.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                      ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ride.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    R$ {(ride.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteRide(ride._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 