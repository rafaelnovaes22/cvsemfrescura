const express = require('express');
const router = express.Router();
const config = require('../config/environment');

// Rota para fornecer a chave pública do Stripe
router.get('/stripe-key', (req, res) => {
    try {
        const stripeConfig = config.stripe;
        const publishableKey = stripeConfig.publishableKey;

        if (!publishableKey) {
            return res.status(500).json({
                error: 'Chave Stripe não configurada no servidor',
                details: 'STRIPE_PUBLISHABLE_KEY não encontrada na configuração'
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
        console.log('🌍 Ambiente detectado:', config.environment.name);
        console.log('🔑 Tipo de chave:', stripeConfig.environment);

        res.json({
            publishableKey: publishableKey,
            environment: stripeConfig.environment,
            source: config.environment.isLocal ? 'hardcoded-test' : '.env',
            timestamp: new Date().toISOString(),
            detectedEnvironment: config.environment.name,
            isLocal: config.environment.isLocal,
            isProduction: config.environment.isProduction
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
    const stripeConfig = config.stripe;

    const healthCheck = {
        stripe: {
            configured: !!stripeConfig.secretKey && !!stripeConfig.publishableKey,
            environment: stripeConfig.environment,
            keyType: stripeConfig.publishableKey?.startsWith('pk_test_') ? 'test' : 'live'
        },
        environment: {
            name: config.environment.name,
            isLocal: config.environment.isLocal,
            isProduction: config.environment.isProduction,
            isRailway: config.environment.isRailway
        },
        database: {
            type: config.database.type,
            configured: !!config.database.url
        },
        api: {
            port: config.api.port,
            nodeEnv: config.api.nodeEnv
        }
    };

    res.json(healthCheck);
});

module.exports = router; 