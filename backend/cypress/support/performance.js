// Comandos para testes de performance no Cypress

/**
 * Mede o tempo de carregamento de uma página
 */
Cypress.Commands.add('measurePageLoad', (url, options = {}) => {
    const { timeout = 5000, alias = 'pageLoad' } = options;

    cy.window().then((win) => {
        const startTime = performance.now();

        return cy.visit(url, { timeout }).then(() => {
            cy.window().then((newWin) => {
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                cy.wrap(loadTime).as(alias);

                // Log do resultado
                cy.log(`⏱️ Page Load Time: ${Math.round(loadTime)}ms`);

                // Validar que o tempo está dentro do limite aceitável
                expect(loadTime).to.be.lessThan(timeout);

                return cy.wrap(loadTime);
            });
        });
    });
});

/**
 * Mede o tempo de resposta de uma API
 */
Cypress.Commands.add('measureApiResponse', (method, url, body = null, options = {}) => {
    const { timeout = 5000, alias = 'apiResponse' } = options;

    const startTime = performance.now();

    const requestOptions = {
        method,
        url,
        timeout,
        ...(body && { body })
    };

    return cy.request(requestOptions).then((response) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        cy.wrap(responseTime).as(alias);

        // Log do resultado
        cy.log(`⏱️ API Response Time: ${Math.round(responseTime)}ms`);

        // Validar que o tempo está dentro do limite aceitável
        expect(responseTime).to.be.lessThan(timeout);
        expect(response.status).to.be.oneOf([200, 201, 204]);

        return cy.wrap({ responseTime, response });
    });
});

/**
 * Mede o tempo de execução de um comando customizado
 */
Cypress.Commands.add('measureExecution', (callback, options = {}) => {
    const { alias = 'execution', description = 'Custom execution' } = options;

    const startTime = performance.now();

    return cy.then(() => callback()).then((result) => {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        cy.wrap(executionTime).as(alias);

        // Log do resultado
        cy.log(`⏱️ ${description}: ${Math.round(executionTime)}ms`);

        return cy.wrap({ executionTime, result });
    });
});

/**
 * Coleta métricas de performance do browser
 */
Cypress.Commands.add('collectPerformanceMetrics', (alias = 'performanceMetrics') => {
    cy.window().then((win) => {
        // Métricas de navegação
        const navigation = win.performance.getEntriesByType('navigation')[0];

        // Métricas de recursos
        const resources = win.performance.getEntriesByType('resource');

        // Core Web Vitals (simulado)
        const metrics = {
            // Tempo de carregamento da página
            pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,

            // Tempo até o primeiro byte
            ttfb: navigation ? navigation.responseStart - navigation.fetchStart : 0,

            // Tempo de renderização
            renderTime: navigation ? navigation.loadEventEnd - navigation.responseEnd : 0,

            // Contagem de recursos
            resourceCount: resources.length,

            // Tempo médio de carregamento de recursos
            avgResourceTime: resources.length > 0
                ? resources.reduce((acc, r) => acc + (r.responseEnd - r.fetchStart), 0) / resources.length
                : 0,

            // Recursos mais lentos
            slowestResources: resources
                .map(r => ({
                    name: r.name.split('/').pop(),
                    duration: r.responseEnd - r.fetchStart,
                    size: r.transferSize || 0
                }))
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5)
        };

        cy.wrap(metrics).as(alias);

        // Log das métricas principais
        cy.log(`📊 Performance Metrics:`);
        cy.log(`   Page Load: ${Math.round(metrics.pageLoadTime)}ms`);
        cy.log(`   TTFB: ${Math.round(metrics.ttfb)}ms`);
        cy.log(`   Resources: ${metrics.resourceCount}`);

        return cy.wrap(metrics);
    });
});

/**
 * Executa teste de carga simulada
 */
