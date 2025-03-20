import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function RideStatus({ ride: initialRide, onCancel }) {
  const [ride, setRide] = useState(initialRide);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/rides/${ride._id}`);
        setRide(response.data);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        setError('Erro ao atualizar status da corrida');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ride._id]);

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Aguardando motorista',
      'accepted': 'Motorista a caminho',
      'in_progress': 'Em andamento',
      'completed': 'Finalizada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900">Status da Corrida</h2>
      
      {error && (
        <div className="mt-2 text-red-500">
          {error}
        </div>
      )}

      <div className="mt-4">
        <div className="text-lg font-medium text-gray-900">
          {getStatusText(ride.status)}
        </div>

        {ride.driver && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Motorista</p>
            <p className="text-gray-900">{ride.driver.name}</p>
          </div>
        )}

        {ride.status === 'pending' && (
          <button
            onClick={onCancel}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Cancelar Corrida
          </button>
        )}
      </div>
    </div>
  );
} 