// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Limitador para APIs gerais
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limitar cada IP a 100 requisições por janela
    standardHeaders: true, // Retornar info de limitação de taxa nos cabeçalhos `RateLimit-*`
    legacyHeaders: false, // Desabilitar cabeçalhos `X-RateLimit-*`
    message: 'Muitas requisições deste IP, tente novamente após 15 minutos'
});

// Limitador específico para login
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limitar cada IP a 10 tentativas de login
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas tentativas de login deste IP, tente novamente após 15 minutos',
    skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});