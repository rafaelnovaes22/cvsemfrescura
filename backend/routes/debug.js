const express = require('express');
const router = express.Router();
const rateLimitMonitor = require('../services/rateLimitMonitor');

// Endpoint para verificar status dos rate limits
router.get('/rate-limits', (req, res) => {
    try {
        const usageStats = rateLimitMonitor.getUsageStats();
        const recommendation = rateLimitMonitor.getRecommendedService(10000);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            usage: usageStats,
            recommendation: recommendation,
            status: {
                openai: {
                    available: rateLimitMonitor.canMakeOpenAIRequest(10000),
                    waitTime: rateLimitMonitor.getOpenAIWaitTime()
                }
            }
        });
    } catch (error) {
        console.error('[Debug] Erro ao obter rate limits:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para resetar contadores de rate limit (apenas para debug)
router.post('/reset-rate-limits', (req, res) => {
    try {
        // Reset manual dos contadores
        rateLimitMonitor.openaiLimits.requests.used = 0;
        rateLimitMonitor.openaiLimits.tokens.used = 0;
        rateLimitMonitor.claudeLimits.requests.used = 0;
        rateLimitMonitor.claudeLimits.tokens.used = 0;

        res.json({
            success: true,
            message: 'Rate limits resetados',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Debug] Erro ao resetar rate limits:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 