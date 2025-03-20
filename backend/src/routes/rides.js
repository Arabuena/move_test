const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');

// Criar uma nova corrida
router.post('/', auth, async (req, res) => {
  try {
    console.log('Usuário autenticado:', req.user);
    
    // Verifica se o usuário é um passageiro
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ 
        error: 'Apenas passageiros podem solicitar corridas' 
      });
    }

    const ride = new Ride({
      passenger: req.user._id,
      origin: req.body.origin,
      destination: req.body.destination,
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