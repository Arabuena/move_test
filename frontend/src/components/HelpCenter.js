import React, { useState, useEffect } from 'react';
import ChatWithDriver from './ChatWithDriver';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function HelpCenter({ type }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCurrentRide = async () => {
      try {
        const response = await api.get('/rides/current');
        setCurrentRide(response.data);
      } catch (err) {
        console.error('Erro ao buscar corrida:', err);
        setError('Não foi possível carregar a corrida atual');
      } finally {
        setLoading(false);
      }
    };

    if (type === 'ride') {
      fetchCurrentRide();
    }
  }, [type]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </button>
        <h2 className="text-2xl font-semibold">Central de Ajuda</h2>
      </div>

      {type === 'ride' ? (
        <div>
          <h3 className="text-lg font-medium mb-4">Ajuda com a corrida</h3>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : currentRide ? (
            <ChatWithDriver ride={currentRide} />
          ) : (
            <div className="text-center py-4">
              Nenhuma corrida em andamento
            </div>
          )}
        </div>
      ) : type === 'support' ? (
        <div className="text-center py-8">
          <svg 
            className="w-16 h-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
          <h3 className="text-xl font-medium mb-2">Em breve!</h3>
          <p className="text-gray-600">
            O suporte estará disponível em breve para melhor atendê-lo.
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Selecione uma opção de ajuda no menu.
          </p>
        </div>
      )}
    </div>
  );
} 