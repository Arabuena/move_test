const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conectado ao MongoDB Atlas');
})
.catch((error) => {
  console.error('Erro ao conectar ao MongoDB:', error);
});

mongoose.connection.on('error', (error) => {
  console.error('Erro na conexão MongoDB:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Desconectado do MongoDB');
}); 