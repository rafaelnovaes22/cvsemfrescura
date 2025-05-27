const { logger } = require('./logger');
const { alertingSystem } = require('./alerting');

// Preços das APIs (atualizados em 2025)
const API_COSTS = {
    openai: {
        'gpt-4': {
            input: 0.03 / 1000,    // $0.03 per 1K tokens
            output: 0.06 / 1000    // $0.06 per 1K tokens
        },
        'gpt-3.5-turbo': {
            input: 0.0015 / 1000,  // $0.0015 per 1K tokens
            output: 0.002 / 1000   // $0.002 per 1K tokens
        },
        'text-embedding-ada-002': {
            input: 0.0001 / 1000   // $0.0001 per 1K tokens
        }
    },
    claude: {
        'claude-3-opus': {
            input: 0.015 / 1000,   // $0.015 per 1K tokens
            output: 0.075 / 1000   // $0.075 per 1K tokens
        },
        'claude-3-sonnet': {
            input: 0.003 / 1000,   // $0.003 per 1K tokens
            output: 0.015 / 1000   // $0.015 per 1K tokens
        },
        'claude-3-haiku': {
            input: 0.00025 / 1000, // $0.00025 per 1K tokens
            output: 0.00125 / 1000 // $0.00125 per 1K tokens
        }
    },
    sendgrid: {
        email: 0.0006 // $0.0006 per email (Essentials plan)
    },
    stripe: {
        transaction: 0.029, // 2.9% + $0.30 per transaction
        fixed_fee: 0.30
    }
};

class CostTracker {
    constructor() {
        this.dailyCosts = new Map(); // Custos por dia
        this.monthlyCosts = new Map(); // Custos por mês
        this.apiUsage = new Map(); // Uso por API
        this.limits = {
            daily: parseFloat(process.env.DAILY_COST_LIMIT) || 10.00,    // $10/dia
            monthly: parseFloat(process.env.MONTHLY_COST_LIMIT) || 200.00, // $200/mês
            warning_threshold: 0.8 // 80% do limite
        };
        this.initializeStorage();
    }

    initializeStorage() {
        const today = this.getDateKey();
        const thisMonth = this.getMonthKey();

        if (!this.dailyCosts.has(today)) {
            this.dailyCosts.set(today, { total: 0, breakdown: {} });
        }

        if (!this.monthlyCosts.has(thisMonth)) {
            this.monthlyCosts.set(thisMonth, { total: 0, breakdown: {} });
        }
    }

    getDateKey(date = new Date()) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    getMonthKey(date = new Date()) {
        return date.toISOString().slice(0, 7); // YYYY-MM
    }

      // Rastrear uso do OpenAI
  trackOpenAI(model, inputTokens, outputTokens, requestType = 'completion', isPrimary = false) {
    const costs = API_COSTS.openai[model];
    if (!costs) {
      console.warn(`Modelo OpenAI desconhecido: ${model}`);
      return 0;
    }

    let cost = 0;
    if (requestType === 'embedding') {
      cost = inputTokens * costs.input;
    } else {
      cost = (inputTokens * costs.input) + (outputTokens * costs.output);
    }

    this.addCost('openai', model, cost, {
      inputTokens,
      outputTokens,
      requestType,
      isPrimary, // Indica se foi o modelo principal ou fallback
      priority: isPrimary ? 'primary' : 'fallback' // OpenAI agora é fallback
    });

    return cost;
  }

    // Rastrear uso do Claude
    trackClaude(model, inputTokens, outputTokens, isPrimary = true) {
        const costs = API_COSTS.claude[model];
        if (!costs) {
            console.warn(`Modelo Claude desconhecido: ${model}`);
            return 0;
        }

        const cost = (inputTokens * costs.input) + (outputTokens * costs.output);

        this.addCost('claude', model, cost, {
            inputTokens,
            outputTokens,
            isPrimary, // Indica se foi o modelo principal ou fallback
            priority: 'primary' // Claude agora é prioridade
        });

        return cost;
    }

    // Rastrear uso do SendGrid
    trackSendGrid(emailCount = 1, emailType = 'transactional') {
        const cost = emailCount * API_COSTS.sendgrid.email;

        this.addCost('sendgrid', emailType, cost, {
            emailCount
        });

        return cost;
    }

