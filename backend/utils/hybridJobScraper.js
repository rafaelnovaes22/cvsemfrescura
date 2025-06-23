const relevantJobScraper = require('./relevantJobScraper');
const scrapingConfig = require('../config/scraping');

/**
 * Scraper Híbrido Simplificado - Apenas Legacy
 * 
 * Estratégia Simples:
 * 1. Usar apenas o scraper legacy
 * 2. Validar se extraiu informações essenciais
 */

class HybridJobScraper {
    constructor() {
        this.stats = {
            totalRequests: 0,
            legacySuccess: 0,
            legacyFailures: 0,
            avgResponseTime: 0,
            essentialInfoSuccess: 0,
            essentialInfoFailures: 0,
            lastReset: new Date()
        };
    }

    /**
     * Scraping principal - Apenas Legacy
     */
    async scrapeJobUrl(url, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            console.log(`[HybridScraper] 🚀 Iniciando scraping legacy: ${url}`);

            let result;
            let method = 'legacy';
            let success = false;

            try {
                console.log(`[HybridScraper] 🔍 Tentando scraper legacy...`);
                result = await this.scrapeWithLegacy(url, options);

                // Validar informações essenciais
                result.hasEssentialInfo = this.validateLegacyResult(result);

                console.log(`[HybridScraper] ✅ Legacy concluído (Info essencial: ${result.hasEssentialInfo})`);
                this.stats.legacySuccess++;
                if (result.hasEssentialInfo) {
                    this.stats.essentialInfoSuccess++;
                } else {
                    this.stats.essentialInfoFailures++;
                }
                success = true;

            } catch (legacyError) {
                console.error(`[HybridScraper] ❌ Legacy falhou: ${legacyError.message}`);
                this.stats.legacyFailures++;
                throw legacyError;
            }

            // Processar e retornar resultado final
            const duration = Date.now() - startTime;
            this.updateStats(duration);

            const finalResult = {
                ...result,
                scrapingMethod: method,
                processingTime: `${duration}ms`,
                timestamp: new Date().toISOString(),
                strategy: 'legacy_only',
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
     * Processar múltiplas URLs
     */
    async extractMultiple(urls, options = {}) {
        try {
            console.log(`[HybridScraper] 🚀 Processamento em lote: ${urls.length} URLs`);

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
     * Scraping com sistema legacy
     */
    async scrapeWithLegacy(url, options = {}) {
        try {
            const extractedText = await relevantJobScraper.extractRelevantSections(url);

            if (typeof extractedText !== 'string') {
                throw new Error('Resultado inválido do scraper legacy');
            }

            // Normalizar resultado
            return {
                content: extractedText,
                title: this.extractTitleFromText(extractedText),
                description: extractedText,
                requirements: [],
                responsibilities: [],
                metadata: {},
                extractedAt: new Date().toISOString(),
                source: 'legacy',
                url: url
            };

        } catch (error) {
            console.error(`[HybridScraper] Erro no scraper legacy:`, error);
            throw error;
        }
    }

    /**
     * Validar se o resultado legacy tem informações essenciais
     */
    validateLegacyResult(result) {
        if (!result || typeof result !== 'object') {
            return false;
        }

        const content = result.content || '';
        const title = result.title;

        // Verificar título
        const hasTitle = title && title.trim().length > 3 &&
            !title.toLowerCase().includes('não identificado');

        // Verificar conteúdo mínimo
        const hasContent = content && content.length > 100;

        // Verificar palavras-chave indicativas de vaga
        const jobKeywords = [
            'responsabilidades', 'requisitos', 'qualificações', 'experiência',
            'conhecimento', 'habilidades', 'competências', 'atribuições',
            'salário', 'benefícios', 'vaga', 'cargo', 'função', 'posição'
        ];

        const contentLower = content.toLowerCase();
        const hasJobKeywords = jobKeywords.some(keyword =>
            contentLower.includes(keyword)
        );

        const isValid = hasTitle && hasContent && hasJobKeywords;

        console.log(`[HybridScraper] Validação: título=${hasTitle}, conteúdo=${hasContent}, keywords=${hasJobKeywords} -> ${isValid}`);

        return isValid;
    }

    /**
     * Extrair título do texto quando não identificado
     */
    extractTitleFromText(text) {
        if (!text) return 'Título não identificado';

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        for (const line of lines.slice(0, 10)) { // Verificar apenas as primeiras 10 linhas
            if (line.length > 10 && line.length < 100) {
                // Procurar por padrões de título
                if (line.match(/\b(desenvolvedor|programador|analista|gerente|coordenador|especialista|consultor|assistente)\b/i)) {
                    return line;
                }
            }
        }

        return lines[0] || 'Título não identificado';
    }

    /**
     * Formatar resultados do processamento em lote
     */
    formatBatchResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: results.length > 0 ? ((successful.length / results.length) * 100).toFixed(1) : 0,
            results: successful,
            errors: failed,
            stats: this.getStats(),
            processedAt: new Date().toISOString()
        };
    }

    /**
     * Atualizar estatísticas de performance
     */
    updateStats(duration) {
        this.stats.avgResponseTime =
            (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests;
    }

    /**
     * Obter estatísticas de uso
     */
    getStats() {
        const totalAttempts = this.stats.legacySuccess + this.stats.legacyFailures;
        const legacySuccessRate = totalAttempts > 0 ?
            ((this.stats.legacySuccess / totalAttempts) * 100).toFixed(1) : 0;

        return {
            totalRequests: this.stats.totalRequests,
            legacySuccess: this.stats.legacySuccess,
            legacyFailures: this.stats.legacyFailures,
            legacySuccessRate: `${legacySuccessRate}%`,
            essentialInfoSuccess: this.stats.essentialInfoSuccess,
            essentialInfoFailures: this.stats.essentialInfoFailures,
            avgResponseTime: `${Math.round(this.stats.avgResponseTime)}ms`,
            uptime: `${Math.round((Date.now() - this.stats.lastReset) / 1000)}s`,
            lastReset: this.stats.lastReset.toISOString()
        };
    }

    /**
     * Health check do serviço
     */
    async healthCheck() {
        try {
            const stats = this.getStats();

            return {
                status: 'ready',
                strategy: 'legacy_only',
                components: {
                    legacy: true
                },
                stats: stats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('[HybridScraper] Erro no health check:', error);
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Reset das estatísticas
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            legacySuccess: 0,
            legacyFailures: 0,
            avgResponseTime: 0,
            essentialInfoSuccess: 0,
            essentialInfoFailures: 0,
            lastReset: new Date()
        };
    }
}

module.exports = new HybridJobScraper(); 