Cypress.Commands.add('loadTest', (requests, options = {}) => {
    const {
        concurrency = 5,
        delay = 100,
        timeout = 10000,
        alias = 'loadTest'
    } = options;

    const startTime = performance.now();
    const results = [];

    // Executar requests em batches com concorrência limitada
    const executeRequests = (requestBatch) => {
        return Promise.all(
            requestBatch.map((request, index) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const requestStart = performance.now();

                        cy.request(request)
                            .then((response) => {
                                const requestEnd = performance.now();
                                const duration = requestEnd - requestStart;

                                results.push({
                                    index,
                                    duration,
                                    status: response.status,
                                    success: response.status >= 200 && response.status < 300
                                });

                                resolve();
                            })
                            .catch((error) => {
                                const requestEnd = performance.now();
                                const duration = requestEnd - requestStart;

                                results.push({
                                    index,
                                    duration,
                                    status: error.status || 0,
                                    success: false,
                                    error: error.message
                                });

                                resolve();
                            });
                    }, index * delay);
                });
            })
        );
    };

    // Dividir requests em batches
    const batches = [];
    for (let i = 0; i < requests.length; i += concurrency) {
        batches.push(requests.slice(i, i + concurrency));
    }

    // Executar batches sequencialmente
    return cy.then(() => {
        return batches.reduce((promise, batch) => {
            return promise.then(() => executeRequests(batch));
        }, Promise.resolve());
    }).then(() => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        // Calcular estatísticas
        const successfulRequests = results.filter(r => r.success);
        const avgResponseTime = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
        const successRate = (successfulRequests.length / results.length) * 100;

        const loadTestResults = {
            totalTime,
            totalRequests: results.length,
            successfulRequests: successfulRequests.length,
            successRate,
            avgResponseTime,
            minResponseTime: Math.min(...results.map(r => r.duration)),
            maxResponseTime: Math.max(...results.map(r => r.duration)),
            requestsPerSecond: results.length / (totalTime / 1000),
            results
        };

        cy.wrap(loadTestResults).as(alias);

        // Log dos resultados
        cy.log(`🚀 Load Test Results:`);
        cy.log(`   Total Time: ${Math.round(totalTime)}ms`);
        cy.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        cy.log(`   Avg Response: ${Math.round(avgResponseTime)}ms`);
        cy.log(`   RPS: ${loadTestResults.requestsPerSecond.toFixed(1)}`);

        return cy.wrap(loadTestResults);
    });
});

/**
 * Valida métricas de performance
 */
Cypress.Commands.add('validatePerformance', (thresholds = {}) => {
    const defaultThresholds = {
        pageLoadTime: 3000,      // 3s
        ttfb: 1000,              // 1s
        apiResponseTime: 2000,   // 2s
        resourceCount: 50,       // máximo de recursos
        successRate: 95          // 95% de sucesso
    };

    const finalThresholds = { ...defaultThresholds, ...thresholds };

    cy.get('@performanceMetrics').then((metrics) => {
        // Validar métricas de página
        if (metrics.pageLoadTime > 0) {
            expect(metrics.pageLoadTime, 'Page Load Time').to.be.lessThan(finalThresholds.pageLoadTime);
        }

        if (metrics.ttfb > 0) {
            expect(metrics.ttfb, 'Time to First Byte').to.be.lessThan(finalThresholds.ttfb);
        }

        expect(metrics.resourceCount, 'Resource Count').to.be.lessThan(finalThresholds.resourceCount);

        cy.log(`✅ Performance validation passed!`);
    });
});

// Interceptar métricas automaticamente em cada teste
beforeEach(() => {
    // Configurar interceptação de requests para métricas
    cy.intercept('**', (req) => {
        const startTime = Date.now();

        req.continue((res) => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Armazenar métricas de request
            if (!window.requestMetrics) {
                window.requestMetrics = [];
            }

            window.requestMetrics.push({
                url: req.url,
                method: req.method,
                status: res.statusCode,
                duration,
                timestamp: startTime
            });
        });
    });
});