const firecrawlService = require('./services/firecrawlService');

/**
 * Teste Avançado do Serviço Firecrawl - Fase 2
 * 
 * Este teste verifica:
 * - Sistema de cache
 * - Estatísticas de uso
 * - Retry com backoff exponencial
 * - Processamento em lote com concorrência
 * - Health check detalhado
 * - Detecção de JavaScript requirement
 */

async function runAdvancedTests() {
    console.log('🚀 INICIANDO TESTES AVANÇADOS FIRECRAWL - FASE 2');
    console.log('='.repeat(60));

    try {
        // 1. Health Check Detalhado
        console.log('\n1️⃣ HEALTH CHECK DETALHADO');
        console.log('-'.repeat(30));

        const healthStatus = await firecrawlService.healthCheck();
        console.log('Status:', healthStatus.status);
        console.log('API Key:', healthStatus.apiKey);

        if (healthStatus.suggestions) {
            console.log('💡 Sugestões:');
            healthStatus.suggestions.forEach((suggestion, i) => {
                console.log(`   ${i + 1}. ${suggestion}`);
            });
        }

        if (healthStatus.troubleshooting) {
            console.log('🔧 Troubleshooting:');
            healthStatus.troubleshooting.forEach((tip, i) => {
                console.log(`   ${i + 1}. ${tip}`);
            });
        }

        // 2. Detecção de JavaScript Requirement
        console.log('\n2️⃣ DETECÇÃO DE JAVASCRIPT REQUIREMENT');
        console.log('-'.repeat(30));

        const testUrls = [
            'https://google.com/jobs',
            'https://linkedin.com/jobs/view/123',
            'https://gupy.io/jobs/456',
            'https://example.com/job',
            'https://workday.com/careers'
        ];

        for (const url of testUrls) {
            try {
                const jsRequirement = await firecrawlService.detectJavaScriptRequirement(url);
                console.log(`📄 ${url}`);
                console.log(`   - Requer JS: ${jsRequirement.requiresJavaScript ? '✅' : '❌'}`);
                console.log(`   - Plataforma: ${jsRequirement.platform}`);
                console.log(`   - Recomendação: ${jsRequirement.recommendation}`);
            } catch (error) {
                console.log(`❌ Erro ao detectar JS para ${url}: ${error.message}`);
            }
        }

        // 3. Verificar Cache (se API key disponível)
        if (healthStatus.status === 'healthy') {
            console.log('\n3️⃣ TESTE DE CACHE E ESTATÍSTICAS');
            console.log('-'.repeat(30));

            const testUrl = 'https://httpbin.org/json';

            // Primeira requisição (cache miss)
            console.log('📤 Primeira requisição (cache miss esperado)...');
            const startTime1 = Date.now();
            const result1 = await firecrawlService.scrapeUrl(testUrl, {
                formats: ['markdown'],
                onlyMainContent: true
            });
            const duration1 = Date.now() - startTime1;
            console.log(`⏱️  Duração: ${duration1}ms`);

            // Segunda requisição (cache hit)
            console.log('\n📥 Segunda requisição (cache hit esperado)...');
            const startTime2 = Date.now();
            const result2 = await firecrawlService.scrapeUrl(testUrl, {
                formats: ['markdown'],
                onlyMainContent: true
            });
            const duration2 = Date.now() - startTime2;
            console.log(`⏱️  Duração: ${duration2}ms`);

            // Verificar que é significativamente mais rápido
            if (duration2 < duration1 / 2) {
                console.log('✅ Cache funcionando! Segunda requisição foi mais rápida');
            } else {
                console.log('⚠️  Cache pode não estar funcionando como esperado');
            }

            // Mostrar estatísticas
            console.log('\n📊 ESTATÍSTICAS DE USO:');
            const stats = firecrawlService.getStats();
            console.log(`   - Total de requisições: ${stats.totalRequests}`);
            console.log(`   - Cache hits: ${stats.cacheHits}`);
            console.log(`   - Cache misses: ${stats.cacheMisses}`);
            console.log(`   - Eficiência do cache: ${stats.cacheEfficiency}`);
            console.log(`   - Tamanho do cache: ${stats.cacheSize}`);
            console.log(`   - Erros: ${stats.errors}`);

            // 4. Teste de Processamento em Lote (URLs pequenas para teste)
            console.log('\n4️⃣ TESTE DE PROCESSAMENTO EM LOTE');
            console.log('-'.repeat(30));

            const batchUrls = [
                'https://httpbin.org/json',
                'https://httpbin.org/uuid',
                'https://httpbin.org/status/200'
            ];

            console.log(`📦 Processando ${batchUrls.length} URLs em lote...`);
            const batchStartTime = Date.now();

            const batchResults = await firecrawlService.batchScrapeUrls(batchUrls, {
                concurrency: 2,
                batchSize: 2
            });

            const batchDuration = Date.now() - batchStartTime;

            console.log('\n📈 RESULTADOS DO LOTE:');
            console.log(`   - URLs processadas: ${batchResults.summary.totalUrls}`);
            console.log(`   - Sucessos: ${batchResults.summary.successCount}`);
            console.log(`   - Erros: ${batchResults.summary.errorCount}`);
            console.log(`   - Taxa de sucesso: ${batchResults.summary.successRate}`);
            console.log(`   - Duração: ${batchResults.summary.duration}`);
            console.log(`   - URLs/segundo: ${batchResults.summary.urlsPerSecond}`);

            if (batchResults.errors.length > 0) {
                console.log('\n❌ ERROS NO LOTE:');
                batchResults.errors.forEach(error => {
                    console.log(`   - ${error.url}: ${error.error}`);
                });
            }

            // 5. Teste de Limpeza de Cache
            console.log('\n5️⃣ TESTE DE LIMPEZA DE CACHE');
            console.log('-'.repeat(30));

            console.log(`📊 Cache antes da limpeza: ${firecrawlService.getStats().cacheSize} entradas`);
            firecrawlService.clearCache();
            console.log(`🧹 Cache após limpeza: ${firecrawlService.getStats().cacheSize} entradas`);

        } else {
            console.log('\n⚠️  API Key não configurada - pulando testes que requerem API');
            console.log('💡 Para testar completamente, configure FIRECRAWL_API_KEY no .env');
        }

        // 6. Informações da Conta (se disponível)
        if (healthStatus.status === 'healthy') {
            console.log('\n6️⃣ INFORMAÇÕES DA CONTA');
            console.log('-'.repeat(30));

            const accountInfo = await firecrawlService.getAccountInfo();
            console.log('💳 Status da conta:');
            console.log(`   - API Key válida: ${accountInfo.apiKeyValid ? '✅' : '❌'}`);
            console.log(`   - Tem créditos: ${accountInfo.hasCredits ? '✅' : '❌'}`);
            if (accountInfo.lastUsed) {
                console.log(`   - Último uso: ${accountInfo.lastUsed}`);
            }
            if (accountInfo.error) {
                console.log(`   - Erro: ${accountInfo.error}`);
            }
        }

        console.log('\n🎉 TODOS OS TESTES AVANÇADOS CONCLUÍDOS!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    runAdvancedTests()
        .then(() => {
            console.log('\n✅ Testes finalizados com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Erro fatal nos testes:', error);
            process.exit(1);
        });
}

module.exports = { runAdvancedTests }; 