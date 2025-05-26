const express = require('express');
const router = express.Router();
const {
    requestPasswordReset,
    verifyResetToken,
    confirmPasswordReset
} = require('../controllers/passwordResetController');

// Solicitar reset de senha
router.post('/request', requestPasswordReset);

// Verificar se token é válido
router.get('/verify/:token', verifyResetToken);

// Confirmar nova senha
router.post('/confirm', confirmPasswordReset);

module.exports = router; 