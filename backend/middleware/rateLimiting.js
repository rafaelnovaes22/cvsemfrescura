// Middleware de Rate Limiting para proteção adicional
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Rate limiting agressivo para rotas de pagamento
const paymentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas por IP em 15 minutos
    message: {
        error: 'Muitas tentativas de pagamento',
        message: 'Aguarde alguns minutos antes de tentar novamente',
        code: 'TOO_MANY_PAYMENT_ATTEMPTS',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.error('🚨 [RATE-LIMIT] Tentativas excessivas de pagamento:', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });

        res.status(429).json({
            error: 'Muitas tentativas de pagamento',
            message: 'Aguarde alguns minutos antes de tentar novamente',
            code: 'TOO_MANY_PAYMENT_ATTEMPTS'
        });
    }
});

// Rate limiting moderado para outras rotas da API
const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requisições por IP em 15 minutos
    message: {
        error: 'Muitas requisições',
        message: 'Limite de requisições excedido',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Slow down para tentativas suspeitas (atraso progressivo)
const paymentSlowDown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 2, // Aplicar atraso após 2 requisições
    delayMs: 500, // Atraso de 500ms
    maxDelayMs: 10000, // Máximo 10 segundos de atraso
    skipFailedRequests: false,
    skipSuccessfulRequests: true,
    onLimitReached: (req, res) => {
        console.warn('⚠️ [SLOW-DOWN] IP suspeito detectado:', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });
    }
});

// Rate limiting específico para chaves do Stripe
const stripeKeyRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // Máximo 10 requisições de chave em 5 minutos
    message: {
        error: 'Muitas solicitações de chave',
        message: 'Limite de solicitações de configuração excedido',
        code: 'CONFIG_RATE_LIMIT'
    }
});

// Rate limiting para login/autenticação
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas de login por IP
    message: {
        error: 'Muitas tentativas de login',
        message: 'Aguarde antes de tentar fazer login novamente',
        code: 'AUTH_RATE_LIMIT'
    },
    skipSuccessfulRequests: true, // Não contar logins bem-sucedidos
});

module.exports = {
    paymentRateLimit,
    apiRateLimit,
    paymentSlowDown,
    stripeKeyRateLimit,
    authRateLimit
}; 