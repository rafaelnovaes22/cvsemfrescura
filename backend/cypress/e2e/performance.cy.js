// Testes de Performance para APIs Críticas

describe('Performance Tests', () => {
    let authToken;

    const testUser = {
        name: 'Performance Test User',
        email: `perf.test.${Date.now()}@example.com`,
        password: 'PerfTest123!',
        phone: '11987654321'
    };

    before(() => {
        // Registrar usuário para testes de performance
        cy.request('POST', `${Cypress.env('apiUrl')}/user/register`, testUser)
            .then(() => {
                return cy.request('POST', `${Cypress.env('apiUrl')}/user/login`, {
                    email: testUser.email,
                    password: testUser.password
                });
            })
            .then((response) => {
                authToken = response.body.token;
            });
    });

    describe('API Response Time Tests', () => {

        it('should load homepage under 2 seconds', () => {
            cy.measurePageLoad('/', { timeout: 2000, alias: 'homepageLoad' });

            cy.get('@homepageLoad').then((loadTime) => {
                expect(loadTime).to.be.lessThan(2000);

                // Coletar métricas da página
                cy.collectPerformanceMetrics('homepageMetrics');

                // Validar métricas
                cy.validatePerformance({
                    pageLoadTime: 2000,
                    ttfb: 800,
                    resourceCount: 30
                });
            });
        });

        it('should authenticate user under 1 second', () => {
            const loginData = {
                email: testUser.email,
                password: testUser.password
            };

            cy.measureApiResponse('POST', `${Cypress.env('apiUrl')}/user/login`, loginData, {
                timeout: 1000,
                alias: 'loginResponse'
            });

            cy.get('@loginResponse').then(({ responseTime, response }) => {
                expect(responseTime).to.be.lessThan(1000);
                expect(response.body).to.have.property('token');
                expect(response.body).to.have.property('user');
            });
        });

        it('should fetch user profile under 500ms', () => {
            cy.measureApiResponse('GET', `${Cypress.env('apiUrl')}/user/profile`, null, {
                timeout: 500,
                alias: 'profileResponse',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            cy.get('@profileResponse').then(({ responseTime, response }) => {
                expect(responseTime).to.be.lessThan(500);
                expect(response.body).to.have.property('email', testUser.email);
            });
        });

        it('should create payment intent under 2 seconds', () => {
            const paymentData = {
                amount: 1000,
                currency: 'brl',
                metadata: { credits: 10 }
            };

            cy.measureApiResponse('POST', `${Cypress.env('apiUrl')}/payment/create-intent`, paymentData, {
                timeout: 2000,
                alias: 'paymentResponse',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            cy.get('@paymentResponse').then(({ responseTime, response }) => {
                expect(responseTime).to.be.lessThan(2000);
                expect(response.body).to.have.property('success', true);
                expect(response.body).to.have.property('clientSecret');
            });
        });

        it('should validate gift code under 1 second', () => {
            const giftCodeData = {
                code: 'INVALID_CODE_FOR_PERF_TEST'
            };

            cy.measureApiResponse('POST', `${Cypress.env('apiUrl')}/gift-code/validate`, giftCodeData, {
                timeout: 1000,
                alias: 'giftCodeResponse',
                failOnStatusCode: false // Esperamos que falhe, mas medimos o tempo
            });

            cy.get('@giftCodeResponse').then(({ responseTime }) => {
                expect(responseTime).to.be.lessThan(1000);
            });
        });
    });

    describe('Load Testing', () => {

        it('should handle 10 concurrent login requests', () => {
            const loginRequests = Array(10).fill().map(() => ({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/user/login`,
                body: {
                    email: testUser.email,
                    password: testUser.password
                }
            }));

            cy.loadTest(loginRequests, {
                concurrency: 5,
                delay: 50,
                alias: 'loginLoadTest'
            });

            cy.get('@loginLoadTest').then((results) => {
                expect(results.successRate).to.be.greaterThan(90);
                expect(results.avgResponseTime).to.be.lessThan(2000);
                expect(results.requestsPerSecond).to.be.greaterThan(2);

                cy.log(`📊 Load Test Results:`);
                cy.log(`   Success Rate: ${results.successRate.toFixed(1)}%`);
                cy.log(`   Avg Response: ${Math.round(results.avgResponseTime)}ms`);
                cy.log(`   Max Response: ${Math.round(results.maxResponseTime)}ms`);
                cy.log(`   RPS: ${results.requestsPerSecond.toFixed(1)}`);
            });
        });

        it('should handle 20 concurrent profile requests', () => {
            const profileRequests = Array(20).fill().map(() => ({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/user/profile`,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }));

            cy.loadTest(profileRequests, {
                concurrency: 10,
                delay: 25,
                alias: 'profileLoadTest'
            });

            cy.get('@profileLoadTest').then((results) => {
                expect(results.successRate).to.be.greaterThan(95);
                expect(results.avgResponseTime).to.be.lessThan(1000);
                expect(results.requestsPerSecond).to.be.greaterThan(5);
            });
        });
    });

    describe('Frontend Performance', () => {

        it('should load login page with good performance', () => {
            cy.measurePageLoad('/analisar.html?login=false', {
                timeout: 3000,
                alias: 'loginPageLoad'
            });

            cy.collectPerformanceMetrics('loginPageMetrics');

            cy.get('@loginPageMetrics').then((metrics) => {
                // Validar Core Web Vitals
                expect(metrics.pageLoadTime, 'Page Load Time').to.be.lessThan(3000);
                expect(metrics.ttfb, 'Time to First Byte').to.be.lessThan(1000);
                expect(metrics.resourceCount, 'Resource Count').to.be.lessThan(40);

                // Log dos recursos mais lentos
                cy.log('🐌 Slowest Resources:');
                metrics.slowestResources.forEach((resource, index) => {
                    cy.log(`   ${index + 1}. ${resource.name}: ${Math.round(resource.duration)}ms`);
                });
            });
        });

        it('should load analysis page efficiently', () => {
            // Fazer login primeiro
            localStorage.setItem('token', authToken);
            localStorage.setItem('userEmail', testUser.email);

            cy.measurePageLoad('/analisar.html', {
                timeout: 4000,
                alias: 'analysisPageLoad'
            });

            cy.collectPerformanceMetrics('analysisPageMetrics');

            cy.get('@analysisPageMetrics').then((metrics) => {
                expect(metrics.pageLoadTime).to.be.lessThan(4000);
                expect(metrics.ttfb).to.be.lessThan(1200);
                expect(metrics.avgResourceTime).to.be.lessThan(500);
            });
        });
    });

    describe('Database Performance', () => {

        it('should efficiently query transaction history', () => {
            cy.measureApiResponse('GET', `${Cypress.env('apiUrl')}/payment/history`, null, {
                timeout: 1500,
                alias: 'historyResponse',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            cy.get('@historyResponse').then(({ responseTime, response }) => {
                expect(responseTime).to.be.lessThan(1500);
                expect(response.body).to.have.property('success', true);
                expect(response.body).to.have.property('transactions');
            });
        });

        it('should efficiently query analysis history', () => {
            cy.measureApiResponse('GET', `${Cypress.env('apiUrl')}/ats/history`, null, {
                timeout: 2000,
                alias: 'analysisHistoryResponse',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            cy.get('@analysisHistoryResponse').then(({ responseTime, response }) => {
                expect(responseTime).to.be.lessThan(2000);
                expect(response.body).to.have.property('success', true);
            });
        });
    });

    describe('Memory and Resource Usage', () => {

        it('should not have significant memory leaks during navigation', () => {
            // Teste de navegação intensiva
            const pages = [
                '/',
                '/analisar.html',
                '/contact.html',
                '/faq.html',
                '/terms.html',
                '/privacy.html'
            ];

            // Configurar autenticação
            localStorage.setItem('token', authToken);
            localStorage.setItem('userEmail', testUser.email);

            let initialMemory;

            pages.forEach((page, index) => {
                cy.visit(page);
                cy.wait(1000); // Aguardar carregamento

                cy.window().then((win) => {
                    // Simular coleta de métricas de memória
                    if (win.performance && win.performance.memory) {
                        const memoryInfo = {
                            used: win.performance.memory.usedJSHeapSize,
                            total: win.performance.memory.totalJSHeapSize,
                            limit: win.performance.memory.jsHeapSizeLimit
                        };

                        if (index === 0) {
                            initialMemory = memoryInfo.used;
                        }

                        cy.log(`📊 Memory Usage on ${page}:`);
                        cy.log(`   Used: ${(memoryInfo.used / 1024 / 1024).toFixed(1)}MB`);
                        cy.log(`   Total: ${(memoryInfo.total / 1024 / 1024).toFixed(1)}MB`);

                        // Verificar que não há vazamento significativo
                        if (index === pages.length - 1) {
                            const memoryIncrease = memoryInfo.used - initialMemory;
                            const increasePercentage = (memoryIncrease / initialMemory) * 100;

                            cy.log(`📈 Memory increase: ${increasePercentage.toFixed(1)}%`);
                            expect(increasePercentage).to.be.lessThan(200); // Máximo 200% de aumento
                        }
                    }
                });
            });
        });
    });

    describe('Performance Regression Tests', () => {

        it('should maintain baseline performance benchmarks', () => {
            const benchmarks = {
                'POST /user/login': { maxTime: 1000, endpoint: '/user/login' },
                'GET /user/profile': { maxTime: 500, endpoint: '/user/profile' },
                'POST /payment/create-intent': { maxTime: 2000, endpoint: '/payment/create-intent' },
                'GET /payment/history': { maxTime: 1500, endpoint: '/payment/history' }
            };

            Object.entries(benchmarks).forEach(([testName, config]) => {
                cy.log(`🏃 Running benchmark: ${testName}`);

                const requestConfig = {
                    method: config.endpoint.includes('login') ? 'POST' : 'GET',
                    url: `${Cypress.env('apiUrl')}${config.endpoint}`,
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                };

                if (config.endpoint.includes('login')) {
                    requestConfig.body = {
                        email: testUser.email,
                        password: testUser.password
                    };
                } else if (config.endpoint.includes('create-intent')) {
                    requestConfig.body = {
                        amount: 1000,
                        currency: 'brl'
                    };
                }

                cy.measureApiResponse(
                    requestConfig.method,
                    requestConfig.url,
                    requestConfig.body,
                    {
                        timeout: config.maxTime,
                        headers: requestConfig.headers
                    }
                ).then(({ responseTime }) => {
                    expect(responseTime, `${testName} response time`).to.be.lessThan(config.maxTime);

                    // Log para histórico de performance
                    cy.task('log', {
                        test: testName,
                        responseTime: Math.round(responseTime),
                        timestamp: new Date().toISOString(),
                        status: 'PASS'
                    }, { log: false });
                });
            });
        });
    });

    after(() => {
        // Limpeza após testes de performance
        cy.log('🧹 Performance tests completed');

        // Coletar métricas finais
        cy.collectPerformanceMetrics('finalMetrics');

        cy.get('@finalMetrics').then((metrics) => {
            cy.log('📊 Final Performance Summary:');
            cy.log(`   Page Load Time: ${Math.round(metrics.pageLoadTime)}ms`);
            cy.log(`   TTFB: ${Math.round(metrics.ttfb)}ms`);
            cy.log(`   Resource Count: ${metrics.resourceCount}`);
            cy.log(`   Avg Resource Time: ${Math.round(metrics.avgResourceTime)}ms`);
        });
    });
});