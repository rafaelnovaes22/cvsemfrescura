const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../utils/authMiddleware');
const optionalAuthMiddleware = require('../utils/optionalAuthMiddleware');

// Middleware para processar o corpo bruto da requisição para webhooks
const rawBodyMiddleware = (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

// Rotas de pagamento públicas (autenticação opcional)
router.post('/create-intent', optionalAuthMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', optionalAuthMiddleware, paymentController.confirmPayment);

// Rotas de pagamento protegidas (requerem login)
router.get('/history', authMiddleware, paymentController.getTransactionHistory);
router.post('/verify-pending', authMiddleware, paymentController.verifyPendingPayments);
router.post('/cleanup-pending', authMiddleware, paymentController.cleanupOldPendingTransactions);
router.get('/user-info', authMiddleware, paymentController.getUserPaymentInfo);

// Rota de webhook (não requer autenticação, mas usa middleware para rawBody)
router.post('/webhook', rawBodyMiddleware, paymentController.handleWebhook);

module.exports = router;
