// Monitor de Rate Limits para OpenAI e Claude
class RateLimitMonitor {
    constructor() {
        this.openaiLimits = {
            requests: { used: 0, limit: 3000, resetTime: 0 }, // Por minuto
            tokens: { used: 0, limit: 150000, resetTime: 0 }   // Por minuto
        };

        this.claudeLimits = {
            requests: { used: 0, limit: 1000, resetTime: 0 }, // Por minuto
            tokens: { used: 0, limit: 100000, resetTime: 0 }  // Por minuto
        };
    }

    // Atualizar limites do OpenAI baseado nos headers da resposta
    updateOpenAILimits(headers) {
        if (!headers) return;

        // Headers comuns da OpenAI
        const requestsRemaining = parseInt(headers['x-ratelimit-remaining-requests']) || 0;
        const requestsLimit = parseInt(headers['x-ratelimit-limit-requests']) || 3000;
        const tokensRemaining = parseInt(headers['x-ratelimit-remaining-tokens']) || 0;
        const tokensLimit = parseInt(headers['x-ratelimit-limit-tokens']) || 150000;
        const resetTime = parseInt(headers['x-ratelimit-reset-requests']) || 0;

        this.openaiLimits.requests = {
            used: requestsLimit - requestsRemaining,
            limit: requestsLimit,
            resetTime: resetTime * 1000 // Converter para milliseconds
        };

        this.openaiLimits.tokens = {
            used: tokensLimit - tokensRemaining,
            limit: tokensLimit,
            resetTime: resetTime * 1000
        };

        this.logLimits('OpenAI');
    }

    // Verificar se podemos fazer uma requisição para OpenAI
    canMakeOpenAIRequest(estimatedTokens = 10000) {
        const now = Date.now();

        // Reset contadores se o tempo passou
        if (now > this.openaiLimits.requests.resetTime) {
            this.openaiLimits.requests.used = 0;
            this.openaiLimits.tokens.used = 0;
        }

        const requestsAvailable = this.openaiLimits.requests.used < (this.openaiLimits.requests.limit * 0.9);
        const tokensAvailable = (this.openaiLimits.tokens.used + estimatedTokens) < (this.openaiLimits.tokens.limit * 0.9);

        return requestsAvailable && tokensAvailable;
    }

    // Obter tempo de espera recomendado para OpenAI
    getOpenAIWaitTime() {
        const now = Date.now();
        const requestResetWait = Math.max(0, this.openaiLimits.requests.resetTime - now);
        const tokenResetWait = Math.max(0, this.openaiLimits.tokens.resetTime - now);

        return Math.max(requestResetWait, tokenResetWait);
    }

    // Registrar uso de uma requisição
    recordOpenAIUsage(tokensUsed = 0) {
        this.openaiLimits.requests.used += 1;
        this.openaiLimits.tokens.used += tokensUsed;
    }

    // Log dos limites atuais
    logLimits(service) {
        const limits = service === 'OpenAI' ? this.openaiLimits : this.claudeLimits;
        console.log(`[${service}] Rate Limits:`, {
            requests: `${limits.requests.used}/${limits.requests.limit}`,
            tokens: `${limits.tokens.used}/${limits.tokens.limit}`,
            resetIn: Math.max(0, limits.requests.resetTime - Date.now()) / 1000 + 's'
        });
    }

    // Obter recomendação de serviço baseado nos limites
    getRecommendedService(estimatedTokens = 10000) {
        const canUseOpenAI = this.canMakeOpenAIRequest(estimatedTokens);

        if (canUseOpenAI) {
            return {
                service: 'openai',
                reason: 'OpenAI disponível',
                waitTime: 0
            };
        }

        const openaiWaitTime = this.getOpenAIWaitTime();

        return {
            service: 'claude',
            reason: `OpenAI rate limited (aguardar ${Math.round(openaiWaitTime / 1000)}s)`,
            waitTime: openaiWaitTime
        };
    }

    // Obter estatísticas de uso
    getUsageStats() {
        return {
            openai: {
                requestsUsage: `${this.openaiLimits.requests.used}/${this.openaiLimits.requests.limit}`,
                tokensUsage: `${this.openaiLimits.tokens.used}/${this.openaiLimits.tokens.limit}`,
                requestsPercentage: Math.round((this.openaiLimits.requests.used / this.openaiLimits.requests.limit) * 100),
                tokensPercentage: Math.round((this.openaiLimits.tokens.used / this.openaiLimits.tokens.limit) * 100)
            },
            claude: {
                requestsUsage: `${this.claudeLimits.requests.used}/${this.claudeLimits.requests.limit}`,
                tokensUsage: `${this.claudeLimits.tokens.used}/${this.claudeLimits.tokens.limit}`,
                requestsPercentage: Math.round((this.claudeLimits.requests.used / this.claudeLimits.requests.limit) * 100),
                tokensPercentage: Math.round((this.claudeLimits.tokens.used / this.claudeLimits.tokens.limit) * 100)
            }
        };
    }
}

// Instância singleton
const rateLimitMonitor = new RateLimitMonitor();

module.exports = rateLimitMonitor; 