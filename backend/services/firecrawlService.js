const FirecrawlApp = require('@mendable/firecrawl-js').default;
const scrapingConfig = require('../config/scraping');

class FirecrawlService {
    constructor() {
        this.apiKey = process.env.FIRECRAWL_API_KEY || scrapingConfig.firecrawl?.apiKey;
        this.baseUrl = process.env.FIRECRAWL_BASE_URL || scrapingConfig.firecrawl?.baseUrl || 'https://api.firecrawl.dev';
        this.timeout = parseInt(process.env.FIRECRAWL_TIMEOUT) || scrapingConfig.firecrawl?.timeout || 30000;
        this.maxRetries = parseInt(process.env.FIRECRAWL_MAX_RETRIES) || 3;

        // Cache em memória para resultados recentes
        this.cache = new Map();
        this.cacheMaxAge = 5 * 60 * 1000; // 5 minutos
        this.cacheMaxSize = 100; // máximo 100 entradas

        // Estatísticas de uso
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            lastReset: new Date()
        };

        if (!this.apiKey) {
            console.warn('[Firecrawl] API Key não configurada. Apenas modo legacy disponível.');
            this.client = null;
        } else {
            console.log('[Firecrawl] Serviço inicializado com sucesso');
            this.client = new FirecrawlApp({
                apiKey: this.apiKey,
                apiUrl: this.baseUrl
            });
        }
    }

    /**
     * Gerar chave de cache para uma URL
     */
    getCacheKey(url, options = {}) {
        const baseKey = `${url}`;
        const optionsKey = JSON.stringify({
            formats: options.formats || [],
            onlyMainContent: options.onlyMainContent,
            includeTags: options.includeTags,
            excludeTags: options.excludeTags
        });
        return `${baseKey}:${Buffer.from(optionsKey).toString('base64')}`;
    }

    /**
     * Verificar cache antes de fazer requisição
     */
    getFromCache(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) {
            this.stats.cacheMisses++;
            return null;
        }

        const isExpired = Date.now() - cached.timestamp > this.cacheMaxAge;
        if (isExpired) {
            this.cache.delete(cacheKey);
            this.stats.cacheMisses++;
            return null;
        }

        this.stats.cacheHits++;
        console.log(`[Firecrawl] Cache hit para: ${cacheKey.substring(0, 50)}...`);
        return cached.data;
    }

    /**
     * Salvar resultado no cache
     */
    saveToCache(cacheKey, data) {
        // Limpar cache se estiver muito grande
        if (this.cache.size >= this.cacheMaxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Limpar cache
     */
    clearCache() {
        const oldSize = this.cache.size;
        this.cache.clear();
        console.log(`[Firecrawl] Cache limpo: ${oldSize} entradas removidas`);
    }

    /**
     * Obter estatísticas de uso
     */
    getStats() {
        const cacheEfficiency = this.stats.totalRequests > 0
            ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(1)
            : 0;

        return {
            ...this.stats,
            cacheEfficiency: `${cacheEfficiency}%`,
            cacheSize: this.cache.size,
            uptime: Date.now() - this.stats.lastReset.getTime()
        };
    }

    /**
     * Identifica a plataforma da vaga pela URL
     */
    identifyPlatform(url) {
        const domain = new URL(url).hostname.toLowerCase();

        if (domain.includes('gupy.io')) return 'gupy';
        if (domain.includes('linkedin.com')) return 'linkedin';
        if (domain.includes('indeed.com')) return 'indeed';
        if (domain.includes('catho.com')) return 'catho';
        if (domain.includes('workday.com')) return 'workday';

        return 'generic';
    }

    /**
     * Verifica se a URL requer Firecrawl
     */
    requiresFirecrawl(url) {
        const platform = this.identifyPlatform(url);
        const platformConfig = scrapingConfig.platforms[platform];

        if (platformConfig?.requiresFirecrawl) return true;

        // Verificar lista de prioridade híbrida
        const priorityDomains = scrapingConfig.hybrid.firecrawlPriority || [];
        return priorityDomains.some(domain => url.includes(domain));
    }

    /**
 * Scraping individual com Firecrawl
 */
    async scrapeUrl(url, options = {}) {
        this.stats.totalRequests++;

        try {
            if (!this.client) {
                throw new Error('Cliente Firecrawl não inicializado (API key ausente)');
            }

            // Verificar cache primeiro (se não for forçado)
            if (!options.skipCache) {
                const cacheKey = this.getCacheKey(url, options);
                const cachedResult = this.getFromCache(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }
            }

            console.log(`[Firecrawl] Iniciando scraping: ${url}`);

            const platform = this.identifyPlatform(url);
            const platformConfig = scrapingConfig.platforms[platform] || {};

            // Configurar parâmetros usando a biblioteca oficial
            const scrapeParams = {
                formats: options.formats || ['markdown'], // Usar apenas markdown por padrão
                onlyMainContent: options.onlyMainContent ?? scrapingConfig.firecrawl.options?.onlyMainContent ?? true,
                includeTags: options.includeTags || scrapingConfig.firecrawl.options?.includeTags,
                excludeTags: options.excludeTags || scrapingConfig.firecrawl.options?.excludeTags,
                timeout: options.timeout || this.timeout
            };

            // Adicionar ações específicas da plataforma
            if (platformConfig.actions) {
                scrapeParams.actions = platformConfig.actions;
            }

            // Schema de extração estruturada (apenas para plataformas conhecidas)
            if (platformConfig.extractSchema && platform !== 'generic') {
                if (!scrapeParams.formats.includes('json')) {
                    scrapeParams.formats.push('json');
                }
                scrapeParams.extract = {
                    schema: platformConfig.extractSchema,
                    prompt: "Extrair informações estruturadas da vaga de emprego"
                };
            }

            // Implementar retry com backoff exponencial
            let lastError;
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    console.log(`[Firecrawl] Tentativa ${attempt}/${this.maxRetries} para: ${url}`);

                    // Usar a biblioteca oficial do Firecrawl
                    const response = await this.client.scrapeUrl(url, scrapeParams);

                    if (!response.success) {
                        throw new Error(response.error || 'Erro no scraping Firecrawl');
                    }

                    const result = this.processFirecrawlResponse(response.data, platform);

                    // Verificar se conseguiu extrair informações essenciais
                    if (!result.hasEssentialInfo) {
                        console.warn(`[Firecrawl] ⚠️  Informações essenciais incompletas para: ${url}`);
                        console.warn(`[Firecrawl] Título: ${result.title ? '✅' : '❌'}`);
                        console.warn(`[Firecrawl] Responsabilidades: ${result.responsibilities?.length || 0} itens`);
                        console.warn(`[Firecrawl] Requisitos: ${result.requirements?.length || 0} itens`);

                        // Se configurado para usar fallback, lançar erro para trigger fallback
                        if (scrapingConfig.strategy?.fallbackToLegacy) {
                            throw new Error('Firecrawl não conseguiu extrair informações essenciais - fallback necessário');
                        }
                    } else {
                        console.log(`[Firecrawl] ✅ Informações essenciais extraídas com sucesso!`);
                    }

                    // Salvar no cache se bem-sucedido
                    if (!options.skipCache) {
                        const cacheKey = this.getCacheKey(url, options);
                        this.saveToCache(cacheKey, result);
                    }

                    return result;

                } catch (error) {
                    lastError = error;
                    console.warn(`[Firecrawl] Tentativa ${attempt} falhou: ${error.message}`);

                    if (attempt < this.maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // máximo 10s
                        console.log(`[Firecrawl] Aguardando ${delay}ms antes da próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // Se chegou aqui, todas as tentativas falharam
            this.stats.errors++;
            throw lastError;

        } catch (error) {
            this.stats.errors++;
            console.error(`[Firecrawl] Erro ao scraping ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Scraping em lote com controle de concorrência e otimizações
     */
    async batchScrapeUrls(urls, options = {}) {
        try {
            if (!this.client) {
                throw new Error('Cliente Firecrawl não inicializado');
            }

            const concurrency = Math.min(options.concurrency || 3, 5); // máximo 5 simultâneas
            const batchSize = options.batchSize || 10; // processar em grupos de 10

            console.log(`[Firecrawl] Iniciando scraping em lote:`);
            console.log(`  - URLs: ${urls.length}`);
            console.log(`  - Concorrência: ${concurrency}`);
            console.log(`  - Tamanho do lote: ${batchSize}`);

            const results = [];
            const errors = [];
            const startTime = Date.now();

            // Separar URLs em grupos para monitoramento de progresso
            const batches = [];
            for (let i = 0; i < urls.length; i += batchSize) {
                batches.push(urls.slice(i, i + batchSize));
            }

            console.log(`[Firecrawl] Processando ${batches.length} lotes...`);

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`[Firecrawl] Lote ${batchIndex + 1}/${batches.length} - ${batch.length} URLs`);

                // Implementar semáforo para controle de concorrência
                const semaphore = new Semaphore(concurrency);

                const batchPromises = batch.map(async (url, index) => {
                    await semaphore.acquire();
                    try {
                        const globalIndex = batchIndex * batchSize + index + 1;
                        console.log(`[Firecrawl] Processando ${globalIndex}/${urls.length}: ${url}`);

                        const result = await this.scrapeUrl(url, {
                            ...options,
                            skipCache: options.forceRefresh || false
                        });

                        return { url, result, success: true, index: globalIndex };
                    } catch (error) {
                        console.error(`[Firecrawl] Erro na URL ${url}:`, error.message);
                        return {
                            url,
                            error: error.message,
                            success: false,
                            index: batchIndex * batchSize + index + 1
                        };
                    } finally {
                        semaphore.release();
                    }
                });

                const batchResults = await Promise.all(batchPromises);

                // Separar sucessos e erros
                batchResults.forEach(item => {
                    if (item.success) {
                        results.push(item);
                    } else {
                        errors.push(item);
                    }
                });

                // Mostrar progresso
                const processed = (batchIndex + 1) * batchSize;
                const percentage = Math.min((processed / urls.length) * 100, 100).toFixed(1);
                console.log(`[Firecrawl] Progresso: ${percentage}% (${Math.min(processed, urls.length)}/${urls.length})`);

                // Pausa adaptativa entre lotes
                if (batchIndex + 1 < batches.length) {
                    const errorRate = errors.length / Math.min(processed, urls.length);
                    const delay = errorRate > 0.3 ? 2000 : 1000; // pausa mais longa se muitos erros
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            const successRate = ((results.length / urls.length) * 100).toFixed(1);

            console.log(`[Firecrawl] Lote finalizado em ${duration.toFixed(1)}s:`);
            console.log(`  - Sucessos: ${results.length}`);
            console.log(`  - Erros: ${errors.length}`);
            console.log(`  - Taxa de sucesso: ${successRate}%`);

            return {
                success: results,
                errors: errors,
                summary: {
                    totalUrls: urls.length,
                    successCount: results.length,
                    errorCount: errors.length,
                    successRate: successRate + '%',
                    duration: duration.toFixed(1) + 's',
                    urlsPerSecond: (urls.length / duration).toFixed(2)
                }
            };

        } catch (error) {
            console.error('[Firecrawl] Erro no processamento em lote:', error.message);
            throw error;
        }
    }



    /**
     * Processar resposta do Firecrawl
     */
    processFirecrawlResponse(data, platform) {
        const result = {
            title: '',
            description: '',
            responsibilities: [],
            requirements: [],
            fullText: '',
            structured: null,
            metadata: data.metadata || {},
            platform: platform,
            scrapedAt: new Date().toISOString(),
            hasEssentialInfo: false
        };

        // Extrair título do metadata
        result.title = data.metadata?.title || '';

        // Usar markdown como texto principal
        if (data.markdown) {
            result.fullText = data.markdown;

            // Extrair informações essenciais do markdown
            const extractedInfo = this.extractEssentialJobInfo(data.markdown);
            result.description = extractedInfo.description;
            result.responsibilities = extractedInfo.responsibilities;
            result.requirements = extractedInfo.requirements;
        }

        // Dados estruturados se disponível (prioridade)
        if (data.json) {
            result.structured = data.json;

            // Sobrescrever com dados estruturados se disponível
            if (data.json.title) result.title = data.json.title;
            if (data.json.description) result.description = data.json.description;
            if (data.json.responsibilities && Array.isArray(data.json.responsibilities)) {
                result.responsibilities = data.json.responsibilities;
            }
            if (data.json.requirements && Array.isArray(data.json.requirements)) {
                result.requirements = data.json.requirements;
            }
        }

        // Validar se temos as informações essenciais
        result.hasEssentialInfo = this.validateEssentialInfo(result);

        return result;
    }

    /**
     * Extrair informações essenciais do markdown
     */
    extractEssentialJobInfo(markdown) {
        const lines = markdown.split('\n').filter(line => line.trim());

        const result = {
            description: '',
            responsibilities: [],
            requirements: []
        };

        let currentSection = 'description';
        let currentContent = [];

        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();

            // Detectar seções de responsabilidades
            if (this.isResponsibilitiesSection(lowerLine)) {
                if (currentContent.length > 0) {
                    this.addToSection(result, currentSection, currentContent);
                    currentContent = [];
                }
                currentSection = 'responsibilities';
                continue;
            }

            // Detectar seções de requisitos
            if (this.isRequirementsSection(lowerLine)) {
                if (currentContent.length > 0) {
                    this.addToSection(result, currentSection, currentContent);
                    currentContent = [];
                }
                currentSection = 'requirements';
                continue;
            }

            // Detectar outras seções (reset para description)
            if (this.isOtherSection(lowerLine)) {
                if (currentContent.length > 0) {
                    this.addToSection(result, currentSection, currentContent);
                    currentContent = [];
                }
                currentSection = 'description';
            }

            // Adicionar conteúdo à seção atual
            if (line.trim() && !line.startsWith('#')) {
                currentContent.push(line.trim());
            }
        }

        // Processar último conteúdo
        if (currentContent.length > 0) {
            this.addToSection(result, currentSection, currentContent);
        }

        // Se não encontrou seções específicas, usar descrição geral
        if (result.description === '' && result.responsibilities.length === 0 && result.requirements.length === 0) {
            result.description = markdown.substring(0, 2000);
        }

        return result;
    }

    /**
     * Verificar se é seção de responsabilidades
     */
    isResponsibilitiesSection(text) {
        const responsibilityKeywords = [
            'responsabilidades', 'atribuições', 'atividades', 'funções',
            'responsibilities', 'duties', 'activities', 'tasks',
            'o que você fará', 'suas atividades', 'será responsável'
        ];
        return responsibilityKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Verificar se é seção de requisitos
     */
    isRequirementsSection(text) {
        const requirementKeywords = [
            'requisitos', 'qualificações', 'competências', 'experiência',
            'requirements', 'qualifications', 'skills', 'experience',
            'você precisa ter', 'pré-requisitos', 'formação', 'conhecimentos'
        ];
        return requirementKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Verificar se é outra seção
     */
    isOtherSection(text) {
        const otherKeywords = [
            'benefícios', 'sobre a empresa', 'localização', 'salário',
            'benefits', 'about', 'location', 'salary', 'company'
        ];
        return otherKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Adicionar conteúdo à seção apropriada
     */
    addToSection(result, section, content) {
        const text = content.join(' ');

        if (section === 'responsibilities') {
            // Dividir em itens se for lista
            if (content.some(line => line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./))) {
                result.responsibilities.push(...content.filter(line =>
                    line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)
                ).map(line => line.replace(/^[•\-\d\.]\s*/, '').trim()));
            } else {
                result.responsibilities.push(text);
            }
        } else if (section === 'requirements') {
            // Dividir em itens se for lista
            if (content.some(line => line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./))) {
                result.requirements.push(...content.filter(line =>
                    line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)
                ).map(line => line.replace(/^[•\-\d\.]\s*/, '').trim()));
            } else {
                result.requirements.push(text);
            }
        } else {
            result.description += (result.description ? '\n\n' : '') + text;
        }
    }

    /**
     * Validar se o resultado tem as informações essenciais
     */
    validateEssentialInfo(result) {
        const hasTitle = result.title && result.title.trim().length > 5;
        const hasResponsibilities = result.responsibilities && result.responsibilities.length > 0 &&
            result.responsibilities.some(item => item.trim().length > 10);
        const hasRequirements = result.requirements && result.requirements.length > 0 &&
            result.requirements.some(item => item.trim().length > 10);

        console.log(`[Firecrawl] Validação de conteúdo essencial:`);
        console.log(`  - Título: ${hasTitle ? '✅' : '❌'} (${result.title?.substring(0, 50)}...)`);
        console.log(`  - Responsabilidades: ${hasResponsibilities ? '✅' : '❌'} (${result.responsibilities?.length || 0} itens)`);
        console.log(`  - Requisitos: ${hasRequirements ? '✅' : '❌'} (${result.requirements?.length || 0} itens)`);

        return hasTitle && hasResponsibilities && hasRequirements;
    }

    /**
     * Extrair descrição relevante da vaga
     */
    extractJobDescription(markdown) {
        // Implementar lógica para extrair seções relevantes
        const lines = markdown.split('\n').filter(line => line.trim());

        // Buscar por seções típicas de vagas
        const relevantSections = [];
        let currentSection = '';

        for (const line of lines) {
            const lowerLine = line.toLowerCase();

            if (this.isRelevantSectionTitle(lowerLine)) {
                if (currentSection) relevantSections.push(currentSection);
                currentSection = line + '\n';
            } else if (currentSection && line.trim()) {
                currentSection += line + '\n';
            }
        }

        if (currentSection) relevantSections.push(currentSection);

        return relevantSections.join('\n\n') || markdown.substring(0, 2000);
    }

    /**
     * Verificar se é título de seção relevante
     */
    isRelevantSectionTitle(text) {
        const relevantKeywords = [
            'responsabilidades', 'requisitos', 'qualificações', 'atividades',
            'benefícios', 'sobre a vaga', 'perfil', 'competências',
            'responsibilities', 'requirements', 'qualifications', 'benefits'
        ];

        return relevantKeywords.some(keyword => text.includes(keyword));
    }

    /**
 * Verificar saúde do serviço
 */
    async healthCheck() {
        try {
            if (!this.client) {
                return {
                    status: 'disabled',
                    error: 'API key não configurada',
                    suggestions: [
                        'Obtenha uma API key em https://firecrawl.dev',
                        'Adicione FIRECRAWL_API_KEY=fc-sua-chave ao arquivo .env',
                        'Reinicie a aplicação após configurar'
                    ]
                };
            }

            console.log('[Firecrawl] Executando health check...');

            // Fazer um teste simples e rápido de scraping
            const testResponse = await this.client.scrapeUrl('https://httpbin.org/status/200', {
                formats: ['markdown'],
                onlyMainContent: true,
                timeout: 10000
            });

            return {
                status: testResponse.success ? 'healthy' : 'unhealthy',
                apiKey: this.apiKey ? 'configurada' : 'ausente',
                baseUrl: this.baseUrl,
                testUrl: 'https://httpbin.org/status/200',
                responseTime: testResponse.success ? 'OK' : 'Failed',
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            console.error('[Firecrawl] Health check falhou:', error.message);
            return {
                status: 'unhealthy',
                error: error.message,
                apiKey: this.apiKey ? 'configurada' : 'ausente',
                lastCheck: new Date().toISOString(),
                troubleshooting: [
                    'Verifique se a API key está correta',
                    'Confirme se há créditos disponíveis na conta Firecrawl',
                    'Teste a conectividade com a internet'
                ]
            };
        }
    }

    /**
     * Obter informações sobre a conta/créditos
     */
    async getAccountInfo() {
        try {
            if (!this.client) {
                throw new Error('Cliente Firecrawl não inicializado');
            }

            // Tentar fazer uma requisição mínima para obter informações
            const testResponse = await this.client.scrapeUrl('https://httpbin.org/json', {
                formats: ['markdown'],
                onlyMainContent: true
            });

            return {
                hasCredits: testResponse.success,
                apiKeyValid: testResponse.success,
                lastUsed: new Date().toISOString()
            };
        } catch (error) {
            return {
                hasCredits: false,
                apiKeyValid: false,
                error: error.message
            };
        }
    }

    /**
     * Detectar se a URL precisa de JavaScript rendering
     */
    async detectJavaScriptRequirement(url) {
        try {
            const domain = new URL(url).hostname.toLowerCase();

            // Lista de domínios conhecidos que requerem JS
            const jsRequiredDomains = [
                'gupy.io',
                'linkedin.com',
                'workday.com',
                'greenhouse.io',
                'lever.co',
                'smartrecruiters.com',
                'indeed.com',
                'glassdoor.com'
            ];

            const requiresJS = jsRequiredDomains.some(d => domain.includes(d));

            return {
                requiresJavaScript: requiresJS,
                platform: this.identifyPlatform(url),
                recommendation: requiresJS ? 'firecrawl' : 'legacy_or_firecrawl'
            };
        } catch (error) {
            return {
                requiresJavaScript: true, // default seguro
                platform: 'unknown',
                recommendation: 'firecrawl'
            };
        }
    }
}

/**
 * Implementação simples de semáforo para controle de concorrência
 */
class Semaphore {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentConcurrency = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.currentConcurrency < this.maxConcurrency) {
            this.currentConcurrency++;
            return;
        }

        return new Promise(resolve => {
            this.queue.push(resolve);
        });
    }

    release() {
        this.currentConcurrency--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.currentConcurrency++;
            next();
        }
    }
}

module.exports = new FirecrawlService(); 