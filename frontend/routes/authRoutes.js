// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const limiter = require('../middleware/rateLimit');

const router = express.Router();

// Aplicar limitação de taxa para rotas de login
router.post('/login', limiter.loginLimiter, authController.login);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);

module.exports = router;
