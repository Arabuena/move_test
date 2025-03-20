const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Token não fornecido');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(403).json({ error: 'Por favor, autentique-se.' });
  }
};

module.exports = auth; 