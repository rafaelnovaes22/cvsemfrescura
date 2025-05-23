const express = require('express');
const router = express.Router();
const giftCodeController = require('../controllers/giftCodeController');
const authMiddleware = require('../utils/authMiddleware');

// Rota pública para validar um código (não requer autenticação)
router.post('/validate', giftCodeController.validateCode);

// Rota protegida para aplicar um código ao usuário
router.post('/apply', authMiddleware, giftCodeController.applyCode);

// Rota protegida para criar novos códigos (administradores)
router.post('/create', authMiddleware, giftCodeController.createCode);

module.exports = router;
