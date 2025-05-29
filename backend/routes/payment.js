const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../utils/authMiddleware');
const optionalAuthMiddleware = require('../utils/optionalAuthMiddleware');

// 🔒 Importar middleware de segurança
const {
  validatePayloadSecurity,
  validatePaymentSecurity,
  auditPaymentRequest
} = require('../middleware/securityValidation');

// 🔓 Importar middleware de descriptografia
const {
  decryptPayload,
  encryptResponse,
  validateEncryptedData
} = require('../middleware/decryptionMiddleware');

// 🚦 Importar rate limiting
const {
  paymentRateLimit,
  paymentSlowDown,
  stripeKeyRateLimit
} = require('../middleware/rateLimiting');

// 🛡️ Importar headers de segurança
const {
  additionalSecurityHeaders,
  detectBypassAttempts
} = require('../middleware/securityHeaders');

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

// 🔒🔓🚦🛡️ Pipeline COMPLETO de segurança, criptografia e rate limiting
// Ordem: headers → bypass detection → rate limit → slow down → auditoria → descriptografia → 
//        validação integridade → validação segurança → auth → criptografia resposta → controller

// Rotas de pagamento públicas (autenticação opcional) - MÁXIMA SEGURANÇA
router.post('/create-intent',
  additionalSecurityHeaders,    // 🛡️ Headers de segurança
  detectBypassAttempts,         // 🛡️ Detectar tentativas de bypass
  paymentRateLimit,             // 🚦 Rate limiting rigoroso
  paymentSlowDown,              // 🐌 Slow down progressivo
  auditPaymentRequest,          // 📋 Log de auditoria
  decryptPayload,               // 🔓 Descriptografar dados se necessário
  validateEncryptedData,        // 🔍 Validar integridade dos dados descriptografados
  validatePayloadSecurity,      // 🔒 Validação geral de segurança  
  validatePaymentSecurity,      // 💳 Validação específica de pagamentos
  optionalAuthMiddleware,       // 🔐 Autenticação opcional
  encryptResponse,              // 🔐 Preparar criptografia da resposta
  paymentController.createPaymentIntent
);

router.post('/confirm',
  additionalSecurityHeaders,
  detectBypassAttempts,
  paymentRateLimit,
  paymentSlowDown,
  auditPaymentRequest,
  decryptPayload,
  validateEncryptedData,
  validatePayloadSecurity,
  validatePaymentSecurity,
  optionalAuthMiddleware,
  encryptResponse,
  paymentController.confirmPayment
);

// Rotas de pagamento protegidas (requerem login) - PROTEÇÃO MODERADA
router.get('/history',
  additionalSecurityHeaders,
  authMiddleware,
  encryptResponse,               // 🔐 Criptografar resposta se cliente suportar
  paymentController.getTransactionHistory
);

router.post('/verify-pending',
  additionalSecurityHeaders,
  detectBypassAttempts,
  paymentRateLimit,
  auditPaymentRequest,
  decryptPayload,
  validateEncryptedData,
  validatePayloadSecurity,
  authMiddleware,
  encryptResponse,
  paymentController.verifyPendingPayments
);

router.get('/user-info',
  additionalSecurityHeaders,
  authMiddleware,
  encryptResponse,
  paymentController.getUserPaymentInfo
);

// Rota de webhook (não requer autenticação, mas usa middleware para rawBody)
// Webhook não precisa das validações pois vem diretamente do Stripe
// MAS precisa de proteção contra ataques
router.post('/webhook',
  additionalSecurityHeaders,
  detectBypassAttempts,
  rawBodyMiddleware,
  paymentController.handleWebhook
);

module.exports = router;
