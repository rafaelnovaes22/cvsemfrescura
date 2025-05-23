const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.profile);
router.get('/credits', authMiddleware, userController.getCredits);

// Rotas para o onboarding
router.post('/onboarding', authMiddleware, userController.completeOnboarding);
router.get('/onboarding-status', authMiddleware, userController.getOnboardingStatus);

// Rota apenas para ambiente de desenvolvimento - permite reset do status de onboarding
if (process.env.NODE_ENV !== 'production') {
  router.post('/reset-onboarding', authMiddleware, userController.resetOnboardingStatus);
}

module.exports = router;
