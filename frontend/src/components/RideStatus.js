import React from 'react';

const statusMessages = {
  pending: 'Procurando motorista...',
  accepted: 'Motorista a caminho',
  driver_arrived: 'Motorista chegou ao local',
  in_progress: 'Em andamento',
  completed: 'Finalizada',
  cancelled: 'Cancelada'
};

export default function RideStatus({ status, ride }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Status da Corrida
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusMessages[status] || status}
          </p>
        </div>
        {status === 'in_progress' && (
          <div className="animate-pulse flex space-x-4">
            <div className="h-3 w-3 bg-green-400 rounded-full"></div>
          </div>
        )}
      </div>

      {ride?.driver && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900">
            Informações do Motorista
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {ride.driver.name} • {ride.driver.phone}
          </p>
        </div>
      )}
    </div>
  );
} 