    // Rastrear uso do Stripe
    trackStripe(transactionAmount, currency = 'USD') {
        // Converter para USD se necessário (simplificado)
        const amountUSD = currency === 'BRL' ? transactionAmount / 5.0 : transactionAmount;
        const cost = (amountUSD * API_COSTS.stripe.transaction) + API_COSTS.stripe.fixed_fee;

        this.addCost('stripe', 'transaction', cost, {
            transactionAmount: amountUSD,
            currency
        });

        return cost;
    }

    // Adicionar custo ao tracking
    addCost(apiProvider, service, cost, metadata = {}) {
        const today = this.getDateKey();
        const thisMonth = this.getMonthKey();
        const timestamp = new Date().toISOString();

        // Atualizar custos diários
        const dailyData = this.dailyCosts.get(today);
        dailyData.total += cost;
        if (!dailyData.breakdown[apiProvider]) {
            dailyData.breakdown[apiProvider] = { total: 0, services: {} };
        }
        dailyData.breakdown[apiProvider].total += cost;
        if (!dailyData.breakdown[apiProvider].services[service]) {
            dailyData.breakdown[apiProvider].services[service] = { total: 0, count: 0 };
        }
        dailyData.breakdown[apiProvider].services[service].total += cost;
        dailyData.breakdown[apiProvider].services[service].count += 1;

        // Atualizar custos mensais
        const monthlyData = this.monthlyCosts.get(thisMonth);
        monthlyData.total += cost;
        if (!monthlyData.breakdown[apiProvider]) {
            monthlyData.breakdown[apiProvider] = { total: 0, services: {} };
        }
        monthlyData.breakdown[apiProvider].total += cost;
        if (!monthlyData.breakdown[apiProvider].services[service]) {
            monthlyData.breakdown[apiProvider].services[service] = { total: 0, count: 0 };
        }
        monthlyData.breakdown[apiProvider].services[service].total += cost;
        monthlyData.breakdown[apiProvider].services[service].count += 1;

        // Registrar uso da API
        const usageKey = `${apiProvider}_${service}`;
        if (!this.apiUsage.has(usageKey)) {
            this.apiUsage.set(usageKey, []);
        }
        this.apiUsage.get(usageKey).push({
            timestamp,
            cost,
            metadata
        });

        // Log do custo
        logger.info('API cost tracked', {
            apiProvider,
            service,
            cost: `$${cost.toFixed(4)}`,
            metadata
        });

        // Verificar limites e enviar alertas
        this.checkLimitsAndAlert(dailyData.total, monthlyData.total);
    }

    // Verificar limites e enviar alertas
    checkLimitsAndAlert(dailyTotal, monthlyTotal) {
        const alerts = [];

        // Verificar limite diário
        const dailyPercentage = dailyTotal / this.limits.daily;
        if (dailyPercentage >= 1.0) {
            alerts.push({
                type: 'daily_limit_exceeded',
                severity: 'critical',
                message: `Daily API cost limit exceeded: $${dailyTotal.toFixed(2)} / $${this.limits.daily}`,
                timestamp: new Date().toISOString()
            });
        } else if (dailyPercentage >= this.limits.warning_threshold) {
            alerts.push({
                type: 'daily_limit_warning',
                severity: 'warning',
                message: `Daily API cost approaching limit: $${dailyTotal.toFixed(2)} / $${this.limits.daily} (${(dailyPercentage * 100).toFixed(1)}%)`,
                timestamp: new Date().toISOString()
            });
        }

        // Verificar limite mensal
        const monthlyPercentage = monthlyTotal / this.limits.monthly;
        if (monthlyPercentage >= 1.0) {
            alerts.push({
                type: 'monthly_limit_exceeded',
                severity: 'critical',
                message: `Monthly API cost limit exceeded: $${monthlyTotal.toFixed(2)} / $${this.limits.monthly}`,
                timestamp: new Date().toISOString()
            });
        } else if (monthlyPercentage >= this.limits.warning_threshold) {
            alerts.push({
                type: 'monthly_limit_warning',
                severity: 'warning',
                message: `Monthly API cost approaching limit: $${monthlyTotal.toFixed(2)} / $${this.limits.monthly} (${(monthlyPercentage * 100).toFixed(1)}%)`,
                timestamp: new Date().toISOString()
            });
        }

        // Enviar alertas
        alerts.forEach(alert => {
            alertingSystem.processAlert(alert);
        });
    }

