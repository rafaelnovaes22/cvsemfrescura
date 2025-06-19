const firecrawlService = require('../services/firecrawlService');
const relevantJobScraper = require('./relevantJobScraper');
const scrapingConfig = require('../config/scraping');

/**
 * Scraper Híbrido - FIRECRAWL FIRST Strategy
 * 
 * Nova Estratégia Simplificada:
 * 1. SEMPRE tentar Firecrawl primeiro
 * 2. Validar se extraiu informações essenciais:
 *    - Título da vaga
 *    - Responsabilidades e atribuições
 *    - Requisitos e qualificações
 * 3. Usar Legacy apenas se Firecrawl falhar na validação
 */

class HybridJobScraper {
    constructor() {
        this.stats = {
            totalRequests: 0,
            firecrawlSuccess: 0,
            firecrawlFailures: 0,
            legacyFallback: 0,
            legacyFailures: 0,
            avgResponseTime: 0,
            essentialInfoSuccess: 0,
            essentialInfoFailures: 0,
            lastReset: new Date()
        };
    }

    /**
     * Scraping principal - FIRECRAWL FIRST
     */
    async scrapeJobUrl(url, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            console.log(`[HybridScraper] 🚀 Iniciando FIRECRAWL FIRST: ${url}`);

            let result;
            let method = 'firecrawl';
            let success = false;

            // PASSO 1: SEMPRE tentar Firecrawl primeiro
            try {
                console.log(`[HybridScraper] 🔥 Tentando Firecrawl...`);
                result = await this.scrapeWithFirecrawl(url, options);

                // PASSO 2: Validar informações essenciais
                if (result && result.hasEssentialInfo) {
                    console.log(`[HybridScraper] ✅ Firecrawl SUCESSO com informações essenciais!`);
                    this.stats.firecrawlSuccess++;
                    this.stats.essentialInfoSuccess++;
                    success = true;
                } else {
                    console.warn(`[HybridScraper] ⚠️  Firecrawl não extraiu informações essenciais`);
                    this.stats.essentialInfoFailures++;
                    throw new Error('Informações essenciais incompletas');
                }

            } catch (firecrawlError) {
                console.warn(`[HybridScraper] ❌ Firecrawl falhou: ${firecrawlError.message}`);
                this.stats.firecrawlFailures++;

                // PASSO 3: Fallback para Legacy (se configurado)
                if (scrapingConfig.strategy?.fallbackToLegacy && !options.noFallback) {
                    console.log(`[HybridScraper] 🔄 Tentando fallback para Legacy...`);

                    try {
                        result = await this.scrapeWithLegacy(url, { ...options, isFallback: true });

                        // Adicionar flag de informações essenciais baseado em heurística
                        result.hasEssentialInfo = this.validateLegacyResult(result);

                        if (result.hasEssentialInfo) {
                            console.log(`[HybridScraper] ✅ Legacy fallback SUCESSO!`);
                            this.stats.legacyFallback++;
                            this.stats.essentialInfoSuccess++;
                            method = 'legacy';
                            success = true;
                        } else {
                            console.warn(`[HybridScraper] ⚠️  Legacy também com informações incompletas`);
                            this.stats.legacyFailures++;
                            throw new Error('Legacy também falhou na validação');
                        }

                    } catch (legacyError) {
                        console.error(`[HybridScraper] ❌ Legacy fallback falhou: ${legacyError.message}`);
                        this.stats.legacyFailures++;

                        // Retornar resultado do Firecrawl mesmo incompleto
                        if (result) {
                            console.log(`[HybridScraper] 📋 Retornando resultado parcial do Firecrawl`);
                            method = 'firecrawl_partial';
                        } else {
                            throw new Error(`Ambas estratégias falharam. Firecrawl: ${firecrawlError.message}, Legacy: ${legacyError.message}`);
                        }
                    }
                } else {
                    // Retornar resultado do Firecrawl mesmo incompleto
                    if (result) {
                        console.log(`[HybridScraper] 📋 Retornando resultado parcial do Firecrawl (fallback desabilitado)`);
                        method = 'firecrawl_partial';
                    } else {
                        throw firecrawlError;
                    }
                }
            }

            // PASSO 4: Processar e retornar resultado final
            const duration = Date.now() - startTime;
            this.updateStats(duration);

            const finalResult = {
                ...result,
                scrapingMethod: method,
                processingTime: `${duration}ms`,
                timestamp: new Date().toISOString(),
                strategy: 'firecrawl_first',
                success: success
            };

            console.log(`[HybridScraper] 🎯 Resultado final: ${method} (${duration}ms)`);
            console.log(`[HybridScraper] 📊 Info essencial: ${finalResult.hasEssentialInfo ? '✅' : '❌'}`);

            return finalResult;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateStats(duration);

            console.error(`[HybridScraper] 💥 Erro completo para ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Processar múltiplas URLs com estratégia FIRECRAWL FIRST
     */
    async extractMultiple(urls, options = {}) {
        try {
            console.log(`[HybridScraper] 🚀 FIRECRAWL FIRST em lote: ${urls.length} URLs`);

            const results = [];
            const concurrency = options.concurrency || 3;

            // Processar URLs em lotes com controle de concorrência
            for (let i = 0; i < urls.length; i += concurrency) {
                const batch = urls.slice(i, i + concurrency);
                console.log(`[HybridScraper] Processando lote ${Math.floor(i / concurrency) + 1}: ${batch.length} URLs`);

                const batchPromises = batch.map(async (url, index) => {
                    try {
                        const globalIndex = i + index + 1;
                        console.log(`[HybridScraper] ${globalIndex}/${urls.length}: ${url}`);

                        const result = await this.scrapeJobUrl(url, options);
                        return {
                            ...result,
                            url: url,
                            index: globalIndex,
                            success: true
                        };
                    } catch (error) {
                        console.error(`[HybridScraper] Erro na URL ${url}:`, error.message);
                        return {
                            url: url,
                            error: error.message,
                            success: false,
                            index: i + index + 1
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // Pausa entre lotes
                if (i + concurrency < urls.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return this.formatBatchResults(results);

        } catch (error) {
            console.error('[HybridScraper] Erro no processamento em lote:', error);
            throw error;
        }
    }

    /**
     * Scraping com Firecrawl
     */
    async scrapeWithFirecrawl(url, options = {}) {
        return await firecrawlService.scrapeUrl(url, {
            formats: ['markdown'], // Apenas markdown para evitar erro de schema
            onlyMainContent: true,
            ...options
        });
    }

    /**
     * Scraping com Legacy
     */
    async scrapeWithLegacy(url, options = {}) {
        try {
            const text = await relevantJobScraper.extractRelevantSections(url);

            return {
                title: this.extractTitleFromText(text),
                description: text,
                responsibilities: [],
                requirements: [],
                fullText: text,
                platform: 'legacy',
                scrapedAt: new Date().toISOString(),
                hasEssentialInfo: false // será validado depois
            };
        } catch (error) {
            console.error(`[HybridScraper] Erro no scraper legacy: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validar resultado do Legacy
     */
    validateLegacyResult(result) {
        if (!result || !result.fullText) return false;

        const text = result.fullText.toLowerCase();
        const minTextLength = 200; // mínimo de texto

        // Verificar se tem texto suficiente
        if (result.fullText.length < minTextLength) {
            console.log(`[HybridScraper] Legacy: texto muito pequeno (${result.fullText.length} chars)`);
            return false;
        }

        // Heurística simples para verificar se parece uma vaga
        const jobKeywords = [
            'responsabilidades', 'requisitos', 'experiência', 'vaga',
            'responsibilities', 'requirements', 'experience', 'job',
            'qualificações', 'atividades', 'função', 'cargo'
        ];

        const hasJobKeywords = jobKeywords.some(keyword => text.includes(keyword));

        console.log(`[HybridScraper] Legacy validation: ${hasJobKeywords ? '✅' : '❌'} (${result.fullText.length} chars)`);

        return hasJobKeywords;
    }

    /**
     * Extrair título do texto (heurística simples)
     */
    extractTitleFromText(text) {
        if (!text) return '';

        const lines = text.split('\n').filter(line => line.trim());

        // Procurar primeira linha que parece um título
        for (const line of lines.slice(0, 10)) { // apenas primeiras 10 linhas
            const trimmed = line.trim();
            if (trimmed.length > 10 && trimmed.length < 200) {
                // Se não tem pontuação no final, provavelmente é título
                if (!trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?')) {
                    return trimmed;
                }
            }
        }

        return lines[0]?.trim().substring(0, 100) || '';
    }

    /**
     * Formatar resultados do processamento em lote
     */
    formatBatchResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        const essentialInfoCount = successful.filter(r => r.hasEssentialInfo).length;

        return {
            results: successful,
            errors: failed,
            summary: {
                total: results.length,
                successful: successful.length,
                failed: failed.length,
                successRate: `${((successful.length / results.length) * 100).toFixed(1)}%`,
                essentialInfo: essentialInfoCount,
                essentialInfoRate: `${((essentialInfoCount / successful.length) * 100).toFixed(1)}%`
            }
        };
    }

    /**
     * Atualizar estatísticas
     */
    updateStats(duration) {
        // Calcular média de tempo de resposta
        const currentAvg = this.stats.avgResponseTime;
        const totalRequests = this.stats.totalRequests;

        this.stats.avgResponseTime = ((currentAvg * (totalRequests - 1)) + duration) / totalRequests;
    }

    /**
     * Obter estatísticas detalhadas
     */
    getStats() {
        const totalAttempts = this.stats.firecrawlSuccess + this.stats.firecrawlFailures;
        const firecrawlSuccessRate = totalAttempts > 0 ?
            ((this.stats.firecrawlSuccess / totalAttempts) * 100).toFixed(1) : 0;

        const essentialTotal = this.stats.essentialInfoSuccess + this.stats.essentialInfoFailures;
        const essentialSuccessRate = essentialTotal > 0 ?
            ((this.stats.essentialInfoSuccess / essentialTotal) * 100).toFixed(1) : 0;

        return {
            ...this.stats,
            avgResponseTime: Math.round(this.stats.avgResponseTime),
            firecrawlSuccessRate: `${firecrawlSuccessRate}%`,
            essentialInfoRate: `${essentialSuccessRate}%`,
            uptime: Date.now() - this.stats.lastReset.getTime()
        };
    }

    /**
     * Health check do scraper híbrido
     */
    async healthCheck() {
        try {
            const firecrawlHealth = await firecrawlService.healthCheck();

            return {
                status: firecrawlHealth.status === 'healthy' ? 'ready' : 'limited',
                firecrawl: firecrawlHealth,
                strategy: 'firecrawl_first',
                stats: this.getStats(),
                capabilities: {
                    firecrawl: firecrawlHealth.status === 'healthy',
                    legacy: true, // sempre disponível
                    batchProcessing: true,
                    essentialValidation: true
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                strategy: 'firecrawl_first'
            };
        }
    }

    /**
     * Reset das estatísticas
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            firecrawlSuccess: 0,
            firecrawlFailures: 0,
            legacyFallback: 0,
            legacyFailures: 0,
            avgResponseTime: 0,
            essentialInfoSuccess: 0,
            essentialInfoFailures: 0,
            lastReset: new Date()
        };
    }
}

module.exports = new HybridJobScraper(); 