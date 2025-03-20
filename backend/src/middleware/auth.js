const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token recebido:', token);
    
    if (!token) {
      console.log('Token não fornecido');
      return res.status(403).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    const user = await User.findById(decoded.userId || decoded.id);
    console.log('Usuário encontrado:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    if (!user.role) {
      console.log('Usuário sem role definido');
      return res.status(403).json({ error: 'Usuário sem permissões definidas' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(403).json({ 
      error: 'Por favor, autentique-se.',
      details: error.message 
    });
  }
};

module.exports = auth; 