    // Obter resumo de custos
    getCostSummary() {
        const today = this.getDateKey();
        const thisMonth = this.getMonthKey();

        const dailyData = this.dailyCosts.get(today) || { total: 0, breakdown: {} };
        const monthlyData = this.monthlyCosts.get(thisMonth) || { total: 0, breakdown: {} };

        // Calcular projeção mensal baseada na média diária
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const dayOfMonth = new Date().getDate();
        const avgDailyCost = monthlyData.total / dayOfMonth;
        const projectedMonthlyCost = avgDailyCost * daysInMonth;

        // Calcular dias restantes com o orçamento atual
        const remainingMonthlyBudget = this.limits.monthly - monthlyData.total;
        const daysRemainingInMonth = daysInMonth - dayOfMonth;
        const dailyBudgetRemaining = remainingMonthlyBudget / daysRemainingInMonth;

        return {
            today: {
                total: dailyData.total,
                limit: this.limits.daily,
                percentage: (dailyData.total / this.limits.daily) * 100,
                breakdown: dailyData.breakdown
            },
            thisMonth: {
                total: monthlyData.total,
                limit: this.limits.monthly,
                percentage: (monthlyData.total / this.limits.monthly) * 100,
                breakdown: monthlyData.breakdown,
                projected: projectedMonthlyCost,
                avgDaily: avgDailyCost
            },
            insights: {
                dailyBudgetRemaining,
                daysRemainingInMonth,
                isOnTrack: projectedMonthlyCost <= this.limits.monthly,
                burnRate: avgDailyCost > (this.limits.monthly / daysInMonth) ? 'high' : 'normal'
            }
        };
    }

    // Obter histórico de uso de uma API específica
    getApiUsageHistory(apiProvider, service, days = 7) {
        const usageKey = `${apiProvider}_${service}`;
        const usage = this.apiUsage.get(usageKey) || [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return usage.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    }

    // Estimar quando os créditos vão acabar
    estimateCreditDepletion() {
        const summary = this.getCostSummary();
        const currentMonthly = summary.thisMonth.total;
        const avgDaily = summary.thisMonth.avgDaily;

        if (avgDaily === 0) {
            return { status: 'no_usage', message: 'Nenhum uso detectado ainda' };
        }

        const remainingBudget = this.limits.monthly - currentMonthly;
        const daysUntilDepletion = Math.floor(remainingBudget / avgDaily);

        if (daysUntilDepletion <= 0) {
            return {
                status: 'exceeded',
                message: 'Orçamento já excedido',
                daysUntilDepletion: 0
            };
        }

        const depletionDate = new Date();
        depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);

        return {
            status: 'normal',
            daysUntilDepletion,
            depletionDate: depletionDate.toISOString().split('T')[0],
            message: `Créditos estimados para durar ${daysUntilDepletion} dias (até ${depletionDate.toLocaleDateString('pt-BR')})`
        };
    }

    // Limpar dados antigos (manter só últimos 3 meses)
    cleanupOldData() {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffMonth = this.getMonthKey(threeMonthsAgo);

        // Limpar custos mensais antigos
        for (const [month] of this.monthlyCosts) {
            if (month < cutoffMonth) {
                this.monthlyCosts.delete(month);
            }
        }

        // Limpar custos diários antigos (manter só último mês)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const cutoffDate = this.getDateKey(oneMonthAgo);

        for (const [date] of this.dailyCosts) {
            if (date < cutoffDate) {
                this.dailyCosts.delete(date);
            }
        }

        logger.info('Cost tracking data cleanup completed');
    }
}

// Instância global
const costTracker = new CostTracker();

// Cleanup automático a cada 24 horas
setInterval(() => {
    costTracker.cleanupOldData();
}, 24 * 60 * 60 * 1000);

module.exports = {
    CostTracker,
    costTracker,
    API_COSTS
}; 