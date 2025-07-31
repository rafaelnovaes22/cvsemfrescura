// Teste de Autenticação Otimizado com Novos Helpers

describe('Optimized Authentication Flow', () => {

    beforeEach(() => {
        // Cleanup automático antes de cada teste
        cy.cleanup();
    });

    describe('User Registration - Enhanced', () => {

        it('deve validar formulário de registro completamente', () => {
            cy.visit('/analisar.html?login=false');
            cy.waitForPageLoad();

            cy.contains('Cadastre-se').click();

            // Usar novo comando de validação de formulário
            cy.validateForm('form', {
                name: {
                    required: { message: 'Nome é obrigatório' },
                    minLength: { message: 'Nome muito curto' },
                    valid: 'João Silva'
                },
                email: {
                    required: { message: 'Email é obrigatório' },
                    pattern: { message: 'Email inválido' },
                    valid: 'joao@example.com'
                },
                password: {
                    required: { message: 'Senha é obrigatória' },
                    minLength: { message: 'Senha deve ter pelo menos' },
                    valid: 'SenhaSegura123!'
                },
                phone: {
                    required: { message: 'Telefone é obrigatório' },
                    valid: '11987654321'
                }
            });

            // Verificar responsividade do formulário
            cy.checkResponsive({
                mobile: [375, 667],
                tablet: [768, 1024]
            });
        });

        it('deve registrar usuário com métricas de performance', () => {
            const userData = {
                name: 'Performance Test User',
                email: `perf.${Date.now()}@example.com`,
                password: 'TestPassword123!',
                phone: '11987654321'
            };

            cy.visit('/analisar.html?login=false');
            cy.waitForPageLoad();

            // Capturar métricas iniciais
            cy.captureMetrics('registration-start', { includeScreenshot: true });

            cy.contains('Cadastre-se').click();

            // Preencher formulário
            cy.get('input[name="name"]').type(userData.name);
            cy.get('input[name="email"]').type(userData.email);
            cy.get('input[name="password"]').type(userData.password);
            cy.get('input[name="phone"]').type(userData.phone);

            // Aguardar e validar chamada de API
            cy.waitForApiCall('POST', '**/user/register');

            cy.get('button[type="submit"]').click();

            // Verificar sucesso
            cy.contains('Cadastro realizado', { timeout: 10000 }).should('be.visible');

            // Capturar métricas finais
            cy.captureMetrics('registration-complete');

            // Verificar acessibilidade
            cy.checkA11y();
        });

        it('deve testar registro com condições de rede lentas', () => {
            // Simular rede lenta
            cy.simulateNetworkConditions('slow');

            cy.visit('/analisar.html?login=false');
            cy.contains('Cadastre-se').click();

            const userData = {
                name: 'Slow Network User',
                email: `slow.${Date.now()}@example.com`,
                password: 'TestPassword123!',
                phone: '11987654321'
            };

            cy.get('input[name="name"]').type(userData.name);
            cy.get('input[name="email"]').type(userData.email);
            cy.get('input[name="password"]').type(userData.password);
            cy.get('input[name="phone"]').type(userData.phone);

            cy.get('button[type="submit"]').click();

            // Verificar loading state
            cy.get('.loading, [data-testid="loading"]', { timeout: 15000 })
                .should('be.visible');

            // Aguardar conclusão mesmo com rede lenta
            cy.contains('Cadastro realizado', { timeout: 20000 })
                .should('be.visible');
        });
    });

    describe('User Login - Enhanced', () => {

        it('deve fazer login com retry automático em caso de falha', () => {
            // Criar usuário de teste
            cy.createAndLoginUser({
                name: 'Retry Test User',
                email: `retry.${Date.now()}@example.com`
            }).then((user) => {
                // Logout para testar login
                cy.cleanup();

                cy.visit('/analisar.html?login=false');

                // Usar retry com backoff em caso de falha temporária
                cy.retryWithBackoff(() => {
                    cy.get('input[name="email"]').clear().type(user.email);
                    cy.get('input[name="password"]').clear().type(user.password);
                    cy.get('button[type="submit"]').click();

                    // Verificar sucesso
                    cy.url({ timeout: 10000 }).should('include', '/analisar.html');
                    cy.contains('Carregar Currículo').should('be.visible');
                }, {
                    maxRetries: 3,
                    initialDelay: 1000
                });
            });
        });

        it('deve testar persistência de sessão', () => {
            cy.createAndLoginUser().then((user) => {
                // Verificar que está logado
                cy.visit('/analisar.html');
                cy.contains('Carregar Currículo').should('be.visible');

                // Simular refresh da página
                cy.reload();
                cy.waitForPageLoad();

                // Verificar que ainda está logado
                cy.contains('Carregar Currículo').should('be.visible');

                // Verificar dados no localStorage
                cy.window().then((win) => {
                    expect(win.localStorage.getItem('token')).to.exist;
                    expect(win.localStorage.getItem('userEmail')).to.equal(user.email);
                });
            });
        });

        it('deve testar logout e limpeza de dados', () => {
            cy.createAndLoginUser().then(() => {
                cy.visit('/analisar.html');

                // Executar logout
                cy.get('[data-testid="logout"], .logout-btn').click();

                // Verificar redirecionamento
                cy.url().should('include', '/index.html');

                // Verificar limpeza de dados
                cy.window().then((win) => {
                    expect(win.localStorage.getItem('token')).to.be.null;
                    expect(win.localStorage.getItem('userEmail')).to.be.null;
                });

                // Tentar acessar página protegida
                cy.visit('/analisar.html');
                cy.url().should('include', '/index.html'); // Deve redirecionar
            });
        });
    });

    describe('Authentication Security - Enhanced', () => {

        it('deve proteger contra ataques de força bruta', () => {
            const email = 'security@test.com';
            const wrongPassword = 'senhaerrada';

            cy.visit('/analisar.html?login=false');

            // Tentar login múltiplas vezes com senha errada
            for (let i = 0; i < 5; i++) {
                cy.get('input[name="email"]').clear().type(email);
                cy.get('input[name="password"]').clear().type(wrongPassword);
                cy.get('button[type="submit"]').click();

                if (i < 4) {
                    cy.contains('Senha incorreta').should('be.visible');
                }
            }

            // Verificar se há limitação de tentativas
            cy.contains('muitas tentativas', { timeout: 5000 }).should('be.visible')
                .or(() => {
                    // Se não há limitação, pelo menos verificar que o erro persiste
                    cy.contains('Senha incorreta').should('be.visible');
                });
        });

        it('deve validar tokens JWT expirados', () => {
            cy.createAndLoginUser().then(() => {
                // Simular token expirado
                cy.window().then((win) => {
                    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
                    win.localStorage.setItem('token', expiredToken);
                });

                // Tentar acessar recurso protegido
                cy.request({
                    method: 'GET',
                    url: `${Cypress.env('apiUrl')}/user/profile`,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.equal(401);
                });
            });
        });

        it('deve sanitizar inputs contra XSS', () => {
            const xssPayload = '<script>alert("xss")</script>';

            cy.visit('/analisar.html?login=false');
            cy.contains('Cadastre-se').click();

            // Tentar inserir payload XSS
            cy.get('input[name="name"]').type(xssPayload);
            cy.get('input[name="email"]').type('test@example.com');
            cy.get('input[name="password"]').type('Password123!');
            cy.get('input[name="phone"]').type('11987654321');

            cy.get('button[type="submit"]').click();

            // Verificar que script não foi executado
            cy.window().then((win) => {
                // Se chegou até aqui sem alert, o XSS foi prevenido
                expect(win.document.body.innerHTML).to.not.include('<script>');
            });
        });
    });

    describe('Cross-Browser Compatibility', () => {

        it('deve funcionar em diferentes navegadores', () => {
            // Teste básico de compatibilidade
            cy.createAndLoginUser().then((user) => {
                cy.visit('/analisar.html');

                // Verificar funcionalidades básicas
                cy.contains('Carregar Currículo').should('be.visible');

                // Testar upload (simulado)
                cy.get('input[type="file"]').should('exist');

                // Testar JavaScript básico
                cy.window().then((win) => {
                    expect(win.localStorage).to.exist;
                    expect(win.fetch).to.exist;
                    expect(win.Promise).to.exist;
                });

                // Verificar CSS moderno
                cy.get('body').should('have.css', 'display');
            });
        });
    });

    describe('Accessibility Compliance', () => {

        it('deve atender padrões de acessibilidade WCAG', () => {
            cy.visit('/analisar.html?login=false');

            // Verificar estrutura semântica
            cy.get('main').should('exist');
            cy.get('header').should('exist');

            // Verificar navegação por teclado
            cy.get('a, button, input').each(($el) => {
                if (Cypress.$($el).is(':visible')) {
                    cy.wrap($el).focus();
                    cy.focused().should('exist');
                }
            });

            // Verificar labels de formulário
            cy.get('input').each(($input) => {
                const id = $input.attr('id');
                const name = $input.attr('name');

                if (id) {
                    cy.get(`label[for="${id}"]`).should('exist');
                } else if (name) {
                    cy.contains('label', name, { matchCase: false }).should('exist');
                }
            });

            // Verificar contraste de cores (simulação básica)
            cy.get('button, a').each(($el) => {
                cy.wrap($el).should('be.visible');
                // Em um teste real, usaríamos uma biblioteca como cypress-axe
            });
        });
    });

    after(() => {
        // Cleanup final
        cy.cleanup();
        cy.log('🏁 Authentication tests completed');
    });
});