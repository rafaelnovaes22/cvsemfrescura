const express = require('express');
const router = express.Router();

// 🚦 Importar rate limiting
const { stripeKeyRateLimit } = require('../middleware/rateLimiting');

// 🛡️ Importar headers de segurança
const { additionalSecurityHeaders, detectBypassAttempts } = require('../middleware/securityHeaders');

// Rota para obter a chave pública do Stripe (PROTEGIDA)
router.get('/stripe-key',
    additionalSecurityHeaders,     // 🛡️ Headers de segurança
    detectBypassAttempts,          // 🛡️ Detectar tentativas de bypass
    stripeKeyRateLimit,            // 🚦 Rate limiting específico para chaves
    (req, res) => {
        console.log('🔑 [CONFIG] Solicitação de chave pública do Stripe:', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        try {
            const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

            if (!publishableKey) {
                console.error('❌ [CONFIG] STRIPE_PUBLISHABLE_KEY não configurada');
                return res.status(500).json({
                    error: 'Configuração incompleta',
                    message: 'Chave pública do Stripe não configurada'
                });
            }

            // Verificar se é uma chave pública válida (deve começar com pk_)
            if (!publishableKey.startsWith('pk_')) {
                console.error('🚨 [CONFIG] TENTATIVA DE EXPOSIÇÃO: Chave não é pública!');
                return res.status(500).json({
                    error: 'Configuração inválida',
                    message: 'Tipo de chave incorreto'
                });
            }

            console.log('✅ [CONFIG] Chave pública fornecida com sucesso');

            res.json({
                publishableKey: publishableKey,
                environment: publishableKey.includes('test') ? 'test' : 'live'
            });

        } catch (error) {
            console.error('❌ [CONFIG] Erro ao fornecer chave:', error);
            res.status(500).json({
                error: 'Erro interno',
                message: 'Não foi possível obter configuração'
            });
        }
    }
);

// Rota de health check para configurações
router.get('/health', (req, res) => {
    const config = {
        stripe: {
            configured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY,
            environment: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'test' : 'live'
        },
        env: process.env.NODE_ENV || 'development'
    };

    res.json(config);
});

module.exports = router; 