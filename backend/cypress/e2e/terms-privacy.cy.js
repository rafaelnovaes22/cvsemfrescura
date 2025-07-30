describe('Terms and Privacy Flow', () => {
  describe('Terms of Service Page', () => {
    beforeEach(() => {
      cy.visit('/terms.html');
    });

    it('should access terms page without authentication', () => {
      cy.url().should('include', '/terms.html');
      cy.contains('Termos de Uso').should('be.visible');
    });

    it('should display terms content structure', () => {
      cy.get('h1').contains('Termos de Uso').should('be.visible');
      cy.get('#termsContent').should('be.visible');
      cy.get('#lastUpdated').should('be.visible');
      cy.get('#tableOfContents').should('be.visible');
      
      // Verificar seções principais
      cy.contains('1. Aceitação dos Termos').should('be.visible');
      cy.contains('2. Descrição do Serviço').should('be.visible');
      cy.contains('3. Cadastro e Conta').should('be.visible');
      cy.contains('4. Uso Permitido').should('be.visible');
      cy.contains('5. Propriedade Intelectual').should('be.visible');
      cy.contains('6. Pagamento e Reembolso').should('be.visible');
      cy.contains('7. Limitação de Responsabilidade').should('be.visible');
      cy.contains('8. Modificações dos Termos').should('be.visible');
    });

    it('should have table of contents navigation', () => {
      cy.get('#tableOfContents a').first().click();
      cy.url().should('include', '#section-1');
      cy.get('#section-1').should('be.in.viewport');
    });

    it('should show version history', () => {
      cy.get('#versionHistory').click();
      cy.get('#versionHistoryModal').should('be.visible');
      cy.get('.version-item').should('have.length.at.least', 1);
      cy.contains('Versão atual').should('be.visible');
    });

    it('should have print functionality', () => {
      cy.get('#printTermsBtn').should('be.visible');
      cy.window().then((win) => {
        cy.stub(win, 'print');
        cy.get('#printTermsBtn').click();
        cy.wrap(win.print).should('be.called');
      });
    });

    it('should have download as PDF option', () => {
      cy.get('#downloadTermsPdf').should('be.visible');
      cy.get('#downloadTermsPdf').click();
      cy.contains('Gerando PDF').should('be.visible');
    });

    it('should track acceptance for authenticated users', () => {
      // Login primeiro
      const testUser = {
        email: 'terms.test@example.com',
        password: 'TestPassword123!'
      };
      
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('userEmail', testUser.email);
      
      cy.visit('/terms.html');
      cy.get('#acceptTermsBtn').should('be.visible');
      cy.get('#acceptTermsBtn').click();
      
      cy.contains('Termos aceitos').should('be.visible');
      cy.get('#acceptanceDate').should('be.visible');
    });
  });

  describe('Privacy Policy Page', () => {
    beforeEach(() => {
      cy.visit('/privacy.html');
    });

    it('should access privacy page without authentication', () => {
      cy.url().should('include', '/privacy.html');
      cy.contains('Política de Privacidade').should('be.visible');
    });

    it('should display privacy content structure', () => {
      cy.get('h1').contains('Política de Privacidade').should('be.visible');
      cy.get('#privacyContent').should('be.visible');
      cy.get('#effectiveDate').should('be.visible');
      
      // Verificar seções principais
      cy.contains('1. Informações que Coletamos').should('be.visible');
      cy.contains('2. Como Usamos suas Informações').should('be.visible');
      cy.contains('3. Compartilhamento de Dados').should('be.visible');
      cy.contains('4. Segurança dos Dados').should('be.visible');
      cy.contains('5. Seus Direitos').should('be.visible');
      cy.contains('6. Cookies e Tecnologias').should('be.visible');
      cy.contains('7. Retenção de Dados').should('be.visible');
      cy.contains('8. Contato').should('be.visible');
    });

    it('should have LGPD compliance section', () => {
      cy.contains('Lei Geral de Proteção de Dados').should('be.visible');
      cy.contains('LGPD').should('be.visible');
      cy.get('#lgpdSection').should('be.visible');
    });

    it('should display data controller information', () => {
      cy.get('#dataController').should('be.visible');
      cy.contains('Controlador de Dados').should('be.visible');
      cy.contains('DPO').should('be.visible');
      cy.contains('dpo@cvsemfrescura.com').should('be.visible');
    });

    it('should have cookie preferences', () => {
      cy.get('#cookiePreferencesBtn').click();
      cy.get('#cookiePreferencesModal').should('be.visible');
      
      cy.get('#essentialCookies').should('be.checked').and('be.disabled');
      cy.get('#analyticsCookies').should('be.visible');
      cy.get('#marketingCookies').should('be.visible');
      
      cy.get('#savePreferencesBtn').click();
      cy.contains('Preferências salvas').should('be.visible');
    });
  });

  describe('User Rights Management', () => {
    const testUser = {
      name: 'Privacy Test User',
      email: `privacy.test.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      phone: '11987654321'
    };
    
    let authToken;

    before(() => {
      // Registrar e fazer login
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

    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      cy.visit('/privacy.html');
    });

    it('should access data request form', () => {
      cy.get('#dataRequestBtn').click();
      cy.get('#dataRequestModal').should('be.visible');
      
      cy.get('#requestType').should('be.visible');
      cy.get('#requestType option').should('have.length.at.least', 4);
    });

    it('should request data export', () => {
      cy.get('#dataRequestBtn').click();
      cy.get('#requestType').select('export');
      cy.get('#requestReason').type('Quero uma cópia dos meus dados');
      cy.get('#submitRequestBtn').click();
      
      cy.contains('Solicitação enviada').should('be.visible');
      cy.contains('até 15 dias').should('be.visible');
    });

    it('should request data deletion', () => {
      cy.get('#dataRequestBtn').click();
      cy.get('#requestType').select('deletion');
      cy.get('#deletionScope').should('be.visible');
      cy.get('#confirmDeletion').should('be.visible');
      
      cy.get('#deletionScope').select('all');
      cy.get('#confirmDeletion').check();
      cy.get('#requestReason').type('Não quero mais usar o serviço');
      cy.get('#submitRequestBtn').click();
      
      cy.contains('Solicitação de exclusão enviada').should('be.visible');
    });

    it('should request data rectification', () => {
      cy.get('#dataRequestBtn').click();
      cy.get('#requestType').select('rectification');
      cy.get('#dataToRectify').should('be.visible');
      
      cy.get('#dataToRectify').type('Nome e telefone estão incorretos');
      cy.get('#submitRequestBtn').click();
      
      cy.contains('Solicitação enviada').should('be.visible');
    });

    it('should view data processing activities', () => {
      cy.get('#viewProcessingActivities').click();
      cy.get('#processingActivitiesModal').should('be.visible');
      
      cy.get('.activity-item').should('have.length.at.least', 3);
      cy.contains('Análise de Currículo').should('be.visible');
      cy.contains('Base Legal').should('be.visible');
      cy.contains('Período de Retenção').should('be.visible');
    });
  });

  describe('Terms and Privacy Navigation', () => {
    it('should navigate between terms and privacy', () => {
      cy.visit('/terms.html');
      cy.get('a[href="/privacy.html"]').first().click();
      cy.url().should('include', '/privacy.html');
      
      cy.get('a[href="/terms.html"]').first().click();
      cy.url().should('include', '/terms.html');
    });

    it('should have footer links on all pages', () => {
      const pages = ['/index.html', '/analisar.html', '/contact.html'];
      
      pages.forEach(page => {
        cy.visit(page);
        cy.get('footer').contains('Termos de Uso').should('be.visible');
        cy.get('footer').contains('Política de Privacidade').should('be.visible');
      });
    });
  });

  describe('Terms Acceptance Flow', () => {
    it('should require terms acceptance on registration', () => {
      cy.visit('/index.html');
      cy.get('#showRegister').click();
      
      cy.get('#registerName').type('New User');
      cy.get('#registerEmail').type('newuser@example.com');
      cy.get('#registerPassword').type('Password123!');
      cy.get('#registerPhone').type('11999999999');
      
      // Tentar registrar sem aceitar termos
      cy.get('#registerForm button[type="submit"]').click();
      cy.contains('Você deve aceitar os termos').should('be.visible');
      
      // Aceitar termos
      cy.get('#acceptTermsCheckbox').check();
      cy.get('#registerForm button[type="submit"]').click();
    });

    it('should show terms update notification', () => {
      localStorage.setItem('termsAcceptedVersion', '1.0');
      localStorage.setItem('currentTermsVersion', '2.0');
      
      cy.visit('/analisar.html');
      cy.get('#termsUpdateBanner').should('be.visible');
      cy.contains('Termos de Uso foram atualizados').should('be.visible');
      
      cy.get('#reviewTermsBtn').click();
      cy.url().should('include', '/terms.html');
    });
  });

  describe('Privacy Settings Dashboard', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('userEmail', 'test@example.com');
      cy.visit('/privacy.html#settings');
    });

    it('should display privacy settings dashboard', () => {
      cy.get('#privacySettingsDashboard').should('be.visible');
      cy.contains('Suas Configurações de Privacidade').should('be.visible');
    });

    it('should manage email preferences', () => {
      cy.get('#emailPreferences').should('be.visible');
      cy.get('#marketingEmails').uncheck();
      cy.get('#transactionalEmails').should('be.checked').and('be.disabled');
      cy.get('#saveEmailPreferences').click();
      
      cy.contains('Preferências atualizadas').should('be.visible');
    });

    it('should manage data sharing preferences', () => {
      cy.get('#dataSharing').should('be.visible');
      cy.get('#shareWithPartners').should('not.be.checked');
      cy.get('#shareForImprovement').check();
      cy.get('#saveDataPreferences').click();
      
      cy.contains('Configurações salvas').should('be.visible');
    });

    it('should download privacy report', () => {
      cy.get('#downloadPrivacyReport').click();
      cy.contains('Gerando relatório').should('be.visible');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper heading structure in terms', () => {
      cy.visit('/terms.html');
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('have.length.at.least', 8);
      
      // Verificar hierarquia
      cy.get('h1').first().invoke('text').should('include', 'Termos');
    });

    it('should have proper heading structure in privacy', () => {
      cy.visit('/privacy.html');
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('have.length.at.least', 8);
    });

    it('should be keyboard navigable', () => {
      cy.visit('/terms.html');
      cy.get('body').tab();
      cy.focused().should('have.attr', 'href', '#main-content');
      
      cy.focused().tab();
      cy.focused().should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/privacy.html');
      cy.get('nav[aria-label="Índice"]').should('exist');
      cy.get('main[role="main"]').should('exist');
    });
  });

  describe('Search Functionality', () => {
    it('should search within terms', () => {
      cy.visit('/terms.html');
      cy.get('#searchTerms').type('pagamento');
      cy.wait(500);
      
      cy.get('.search-result').should('be.visible');
      cy.get('.highlight').should('exist');
    });

    it('should search within privacy policy', () => {
      cy.visit('/privacy.html');
      cy.get('#searchPrivacy').type('dados pessoais');
      cy.wait(500);
      
      cy.get('.search-result').should('be.visible');
      cy.get('.search-result').should('contain', 'dados pessoais');
    });
  });

  describe('Mobile Experience', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should be readable on mobile - terms', () => {
      cy.visit('/terms.html');
      cy.get('#termsContent').should('be.visible');
      cy.get('body').should('have.css', 'font-size').and('match', /1[4-6]px/);
    });

    it('should have mobile-friendly navigation', () => {
      cy.visit('/privacy.html');
      cy.get('#mobileTableOfContents').click();
      cy.get('#tableOfContents').should('be.visible');
    });

    it('should have sticky accept button on mobile', () => {
      cy.visit('/terms.html');
      cy.scrollTo('bottom');
      cy.get('#mobileAcceptBar').should('be.visible').and('be.in.viewport');
    });
  });

  describe('Legal Compliance Tracking', () => {
    it('should log terms acceptance', () => {
      const mockUser = {
        email: 'compliance@test.com',
        token: 'test-token'
      };
      
      localStorage.setItem('token', mockUser.token);
      localStorage.setItem('userEmail', mockUser.email);
      
      cy.visit('/terms.html');
      cy.get('#acceptTermsBtn').click();
      
      // Verificar log de aceitação
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/user/compliance-log`,
        headers: {
          'Authorization': `Bearer ${mockUser.token}`
        }
      }).then((response) => {
        const log = response.body;
        expect(log).to.have.property('termsAccepted');
        expect(log.termsAccepted).to.have.property('version');
        expect(log.termsAccepted).to.have.property('timestamp');
        expect(log.termsAccepted).to.have.property('ip');
      });
    });
  });
});