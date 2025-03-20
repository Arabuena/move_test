const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

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
    
    // Notificar motoristas próximos
    // Implementar lógica de notificação aqui
    
    res.status(201).json(ride);
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aceitar uma corrida (motorista)
router.post('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Apenas motoristas podem aceitar corridas' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ error: 'Esta corrida não está mais disponível' });
    }

    ride.driver = req.user._id;
    ride.status = 'accepted';
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Motorista chegou ao local
router.post('/:id/arrived', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.driver.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    ride.status = 'driver_arrived';
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Iniciar corrida
router.post('/:id/start', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.driver.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    ride.status = 'in_progress';
    ride.startTime = new Date();
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Finalizar corrida
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.driver.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    ride.status = 'completed';
    ride.endTime = new Date();
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancelar corrida
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    // Verifica se quem está cancelando é o passageiro ou o motorista da corrida
    if (ride.passenger.toString() !== req.user._id.toString() && 
        (!ride.driver || ride.driver.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    ride.status = 'cancelled';
    ride.cancelReason = req.body.reason;
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Avaliar corrida
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    const isPassenger = ride.passenger.toString() === req.user._id.toString();
    const isDriver = ride.driver && ride.driver.toString() === req.user._id.toString();

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const ratingField = isPassenger ? 'driver' : 'passenger';
    ride.rating[ratingField] = {
      score: req.body.score,
      comment: req.body.comment
    };

    await ride.save();
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 