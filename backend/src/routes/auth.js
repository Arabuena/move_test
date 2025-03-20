const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    console.log('Iniciando registro com dados:', req.body);

    const { name, email, password, role = 'user', phone } = req.body;

    // Validações
    if (!name || !email || !password) {
      console.log('Dados inválidos:', { name, email, password });
      return res.status(400).json({ 
        message: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Verifica se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email já cadastrado:', email);
      return res.status(409).json({ 
        message: 'Este email já está cadastrado' 
      });
    }

    // Cria o hash da senha
    console.log('Criando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    console.log('Criando usuário com dados:', { name, email, role });
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      phone: phone || '',
      isAvailable: false,
      isApproved: true,
      status: 'active'
    });

    // Salva o usuário
    console.log('Salvando usuário...');
    await user.save();
    console.log('Usuário salvo com sucesso:', user._id);

    // Gera o token
    console.log('Gerando token...');
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove a senha antes de enviar
    const userResponse = user.toObject();
    delete userResponse.password;

    // Retorna os dados
    console.log('Enviando resposta...');
    res.status(201).json({
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Erro detalhado no registro:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      validationErrors: error.errors
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Erro ao registrar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 