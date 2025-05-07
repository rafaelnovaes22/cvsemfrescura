/**
 * Rotas para gerenciamento de feedback sobre respostas do modelo
 */

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Rota para registrar feedback do usuário
router.post('/', feedbackController.recordFeedback);

// Rotas administrativas (requerem token de autenticação)
router.get('/stats', feedbackController.getFeedbackStats);
router.get('/recent', feedbackController.getRecentFeedbacks);

module.exports = router;
