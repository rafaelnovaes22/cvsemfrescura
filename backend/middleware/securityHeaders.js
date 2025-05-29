// Middleware para headers de segurança robustos
const helmet = require('helmet');

const securityHeaders = () => {
    return helmet({
        // Configurações rigorosas de segurança
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Necessário para Stripe
                    "https://js.stripe.com",
                    "https://checkout.stripe.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com"
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "https:"
                ],
                connectSrc: [
                    "'self'",
                    "https://api.stripe.com",
                    "https://checkout.stripe.com"
                ],
                frameSrc: [
                    "https://js.stripe.com",
                    "https://hooks.stripe.com"
                ],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
            }
        },

        // Headers rigorosos
        hsts: {
            maxAge: 31536000, // 1 ano
            includeSubDomains: true,
            preload: true
        },

        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

        // Desabilitar headers que expõem informações
        hidePoweredBy: true
    });
};

// Middleware adicional para headers personalizados
const additionalSecurityHeaders = (req, res, next) => {
    // Headers de segurança personalizados
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Security-Level', 'HIGH');
    res.setHeader('X-Rate-Limit-Policy', 'ENFORCED');

    // Política rígida de cookies
    res.setHeader('Set-Cookie-Policy', 'Secure; SameSite=Strict; HttpOnly');

    // Não permitir embedding em iframes
    res.setHeader('X-Frame-Options', 'DENY');

    // Controle rigoroso de cache para dados sensíveis
    if (req.path.includes('/api/payment') || req.path.includes('/api/config')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }

    // Log de headers suspeitos
    const suspiciousHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-cluster-client-ip',
        'cf-connecting-ip'
    ];

    suspiciousHeaders.forEach(header => {
        if (req.headers[header]) {
            console.log(`🔍 [SECURITY] Header ${header}:`, req.headers[header]);
        }
    });

    next();
};

// Middleware para detectar tentativas de bypass
const detectBypassAttempts = (req, res, next) => {
    const suspiciousPatterns = [
        /\.\.\//, // Path traversal
        /\.\.\\/,
        /<script/i, // XSS básico
        /javascript:/i,
        /data:text\/html/i,
        /eval\(/i,
        /function\(/i,
        /setTimeout/i,
        /setInterval/i
    ];

    // Verificar URL e parâmetros
    const fullUrl = req.originalUrl || req.url;
    const queryString = JSON.stringify(req.query);
    const bodyString = JSON.stringify(req.body);

    suspiciousPatterns.forEach(pattern => {
        if (pattern.test(fullUrl) || pattern.test(queryString) || pattern.test(bodyString)) {
            console.error('🚨 [SECURITY] Tentativa de bypass detectada:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: fullUrl,
                pattern: pattern.toString(),
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Padrão suspeito detectado na requisição',
                code: 'SUSPICIOUS_PATTERN_DETECTED'
            });
        }
    });

    next();
};

module.exports = {
    securityHeaders,
    additionalSecurityHeaders,
    detectBypassAttempts
}; 