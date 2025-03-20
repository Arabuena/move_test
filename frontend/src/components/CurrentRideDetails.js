import React from 'react';

export default function CurrentRideDetails({ ride, status, onComplete, onStart }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6">
      <div className="max-w-xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Corrida em Andamento
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Passageiro</p>
            <p className="text-gray-900">{ride.passenger.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Origem</p>
            <p className="text-gray-900">{ride.origin.address}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Destino</p>
            <p className="text-gray-900">{ride.destination.address}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Preço</p>
            <p className="text-gray-900">R$ {ride.price.toFixed(2)}</p>
          </div>

          {status === 'accepted' && (
            <button
              onClick={onStart}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Iniciar Corrida
            </button>
          )}

          {status === 'in_progress' && (
            <button
              onClick={onComplete}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Finalizar Corrida
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 