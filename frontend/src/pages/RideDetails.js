import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import RideStatus from '../components/RideStatus';

export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await api.get(`/rides/${rideId}`);
        setRide(response.data);
      } catch (err) {
        console.error('Erro ao buscar corrida:', err);
        setError('Erro ao carregar detalhes da corrida');
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId]);

  const handleCancelRide = async () => {
    try {
      await api.post(`/rides/cancel/${rideId}`);
      navigate('/request-ride');
    } catch (err) {
      setError('Erro ao cancelar corrida');
      console.error(err);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!ride) return <div>Corrida não encontrada</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">
          Detalhes da Corrida
        </h1>
        <RideStatus ride={ride} onCancel={handleCancelRide} />
      </div>
    </div>
  );
} 