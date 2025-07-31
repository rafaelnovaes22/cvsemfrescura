// Helpers avançados para testes Cypress

/**
 * Comandos para melhorar a experiência de teste
 */

// Comando para aguardar carregamento completo
Cypress.Commands.add('waitForPageLoad', (timeout = 10000) => {
    cy.window().then((win) => {
        return new Cypress.Promise((resolve) => {
            if (win.document.readyState === 'complete') {
                resolve();
            } else {
                win.addEventListener('load', resolve);
            }
        });
    });

    // Aguardar que não haja requests pendentes
    cy.get('body', { timeout }).should('be.visible');
});

// Comando para login com melhor UX
Cypress.Commands.add('loginUser', (email, password, options = {}) => {
    const { remember = false, redirect = true } = options;

    cy.session([email, password], () => {
        cy.request('POST', `${Cypress.env('apiUrl')}/user/login`, {
            email,
            password
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('token');

            // Armazenar dados de autenticação
            localStorage.setItem('token', response.body.token);
            localStorage.setItem('userEmail', email);

            if (remember) {
                localStorage.setItem('rememberUser', 'true');
            }
        });
    });

    if (redirect) {
        cy.visit('/analisar.html');
        cy.waitForPageLoad();
    }
});

// Comando para criar usuário de teste
Cypress.Commands.add('createAndLoginUser', (userData = {}) => {
    const defaultUser = {
        name: 'E2E Test User',
        email: `e2e.test.${Date.now()}@example.com`,
        password: 'TestPassword123!',
        phone: '11987654321'
    };

    const user = { ...defaultUser, ...userData };

    cy.request('POST', `${Cypress.env('apiUrl')}/user/register`, user)
        .then((response) => {
            expect(response.status).to.eq(201);
            return cy.loginUser(user.email, user.password);
        })
        .then(() => cy.wrap(user));
});

// Comando para upload de arquivo robusto
Cypress.Commands.add('uploadFile', (selector, filename, options = {}) => {
    const { mimeType = 'application/pdf', alias = 'fileUpload' } = options;

    cy.fixture(filename, 'base64').then((fileContent) => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent, mimeType);
        const file = new File([blob], filename, { type: mimeType });

        cy.get(selector).then((input) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input[0].files = dataTransfer.files;

            // Disparar eventos necessários
            input[0].dispatchEvent(new Event('change', { bubbles: true }));
        });

        cy.wrap(file).as(alias);
    });
});

// Comando para aguardar e validar API calls
Cypress.Commands.add('waitForApiCall', (method, url, options = {}) => {
    const { timeout = 10000, alias = 'apiCall' } = options;

    cy.intercept(method, url).as(alias);
    cy.wait(`@${alias}`, { timeout }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201, 204]);
        return cy.wrap(interception);
    });
});

// Comando para simular condições de rede
Cypress.Commands.add('simulateNetworkConditions', (condition) => {
    const conditions = {
        slow: { delay: 2000, throttleKbps: 50 },
        fast: { delay: 0, throttleKbps: 1000 },
        offline: { forceNetworkError: true }
    };

    const config = conditions[condition] || conditions.fast;

    cy.intercept('**', (req) => {
        if (config.forceNetworkError) {
            req.destroy();
        } else {
            req.reply((res) => {
                res.delay(config.delay);
                return res;
            });
        }
    });
});

// Comando para validar acessibilidade
Cypress.Commands.add('checkA11y', (selector = null, options = {}) => {
    const defaultOptions = {
        rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true }
        }
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (selector) {
        cy.get(selector).should('be.visible');
    }

    // Simulação básica de verificação de acessibilidade
    cy.get('button, a, input, select, textarea').each(($el) => {
        // Verificar se elementos interativos são focáveis
        if ($el.is(':visible')) {
            cy.wrap($el).should('have.attr', 'tabindex').or('be.focusable');
        }
    });

    cy.get('img').each(($img) => {
        // Verificar alt text em imagens
        cy.wrap($img).should('have.attr', 'alt');
    });
});

