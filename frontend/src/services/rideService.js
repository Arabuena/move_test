import api from './api';

export const rideService = {
  // Solicitar uma corrida (passageiro)
  requestRide: async (rideData) => {
    try {
      const response = await api.post('/rides', rideData);
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      throw error;
    }
  },

  // Aceitar uma corrida (motorista)
  acceptRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      throw error;
    }
  },

  // Motorista chegou ao local
  driverArrived: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/arrived`);
      return response.data;
    } catch (error) {
      console.error('Erro ao informar chegada:', error);
      throw error;
    }
  },

  // Iniciar corrida
  startRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/start`);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar corrida:', error);
      throw error;
    }
  },

  // Finalizar corrida
  completeRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar corrida:', error);
      throw error;
    }
  },

  // Cancelar corrida
  cancelRide: async (rideId, reason) => {
    try {
      const response = await api.post(`/rides/${rideId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      throw error;
    }
  },

  // Avaliar corrida
  rateRide: async (rideId, rating) => {
    try {
      const response = await api.post(`/rides/${rideId}/rate`, rating);
      return response.data;
    } catch (error) {
      console.error('Erro ao avaliar corrida:', error);
      throw error;
    }
  }
}; 