require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const atsRoutes = require('./routes/ats');
const feedbackRoutes = require('./routes/feedback');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/ats', atsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Servir arquivos estáticos do frontend
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Redirecionar qualquer rota que não seja API para index.html (SPA)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ATS backend rodando na porta ${PORT}`);
});
