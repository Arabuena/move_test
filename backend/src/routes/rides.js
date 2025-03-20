const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');

// Criar uma nova corrida
router.post('/', auth, async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    console.log('Usuário autenticado:', {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    });
    
    // Verifica se o usuário é um passageiro
    if (req.user.role !== 'passenger') {
      console.log('Acesso negado - Role incorreto:', req.user.role);
      return res.status(403).json({ 
        error: 'Apenas passageiros podem solicitar corridas',
        userRole: req.user.role,
        requiredRole: 'passenger'
      });
    }

    // Validação dos dados
    const { origin, destination, distance, duration, price } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origem e destino são obrigatórios' 
      });
    }

    if (!origin.coordinates || !destination.coordinates) {
      return res.status(400).json({ 
        error: 'Coordenadas de origem e destino são obrigatórias' 
      });
    }

    const ride = new Ride({
      passenger: req.user._id,
      origin: {
        coordinates: origin.coordinates,
        address: origin.address
      },
      destination: {
        coordinates: destination.coordinates,
        address: destination.address
      },
      distance,
      duration,
      price,
      status: 'pending'
    });

    await ride.save();
    res.status(201).json(ride);
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 