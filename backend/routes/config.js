const express = require('express');
const router = express.Router();

// Rota para fornecer a chave pública do Stripe
router.get('/stripe-key', (req, res) => {
    try {
        const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            return res.status(500).json({
                error: 'Chave Stripe não configurada no servidor',
                details: 'STRIPE_PUBLISHABLE_KEY não encontrada no .env'
            });
        }

        // Validar formato da chave
        if (!publishableKey.startsWith('pk_')) {
            return res.status(500).json({
                error: 'Chave Stripe inválida',
                details: 'A chave deve começar com pk_test_ ou pk_live_'
            });
        }

        console.log('✅ Fornecendo chave Stripe:', publishableKey.substring(0, 20) + '...');

        res.json({
            publishableKey: publishableKey,
            environment: publishableKey.startsWith('pk_test_') ? 'test' : 'live',
            source: '.env',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao obter chave Stripe:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

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