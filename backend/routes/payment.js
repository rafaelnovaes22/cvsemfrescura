const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../utils/authMiddleware');

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

// Rotas de pagamento (todas protegidas, exceto webhook)
router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.get('/history', authMiddleware, paymentController.getTransactionHistory);
router.post('/verify-pending', authMiddleware, paymentController.verifyPendingPayments);
router.get('/user-info', authMiddleware, paymentController.getUserPaymentInfo);

// Rota de webhook (não requer autenticação, mas usa middleware para rawBody)
router.post('/webhook', rawBodyMiddleware, paymentController.handleWebhook);

module.exports = router;
