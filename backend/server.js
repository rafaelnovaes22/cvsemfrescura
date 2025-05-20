require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));

// Servir arquivos estáticos do frontend
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Redirecionar rota raiz para página de login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Redirecionar qualquer outra rota que não seja API ou a raiz para index.html (SPA)
app.get(/^\/(?!api)(?!login\.html)(?!$).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const sequelize = require('./db');
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`ATS backend rodando na porta ${PORT}`);
  });
});
