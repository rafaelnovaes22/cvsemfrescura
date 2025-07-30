describe('Gift Code Redemption Flow', () => {
  const testUser = {
    name: 'Gift Code Test User',
    email: `gift.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  const adminUser = {
    email: 'admin@cvsemfrescura.com',
    password: 'AdminPassword123!'
  };

  const giftCodes = {
    valid: 'GIFT-VALID-2024',
    expired: 'GIFT-EXPIRED-2023',
    used: 'GIFT-USED-ALREADY',
    invalid: 'GIFT-INVALID-CODE',
    multiUse: 'GIFT-MULTI-USE-5X',
    premium: 'GIFT-PREMIUM-PLAN'
  };

  beforeEach(() => {
    // Register and login regular user
    cy.register(testUser);
    cy.login(testUser.email, testUser.password);
  });

  describe('Gift Code Input', () => {
    beforeEach(() => {
      cy.visit('/redeem-gift-code');
    });

    it('should display gift code redemption form', () => {
      cy.get('h1').contains('Resgatar Código Presente').should('be.visible');
      cy.get('input[data-cy="gift-code-input"]').should('be.visible');
      cy.get('button[data-cy="redeem-button"]').should('be.visible');
      
      // Should show instructions
      cy.contains('Digite o código presente').should('be.visible');
      cy.contains('16 caracteres').should('be.visible');
    });

    it('should format gift code input automatically', () => {
      cy.get('input[data-cy="gift-code-input"]').type('ABCD1234EFGH5678');
      cy.get('input[data-cy="gift-code-input"]').should('have.value', 'ABCD-1234-EFGH-5678');
    });

    it('should validate gift code format', () => {
      // Too short
      cy.get('input[data-cy="gift-code-input"]').type('ABC');
      cy.get('button[data-cy="redeem-button"]').click();
      cy.contains('Código deve ter 16 caracteres').should('be.visible');
      
      // Invalid characters
      cy.get('input[data-cy="gift-code-input"]').clear().type('GIFT-CODE-WITH-@#$%');
      cy.get('button[data-cy="redeem-button"]').click();
      cy.contains('Código contém caracteres inválidos').should('be.visible');
    });

    it('should show loading state during validation', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.valid);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.get('button[data-cy="redeem-button"]').should('contain', 'Validando...');
      cy.get('button[data-cy="redeem-button"]').should('be.disabled');
    });
  });

  describe('Gift Code Validation', () => {
    beforeEach(() => {
      cy.visit('/redeem-gift-code');
    });

    it('should successfully validate and redeem valid code', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.valid);
      cy.get('button[data-cy="redeem-button"]').click();
      
      // Should show success message
      cy.contains('Código resgatado com sucesso!', { timeout: 5000 }).should('be.visible');
      
      // Should show code benefits
      cy.get('[data-cy="code-benefits"]').should('be.visible');
      cy.contains('1 currículo gratuito').should('be.visible');
      cy.contains('Válido por 30 dias').should('be.visible');
      
      // Should redirect to create CV
      cy.get('button[data-cy="use-benefit"]').click();
      cy.url().should('include', '/create-cv');
    });

    it('should show error for expired code', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.expired);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.contains('Código expirado').should('be.visible');
      cy.contains('Este código expirou em').should('be.visible');
    });

    it('should show error for already used code', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.used);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.contains('Código já utilizado').should('be.visible');
      cy.contains('Este código já foi resgatado').should('be.visible');
    });

    it('should show error for invalid code', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.invalid);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.contains('Código inválido').should('be.visible');
      cy.contains('Verifique se digitou corretamente').should('be.visible');
    });

    it('should handle multi-use codes', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.multiUse);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.contains('Código resgatado com sucesso!').should('be.visible');
      cy.contains('5 currículos gratuitos').should('be.visible');
      cy.contains('Usos restantes: 4').should('be.visible');
    });

    it('should handle premium plan codes', () => {
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.premium);
      cy.get('button[data-cy="redeem-button"]').click();
      
      cy.contains('Plano Premium ativado!').should('be.visible');
      cy.contains('30 dias de acesso Premium').should('be.visible');
      cy.contains('Currículos ilimitados').should('be.visible');
    });
  });

  describe('Using Redeemed Benefits', () => {
    beforeEach(() => {
      // Redeem a code first
      cy.visit('/redeem-gift-code');
      cy.get('input[data-cy="gift-code-input"]').type(giftCodes.valid);
      cy.get('button[data-cy="redeem-button"]').click();
      cy.contains('Código resgatado com sucesso!', { timeout: 5000 });
    });

    it('should show available benefits in user profile', () => {
      cy.visit('/profile/benefits');
      
      cy.contains('Benefícios Disponíveis').should('be.visible');
      cy.get('[data-cy="benefit-card"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="benefit-card"]').first().within(() => {
        cy.contains('1 currículo gratuito').should('be.visible');
        cy.contains('Expira em').should('be.visible');
        cy.get('button[data-cy="use-benefit"]').should('be.visible');
      });
    });

    it('should apply benefit when creating CV', () => {
      cy.visit('/create-cv');
      
      // Fill CV form (using helper from previous test)
      fillBasicCVForm();
      
      // Should show benefit option at checkout
      cy.get('button[data-cy="generate-cv"]').click();
      
      cy.get('[data-cy="benefit-option"]').should('be.visible');
      cy.contains('Usar benefício gratuito').should('be.visible');
      cy.get('input[data-cy="use-benefit-checkbox"]').check();
      
      // Should not require payment
      cy.get('[data-cy="payment-section"]').should('not.be.visible');
      cy.get('button[data-cy="confirm-generation"]').click();
      
      cy.contains('Currículo gerado com sucesso!').should('be.visible');
      cy.contains('Benefício utilizado').should('be.visible');
    });

    it('should track benefit usage', () => {
      // Use the benefit
      cy.visit('/create-cv');
      fillBasicCVForm();
      cy.get('button[data-cy="generate-cv"]').click();
      cy.get('input[data-cy="use-benefit-checkbox"]').check();
      cy.get('button[data-cy="confirm-generation"]').click();
      
      // Check profile
      cy.visit('/profile/benefits');
      
      // Should show used benefit
      cy.get('[data-cy="used-benefits-tab"]').click();
      cy.get('[data-cy="used-benefit-card"]').should('have.length.at.least', 1);
      cy.contains('Usado em').should('be.visible');
    });

    it('should expire unused benefits', () => {
      // Fast forward time (mock)
      cy.clock(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31 days later
      
      cy.visit('/profile/benefits');
      
      cy.get('[data-cy="expired-benefits-tab"]').click();
      cy.contains('Benefício expirado').should('be.visible');
      cy.contains('Não utilizado').should('be.visible');
    });
  });

  describe('Gift Code History', () => {
    beforeEach(() => {
      // Redeem multiple codes
      const codes = [giftCodes.valid, giftCodes.multiUse];
      codes.forEach(code => {
        cy.visit('/redeem-gift-code');
        cy.get('input[data-cy="gift-code-input"]').type(code);
        cy.get('button[data-cy="redeem-button"]').click();
        cy.contains('sucesso', { timeout: 5000 });
      });
    });

    it('should show redemption history', () => {
      cy.visit('/profile/gift-codes');
      
      cy.contains('Histórico de Códigos').should('be.visible');
      cy.get('[data-cy^="code-history-"]').should('have.length.at.least', 2);
      
      // Check history details
      cy.get('[data-cy="code-history-0"]').within(() => {
        cy.contains('GIFT-').should('be.visible');
        cy.contains('Resgatado em').should('be.visible');
        cy.contains('Status:').should('be.visible');
      });
    });

    it('should filter history by status', () => {
      cy.visit('/profile/gift-codes');
      
      // Filter by active
      cy.get('select[data-cy="filter-status"]').select('active');
      cy.get('[data-cy^="code-history-"]').each(($el) => {
        cy.wrap($el).contains('Ativo').should('be.visible');
      });
      
      // Filter by used
      cy.get('select[data-cy="filter-status"]').select('used');
      cy.get('[data-cy^="code-history-"]').should('have.length', 0); // None used yet
    });

    it('should search codes', () => {
      cy.visit('/profile/gift-codes');
      
      cy.get('input[data-cy="search-codes"]').type('MULTI');
      cy.get('[data-cy^="code-history-"]').should('have.length', 1);
      cy.contains('GIFT-MULTI-USE-5X').should('be.visible');
    });
  });

  describe('Gift Code Administration', () => {
    beforeEach(() => {
      // Login as admin
      cy.login(adminUser.email, adminUser.password);
      cy.visit('/admin/gift-codes');
    });

    it('should display gift code management interface', () => {
      cy.contains('Gerenciar Códigos Presente').should('be.visible');
      cy.get('button[data-cy="create-code"]').should('be.visible');
      cy.get('button[data-cy="bulk-create"]').should('be.visible');
      cy.get('[data-cy="codes-table"]').should('be.visible');
    });

    it('should create single gift code', () => {
      cy.get('button[data-cy="create-code"]').click();
      cy.get('[data-cy="create-code-modal"]').should('be.visible');
      
      // Fill form
      cy.get('input[data-cy="code-prefix"]').type('TEST');
      cy.get('select[data-cy="code-type"]').select('single_cv');
      cy.get('input[data-cy="code-quantity"]').clear().type('1');
      cy.get('input[data-cy="expiry-days"]').clear().type('30');
      cy.get('textarea[data-cy="code-description"]').type('Test gift code');
      
      cy.get('button[data-cy="generate-code"]').click();
      
      // Should show generated code
      cy.get('[data-cy="generated-code"]').should('be.visible');
      cy.get('[data-cy="copy-code"]').should('be.visible');
      
      // Should add to table
      cy.get('button[data-cy="close-modal"]').click();
      cy.contains('TEST-').should('be.visible');
    });

    it('should bulk create gift codes', () => {
      cy.get('button[data-cy="bulk-create"]').click();
      cy.get('[data-cy="bulk-create-modal"]').should('be.visible');
      
      // Fill bulk form
      cy.get('input[data-cy="bulk-quantity"]').type('10');
      cy.get('select[data-cy="bulk-type"]').select('single_cv');
      cy.get('input[data-cy="bulk-prefix"]').type('BULK');
      cy.get('input[data-cy="bulk-expiry"]').clear().type('90');
      
      cy.get('button[data-cy="generate-bulk"]').click();
      
      // Should show progress
      cy.get('[data-cy="bulk-progress"]').should('be.visible');
      cy.contains('10 códigos gerados').should('be.visible');
      
      // Should download CSV
      cy.get('button[data-cy="download-csv"]').click();
      cy.readFile('cypress/downloads/gift-codes-*.csv').should('exist');
    });

    it('should view code statistics', () => {
      cy.get('[data-cy="stats-tab"]').click();
      
      cy.contains('Estatísticas de Códigos').should('be.visible');
      cy.get('[data-cy="total-codes"]').should('be.visible');
      cy.get('[data-cy="redeemed-codes"]').should('be.visible');
      cy.get('[data-cy="active-codes"]').should('be.visible');
      cy.get('[data-cy="expired-codes"]').should('be.visible');
      
      // Should show chart
      cy.get('[data-cy="redemption-chart"]').should('be.visible');
    });

    it('should deactivate gift code', () => {
      // Find an active code
      cy.get('[data-cy="codes-table"] tr').first().within(() => {
        cy.get('button[data-cy="code-actions"]').click();
      });
      
      cy.get('[data-cy="deactivate-code"]').click();
      
      // Confirm deactivation
      cy.get('[data-cy="confirm-modal"]').should('be.visible');
      cy.contains('Desativar código?').should('be.visible');
      cy.get('button[data-cy="confirm-deactivate"]').click();
      
      // Should update status
      cy.contains('Código desativado').should('be.visible');
      cy.get('[data-cy="codes-table"] tr').first().within(() => {
        cy.contains('Inativo').should('be.visible');
      });
    });

    it('should export codes report', () => {
      cy.get('button[data-cy="export-report"]').click();
      cy.get('[data-cy="export-modal"]').should('be.visible');
      
      // Select date range
      cy.get('input[data-cy="export-start-date"]').type('2024-01-01');
      cy.get('input[data-cy="export-end-date"]').type('2024-12-31');
      
      // Select format
      cy.get('select[data-cy="export-format"]').select('xlsx');
      
      cy.get('button[data-cy="download-report"]').click();
      
      cy.readFile('cypress/downloads/gift-codes-report-*.xlsx').should('exist');
    });
  });

  describe('Gift Code Sharing', () => {
    beforeEach(() => {
      cy.visit('/share-gift-code');
    });

    it('should generate shareable gift link', () => {
      cy.get('input[data-cy="recipient-email"]').type('friend@example.com');
      cy.get('input[data-cy="recipient-name"]').type('Friend Name');
      cy.get('textarea[data-cy="gift-message"]').type('Enjoy your free CV!');
      
      cy.get('button[data-cy="generate-gift"]').click();
      
      // Should show gift link
      cy.get('[data-cy="gift-link"]').should('be.visible');
      cy.get('input[data-cy="share-link"]').should('contain.value', '/gift/');
      
      // Should show share options
      cy.get('button[data-cy="share-whatsapp"]').should('be.visible');
      cy.get('button[data-cy="share-email"]').should('be.visible');
      cy.get('button[data-cy="copy-link"]').should('be.visible');
    });

    it('should send gift code by email', () => {
      cy.get('input[data-cy="recipient-email"]').type('friend@example.com');
      cy.get('input[data-cy="recipient-name"]').type('Friend Name');
      cy.get('textarea[data-cy="gift-message"]').type('Happy Birthday!');
      
      cy.get('button[data-cy="send-by-email"]').click();
      
      cy.contains('Email enviado com sucesso!').should('be.visible');
      cy.contains('Código presente enviado para friend@example.com').should('be.visible');
    });

    it('should track gift code shares', () => {
      // Generate and share a gift
      cy.get('input[data-cy="recipient-email"]').type('friend@example.com');
      cy.get('button[data-cy="generate-gift"]').click();
      cy.get('button[data-cy="copy-link"]').click();
      
      // Check tracking
      cy.visit('/profile/shared-gifts');
      
      cy.contains('Presentes Compartilhados').should('be.visible');
      cy.get('[data-cy^="shared-gift-"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="shared-gift-0"]').within(() => {
        cy.contains('friend@example.com').should('be.visible');
        cy.contains('Status: Não resgatado').should('be.visible');
      });
    });
  });

  describe('Gift Code Landing Page', () => {
    const giftLink = '/gift/SPECIAL-GIFT-CODE-123';

    it('should display gift landing page', () => {
      cy.visit(giftLink);
      
      cy.contains('Você recebeu um presente!').should('be.visible');
      cy.contains('1 currículo gratuito').should('be.visible');
      cy.get('button[data-cy="claim-gift"]').should('be.visible');
      
      // Should show sender info if available
      cy.contains('Presente de:').should('be.visible');
    });

    it('should auto-fill code on redemption page', () => {
      cy.visit(giftLink);
      cy.get('button[data-cy="claim-gift"]').click();
      
      // Should redirect to redemption with code pre-filled
      cy.url().should('include', '/redeem-gift-code');
      cy.get('input[data-cy="gift-code-input"]').should('have.value', 'SPECIAL-GIFT-CODE-123');
    });

    it('should show custom message', () => {
      cy.visit(`${giftLink}?message=Happy%20Birthday!`);
      
      cy.contains('Happy Birthday!').should('be.visible');
    });
  });
});

// Helper function to fill basic CV form
function fillBasicCVForm() {
  cy.get('input[name="fullName"]').type('Test User');
  cy.get('input[name="email"]').type('test@example.com');
  cy.get('input[name="phone"]').type('11999999999');
  cy.get('textarea[name="objective"]').type('Test objective');
  
  // Add basic experience
  cy.get('button[data-cy="add-experience"]').click();
  cy.get('input[name="experience[0].position"]').type('Test Position');
  cy.get('input[name="experience[0].company"]').type('Test Company');
  cy.get('input[name="experience[0].period"]').type('2023 - Present');
  
  // Add basic education
  cy.get('button[data-cy="add-education"]').click();
  cy.get('input[name="education[0].degree"]').type('Test Degree');
  cy.get('input[name="education[0].institution"]').type('Test University');
  cy.get('input[name="education[0].period"]').type('2019 - 2023');
}