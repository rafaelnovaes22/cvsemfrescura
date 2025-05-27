const express = require('express');
const router = express.Router();
const os = require('os');
const { alertingSystem } = require('../utils/alerting');
const { costTracker } = require('../utils/costTracker');

// Armazenar métricas em memória (em produção, usar Redis ou banco)
let metrics = {
    requests: {
        total: 0,
        byEndpoint: {},
        errors: 0,
        lastHour: []
    },
    system: {
        startTime: Date.now(),
        uptime: 0,
        memory: {},
        cpu: {}
    },
    business: {
        cvAnalyses: 0,
        newUsers: 0,
        payments: 0,
        errors: {
            auth: 0,
            payment: 0,
            analysis: 0
        }
    }
};

// Middleware para coletar métricas de requests
const collectMetrics = (req, res, next) => {
    const start = Date.now();

    metrics.requests.total++;
    metrics.requests.byEndpoint[req.path] = (metrics.requests.byEndpoint[req.path] || 0) + 1;

    // Armazenar request da última hora
    metrics.requests.lastHour.push({
        timestamp: Date.now(),
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Limpar requests antigas (mais de 1 hora)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    metrics.requests.lastHour = metrics.requests.lastHour.filter(r => r.timestamp > oneHourAgo);

    res.on('finish', () => {
        const duration = Date.now() - start;

        if (res.statusCode >= 400) {
            metrics.requests.errors++;
        }
    });

    next();
};

// 📊 Dashboard principal de métricas
router.get('/dashboard', async (req, res) => {
    try {
        // Atualizar métricas do sistema
        metrics.system.uptime = Date.now() - metrics.system.startTime;
        metrics.system.memory = process.memoryUsage();
        metrics.system.cpu = process.cpuUsage();

        // Buscar métricas do banco de dados
        const User = require('../models/user');
        const Transaction = require('../models/Transaction');

        const [userCount, transactionCount] = await Promise.all([
            User.count(),
            Transaction.count()
        ]);

        const dashboard = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            system: {
                uptime: Math.floor(metrics.system.uptime / 1000), // segundos
                uptimeFormatted: formatUptime(metrics.system.uptime),
                memory: {
                    used: Math.round(metrics.system.memory.heapUsed / 1024 / 1024), // MB
                    total: Math.round(metrics.system.memory.heapTotal / 1024 / 1024), // MB
                    external: Math.round(metrics.system.memory.external / 1024 / 1024) // MB
                },
                cpu: {
                    user: metrics.system.cpu.user,
                    system: metrics.system.cpu.system
                },
                platform: os.platform(),
                nodeVersion: process.version
            },
            requests: {
                total: metrics.requests.total,
                errors: metrics.requests.errors,
                errorRate: metrics.requests.total > 0 ? (metrics.requests.errors / metrics.requests.total * 100).toFixed(2) + '%' : '0%',
                lastHour: metrics.requests.lastHour.length,
                byEndpoint: metrics.requests.byEndpoint
            },
            business: {
                totalUsers: userCount,
                totalTransactions: transactionCount,
                cvAnalyses: metrics.business.cvAnalyses,
                newUsers: metrics.business.newUsers,
                payments: metrics.business.payments,
                errors: metrics.business.errors
            },
            health: {
                database: 'connected', // TODO: implementar check real
                memory: metrics.system.memory.heapUsed / metrics.system.memory.heapTotal < 0.9 ? 'healthy' : 'warning',
                uptime: metrics.system.uptime > 60000 ? 'healthy' : 'starting'
            }
        };

        // Verificar e processar alertas
        alertingSystem.checkMetricsAndAlert(metrics);

        res.json(dashboard);
    } catch (error) {
        console.error('Erro ao gerar dashboard:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// 📈 Endpoint de métricas Prometheus-style
router.get('/metrics', (req, res) => {
    const prometheusMetrics = `
# HELP cv_requests_total Total number of HTTP requests
# TYPE cv_requests_total counter
cv_requests_total ${metrics.requests.total}

# HELP cv_requests_errors_total Total number of HTTP errors
# TYPE cv_requests_errors_total counter
cv_requests_errors_total ${metrics.requests.errors}

# HELP cv_uptime_seconds Application uptime in seconds
# TYPE cv_uptime_seconds gauge
cv_uptime_seconds ${Math.floor(metrics.system.uptime / 1000)}

# HELP cv_memory_used_bytes Memory usage in bytes
# TYPE cv_memory_used_bytes gauge
cv_memory_used_bytes ${metrics.system.memory.heapUsed}

# HELP cv_users_total Total number of users
# TYPE cv_users_total gauge
cv_users_total ${metrics.business.newUsers}

# HELP cv_analyses_total Total number of CV analyses
# TYPE cv_analyses_total counter
cv_analyses_total ${metrics.business.cvAnalyses}
  `.trim();

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
});

// 🚨 Alertas e notificações
router.get('/alerts', (req, res) => {
    const alerts = [];

    // Verificar memory usage
    const memoryUsage = metrics.system.memory.heapUsed / metrics.system.memory.heapTotal;
    if (memoryUsage > 0.9) {
        alerts.push({
            severity: 'warning',
            type: 'memory',
            message: `Memory usage is ${(memoryUsage * 100).toFixed(1)}%`,
            timestamp: new Date().toISOString()
        });
    }

    // Verificar error rate
    const errorRate = metrics.requests.total > 0 ? metrics.requests.errors / metrics.requests.total : 0;
    if (errorRate > 0.1) { // > 10%
        alerts.push({
            severity: 'critical',
            type: 'error_rate',
            message: `Error rate is ${(errorRate * 100).toFixed(1)}%`,
            timestamp: new Date().toISOString()
        });
    }

    res.json({
        status: alerts.length === 0 ? 'healthy' : 'warning',
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
    });
});

// 💰 Dashboard de custos das APIs
router.get('/costs', (req, res) => {
    try {
        const costSummary = costTracker.getCostSummary();
        const creditEstimation = costTracker.estimateCreditDepletion();

        // Calcular estatísticas da nova estratégia Claude-first
        const breakdown = costSummary.thisMonth.breakdown;
        const claudeCosts = breakdown.claude?.total || 0;
        const openaiCosts = breakdown.openai?.total || 0;
        const totalCosts = claudeCosts + openaiCosts;

        // Estimar economia com estratégia Claude-first
        const claudeUsage = breakdown.claude?.services || {};
        const openaiUsage = breakdown.openai?.services || {};

        let totalSavings = 0;
        let estimatedOpenAIEquivalent = 0;

        // Para cada uso do Claude, calcular quanto custaria no OpenAI
        Object.values(claudeUsage).forEach(service => {
            // Estimar tokens baseado no custo (aproximação)
            const estimatedTokens = service.total / (0.003 / 1000 + 0.015 / 1000); // Custo médio Claude
            const openaiEquivalent = estimatedTokens * (0.03 / 1000 + 0.06 / 1000); // Custo médio OpenAI
            estimatedOpenAIEquivalent += openaiEquivalent;
            totalSavings += (openaiEquivalent - service.total);
        });

        const savingsPercentage = estimatedOpenAIEquivalent > 0
            ? ((totalSavings / estimatedOpenAIEquivalent) * 100).toFixed(1)
            : 0;

        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            costs: costSummary,
            estimation: creditEstimation,
            limits: {
                daily: costTracker.limits.daily,
                monthly: costTracker.limits.monthly,
                warningThreshold: costTracker.limits.warning_threshold
            },
            strategy: {
                name: 'Claude-first (Nova estratégia)',
                primaryModel: 'Claude 3.5 Sonnet',
                fallbackModel: 'OpenAI GPT-4',
                monthlyStats: {
                    claudeUsage: claudeCosts,
                    openaiUsage: openaiCosts,
                    totalCosts,
                    estimatedSavings: totalSavings,
                    savingsPercentage: `${savingsPercentage}%`,
                    claudeSuccessRate: openaiCosts > 0 ?
                        `${((claudeCosts / totalCosts) * 100).toFixed(1)}%` : '100%'
                }
            }
        });
    } catch (error) {
        console.error('Erro ao obter custos:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// 💳 Histórico de uso de uma API específica
router.get('/costs/:provider/:service?', (req, res) => {
    try {
        const { provider, service } = req.params;
        const days = parseInt(req.query.days) || 7;

        if (service) {
            const history = costTracker.getApiUsageHistory(provider, service, days);
            res.json({
                status: 'success',
                provider,
                service,
                days,
                history,
                timestamp: new Date().toISOString()
            });
        } else {
            // Retornar todos os serviços do provider
            const allUsage = {};
            for (const [key, value] of costTracker.apiUsage.entries()) {
                if (key.startsWith(`${provider}_`)) {
                    const serviceName = key.split('_').slice(1).join('_');
                    allUsage[serviceName] = value.slice(-50); // Últimos 50 registros
                }
            }

            res.json({
                status: 'success',
                provider,
                usage: allUsage,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Erro ao obter histórico de custos:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// 📊 Incrementar métricas de negócio
const incrementMetric = (category, metric, value = 1) => {
    if (metrics.business[category] && typeof metrics.business[category][metric] !== 'undefined') {
        metrics.business[category][metric] += value;
    } else if (typeof metrics.business[metric] !== 'undefined') {
        metrics.business[metric] += value;
    }
};

// 🔧 Funções auxiliares
function formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Exportar middleware e funções
module.exports = {
    router,
    collectMetrics,
    incrementMetric,
    getMetrics: () => metrics
}; 