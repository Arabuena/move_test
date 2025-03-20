const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/database');

const app = express();

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Configuração do CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware para parse do JSON
app.use(express.json());

// Rotas
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    message: 'Erro interno no servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; 