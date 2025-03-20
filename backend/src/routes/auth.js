const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    console.log('Dados recebidos no registro:', { name, email, phone, role });

    // Validação do role
    if (role && !['passenger', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }

    const user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 8),
      phone,
      role: role || 'passenger'
    });

    await user.save();
    console.log('Usuário salvo:', user);

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role // Incluindo o role no token
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 