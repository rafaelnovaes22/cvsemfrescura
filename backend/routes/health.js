const express = require('express');
const router = express.Router();
const sequelize = require('../db');

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        // Verificar conexão com banco de dados
        await sequelize.authenticate();

        // Verificar variáveis de ambiente críticas
        const requiredEnvVars = [
            'JWT_SECRET',
            'OPENAI_API_KEY',
            'STRIPE_SECRET_KEY'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            return res.status(500).json({
                status: 'error',
                message: 'Variáveis de ambiente ausentes',
                missing: missingVars,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            status: 'ok',
            message: 'Serviço funcionando corretamente',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro na verificação de saúde',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check detalhado (apenas para desenvolvimento)
router.get('/detailed', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Endpoint não disponível em produção' });
    }

    try {
        const dbStatus = await sequelize.authenticate()
            .then(() => 'connected')
            .catch(() => 'disconnected');

        res.json({
            status: 'ok',
            checks: {
                database: dbStatus,
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 