// Comando para captura de métricas
Cypress.Commands.add('captureMetrics', (metricName, options = {}) => {
    const { includeScreenshot = false, includeDOM = false } = options;

    cy.window().then((win) => {
        const metrics = {
            timestamp: new Date().toISOString(),
            url: win.location.href,
            viewport: {
                width: win.innerWidth,
                height: win.innerHeight
            },
            performance: {
                navigation: win.performance.getEntriesByType('navigation')[0],
                paint: win.performance.getEntriesByType('paint'),
                resources: win.performance.getEntriesByType('resource').length
            },
            memory: win.performance.memory ? {
                used: win.performance.memory.usedJSHeapSize,
                total: win.performance.memory.totalJSHeapSize
            } : null
        };

        if (includeScreenshot) {
            cy.screenshot(`metrics-${metricName}-${Date.now()}`);
        }

        if (includeDOM) {
            metrics.domElements = Cypress.$('*').length;
        }

        // Salvar métricas
        cy.writeFile(`cypress/metrics/${metricName}.json`, metrics);
        cy.log(`📊 Metrics captured: ${metricName}`);
    });
});

// Comando para retry com backoff
Cypress.Commands.add('retryWithBackoff', (callback, options = {}) => {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        backoffMultiplier = 2,
        maxDelay = 10000
    } = options;

    let currentDelay = initialDelay;

    const executeWithRetry = (attempt) => {
        if (attempt > maxRetries) {
            throw new Error(`Max retries (${maxRetries}) exceeded`);
        }

        return cy.then(() => {
            try {
                return callback();
            } catch (error) {
                cy.wait(Math.min(currentDelay, maxDelay));
                currentDelay *= backoffMultiplier;
                return executeWithRetry(attempt + 1);
            }
        });
    };

    return executeWithRetry(1);
});

// Comando para cleanup automático
Cypress.Commands.add('cleanup', () => {
    // Limpar localStorage
    cy.clearLocalStorage();

    // Limpar cookies
    cy.clearCookies();

    // Resetar intercepts
    cy.intercept('**', (req) => req.continue());

    // Limpar uploads pendentes
    cy.window().then((win) => {
        if (win.uploadCleanup) {
            win.uploadCleanup();
        }
    });

    cy.log('🧹 Cleanup completed');
});

// Comando para verificar responsividade
Cypress.Commands.add('checkResponsive', (breakpoints = {}) => {
    const defaultBreakpoints = {
        mobile: [375, 667],
        tablet: [768, 1024],
        desktop: [1280, 720]
    };

    const finalBreakpoints = { ...defaultBreakpoints, ...breakpoints };

    Object.entries(finalBreakpoints).forEach(([device, [width, height]]) => {
        cy.viewport(width, height);
        cy.log(`📱 Testing ${device} (${width}x${height})`);

        // Verificar elementos principais estão visíveis
        cy.get('header, main, footer').should('be.visible');

        // Verificar que não há scroll horizontal
        cy.window().then((win) => {
            expect(win.document.body.scrollWidth).to.be.lte(width);
        });

        cy.wait(500); // Aguardar transições CSS
    });

    // Restaurar viewport padrão
    cy.viewport(1280, 720);
});

// Comando para validar formulários
Cypress.Commands.add('validateForm', (formSelector, validations = {}) => {
    cy.get(formSelector).within(() => {
        Object.entries(validations).forEach(([field, rules]) => {
            cy.log(`🔍 Validating field: ${field}`);

            if (rules.required) {
                // Testar campo obrigatório
                cy.get(`[name="${field}"]`).clear();
                cy.get('button[type="submit"]').click();
                cy.contains(rules.required.message || 'obrigatório').should('be.visible');
            }

            if (rules.minLength) {
                // Testar comprimento mínimo
                cy.get(`[name="${field}"]`).clear().type('ab');
                cy.get('button[type="submit"]').click();
                cy.contains(rules.minLength.message || 'muito curto').should('be.visible');
            }

            if (rules.pattern) {
                // Testar padrão (ex: email)
                cy.get(`[name="${field}"]`).clear().type('invalid');
                cy.get('button[type="submit"]').click();
                cy.contains(rules.pattern.message || 'inválido').should('be.visible');
            }

            if (rules.valid) {
                // Testar valor válido
                cy.get(`[name="${field}"]`).clear().type(rules.valid);
            }
        });
    });
});

// Hook para capturar falhas
beforeEach(() => {
    // Capturar console errors
    cy.window().then((win) => {
        win.console.error = cy.stub();
    });
});

afterEach(() => {
    // Capturar screenshot em caso de falha
    cy.window().then((win) => {
        if (win.console.error.called) {
            cy.screenshot('console-error');
            cy.log('⚠️ Console errors detected');
        }
    });
});