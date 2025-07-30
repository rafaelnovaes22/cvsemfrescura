describe('Password Reset Flow', () => {
  const testUser = {
    name: 'Password Reset Test User',
    email: `reset.test.${Date.now()}@example.com`,
    password: 'OldPassword123!',
    newPassword: 'NewPassword123!',
    phone: '11987654321'
  };

  const resetToken = 'test-reset-token-123456';

  beforeEach(() => {
    // Register user first
    cy.register(testUser);
  });

  describe('Forgot Password Page', () => {
    beforeEach(() => {
      cy.visit('/forgot-password.html');
    });

    it('should display forgot password form', () => {
      // Check page elements
      cy.get('.logo').should('be.visible');
      cy.get('.title').contains('Esqueci Minha Senha').should('be.visible');
      cy.get('.subtitle').contains('Digite seu e-mail').should('be.visible');
      
      // Check form elements
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="submit-button"]').should('be.visible');
      cy.get('[data-cy="back-to-login"]').should('be.visible');
    });

    it('should validate email format', () => {
      // Submit empty email
      cy.get('[data-cy="submit-button"]').click();
      cy.get('[data-cy="error-message"]').should('contain', 'Digite um e-mail');

      // Submit invalid email
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="submit-button"]').click();
      cy.get('[data-cy="error-message"]').should('contain', 'E-mail inválido');

      // Clear and try valid email
      cy.get('[data-cy="email-input"]').clear().type(testUser.email);
      cy.get('[data-cy="error-message"]').should('not.exist');
    });

    it('should handle non-existent email', () => {
      // Mock API response for non-existent email
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 404,
        body: { error: 'E-mail não cadastrado' }
      }).as('forgotPasswordNotFound');

      cy.get('[data-cy="email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="submit-button"]').click();

      cy.wait('@forgotPasswordNotFound');
      cy.get('[data-cy="error-message"]').should('contain', 'E-mail não cadastrado');
    });

    it('should successfully request password reset', () => {
      // Mock successful API response
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { 
          success: true,
          message: 'E-mail de recuperação enviado'
        }
      }).as('forgotPasswordSuccess');

      cy.get('[data-cy="email-input"]').type(testUser.email);
      cy.get('[data-cy="submit-button"]').click();

      cy.wait('@forgotPasswordSuccess');

      // Should show success message
      cy.get('[data-cy="success-message"]').should('be.visible');
      cy.get('[data-cy="success-message"]').should('contain', 'E-mail enviado');
      
      // Should show instructions
      cy.get('[data-cy="email-sent-instructions"]').should('be.visible');
      cy.get('[data-cy="email-sent-instructions"]').should('contain', 'Verifique sua caixa de entrada');
    });

    it('should handle rate limiting', () => {
      // Mock rate limit response
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 429,
        body: { error: 'Muitas tentativas. Aguarde 15 minutos.' }
      }).as('forgotPasswordRateLimit');

      cy.get('[data-cy="email-input"]').type(testUser.email);
      cy.get('[data-cy="submit-button"]').click();

      cy.wait('@forgotPasswordRateLimit');
      cy.get('[data-cy="error-message"]').should('contain', 'Muitas tentativas');
    });

    it('should show loading state during request', () => {
      // Mock slow API response
      cy.intercept('POST', '/api/auth/forgot-password', {
        delay: 2000,
        statusCode: 200,
        body: { success: true }
      }).as('forgotPasswordSlow');

      cy.get('[data-cy="email-input"]').type(testUser.email);
      cy.get('[data-cy="submit-button"]').click();

      // Check loading state
      cy.get('[data-cy="submit-button"]').should('be.disabled');
      cy.get('[data-cy="loading-spinner"]').should('be.visible');
      cy.get('[data-cy="submit-button"]').should('contain', 'Enviando...');

      cy.wait('@forgotPasswordSlow');

      // Loading state should be gone
      cy.get('[data-cy="submit-button"]').should('not.be.disabled');
      cy.get('[data-cy="loading-spinner"]').should('not.exist');
    });

    it('should navigate back to login', () => {
      cy.get('[data-cy="back-to-login"]').click();
      cy.url().should('include', 'index.html');
    });
  });

  describe('Reset Password Page', () => {
    beforeEach(() => {
      // Visit reset password page with token
      cy.visit(`/reset-password.html?token=${resetToken}`);
    });

    it('should display reset password form', () => {
      // Check page elements
      cy.get('.logo').should('be.visible');
      cy.get('.title').contains('Redefinir Senha').should('be.visible');
      
      // Check user info (if available)
      cy.get('[data-cy="user-info"]').should('be.visible');
      
      // Check form elements
      cy.get('[data-cy="new-password-input"]').should('be.visible');
      cy.get('[data-cy="confirm-password-input"]').should('be.visible');
      cy.get('[data-cy="submit-button"]').should('be.visible');
    });

    it('should validate token on page load', () => {
      // Mock token validation
      cy.intercept('GET', `/api/auth/validate-reset-token?token=${resetToken}`, {
        statusCode: 200,
        body: {
          success: true,
          email: testUser.email,
          name: testUser.name
        }
      }).as('validateToken');

      cy.reload();
      cy.wait('@validateToken');

      // Should display user info
      cy.get('[data-cy="user-email"]').should('contain', testUser.email);
    });

    it('should handle invalid token', () => {
      // Mock invalid token response
      cy.intercept('GET', '/api/auth/validate-reset-token*', {
        statusCode: 400,
        body: { error: 'Token inválido ou expirado' }
      }).as('invalidToken');

      cy.visit('/reset-password.html?token=invalid-token');
      cy.wait('@invalidToken');

      // Should show error message
      cy.get('[data-cy="token-error"]').should('be.visible');
      cy.get('[data-cy="token-error"]').should('contain', 'Token inválido');
      
      // Should show link to request new token
      cy.get('[data-cy="request-new-token"]').should('be.visible');
    });

    it('should validate password requirements', () => {
      // Test weak password
      cy.get('[data-cy="new-password-input"]').type('weak');
      cy.get('[data-cy="password-strength"]').should('contain', 'Fraca');
      cy.get('[data-cy="password-requirements"]').should('be.visible');

      // Test medium password
      cy.get('[data-cy="new-password-input"]').clear().type('Medium123');
      cy.get('[data-cy="password-strength"]').should('contain', 'Média');

      // Test strong password
      cy.get('[data-cy="new-password-input"]').clear().type('Strong123!@#');
      cy.get('[data-cy="password-strength"]').should('contain', 'Forte');
      cy.get('[data-cy="password-strength"]').should('have.class', 'strength-strong');
    });

    it('should validate password confirmation', () => {
      // Type new password
      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      
      // Type different confirmation
      cy.get('[data-cy="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-cy="submit-button"]').click();
      
      // Should show error
      cy.get('[data-cy="error-message"]').should('contain', 'As senhas não coincidem');

      // Fix confirmation
      cy.get('[data-cy="confirm-password-input"]').clear().type(testUser.newPassword);
      cy.get('[data-cy="error-message"]').should('not.exist');
    });

    it('should show/hide password', () => {
      // Type password
      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      
      // Password should be hidden by default
      cy.get('[data-cy="new-password-input"]').should('have.attr', 'type', 'password');
      
      // Click toggle to show
      cy.get('[data-cy="toggle-password"]').click();
      cy.get('[data-cy="new-password-input"]').should('have.attr', 'type', 'text');
      
      // Click again to hide
      cy.get('[data-cy="toggle-password"]').click();
      cy.get('[data-cy="new-password-input"]').should('have.attr', 'type', 'password');
    });

    it('should successfully reset password', () => {
      // Mock successful password reset
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Senha redefinida com sucesso'
        }
      }).as('resetPasswordSuccess');

      // Fill form
      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="confirm-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="submit-button"]').click();

      cy.wait('@resetPasswordSuccess');

      // Should show success message
      cy.get('[data-cy="success-message"]').should('be.visible');
      cy.get('[data-cy="success-message"]').should('contain', 'Senha redefinida');
      
      // Should show redirect countdown
      cy.get('[data-cy="redirect-countdown"]').should('be.visible');
      
      // Should redirect to login after countdown
      cy.wait(3000);
      cy.url().should('include', 'index.html');
    });

    it('should handle server errors', () => {
      // Mock server error
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      }).as('resetPasswordError');

      // Fill form
      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="confirm-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="submit-button"]').click();

      cy.wait('@resetPasswordError');

      // Should show error message
      cy.get('[data-cy="error-message"]').should('contain', 'Erro ao redefinir senha');
      
      // Form should still be visible for retry
      cy.get('[data-cy="new-password-input"]').should('be.visible');
    });
  });

  describe('Email Flow Integration', () => {
    it('should complete full password reset flow', () => {
      // Step 1: Request password reset
      cy.visit('/forgot-password.html');
      
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { 
          success: true,
          message: 'E-mail enviado',
          resetToken: resetToken // In real scenario, this would be sent via email
        }
      }).as('requestReset');

      cy.get('[data-cy="email-input"]').type(testUser.email);
      cy.get('[data-cy="submit-button"]').click();
      cy.wait('@requestReset');

      // Step 2: Simulate clicking email link
      cy.visit(`/reset-password.html?token=${resetToken}`);

      // Step 3: Validate token
      cy.intercept('GET', `/api/auth/validate-reset-token?token=${resetToken}`, {
        statusCode: 200,
        body: {
          success: true,
          email: testUser.email
        }
      }).as('validateToken');

      cy.wait('@validateToken');

      // Step 4: Reset password
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { success: true }
      }).as('resetPassword');

      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="confirm-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="submit-button"]').click();
      cy.wait('@resetPassword');

      // Step 5: Try logging in with new password
      cy.visit('/index.html');
      cy.login(testUser.email, testUser.newPassword);
      
      // Should be logged in successfully
      cy.get('[data-cy="user-menu"]').should('be.visible');
    });
  });

  describe('Security Features', () => {
    it('should expire token after use', () => {
      // First reset attempt
      cy.visit(`/reset-password.html?token=${resetToken}`);
      
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { success: true }
      }).as('firstReset');

      cy.get('[data-cy="new-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="confirm-password-input"]').type(testUser.newPassword);
      cy.get('[data-cy="submit-button"]').click();
      cy.wait('@firstReset');

      // Try to use same token again
      cy.visit(`/reset-password.html?token=${resetToken}`);
      
      cy.intercept('GET', `/api/auth/validate-reset-token?token=${resetToken}`, {
        statusCode: 400,
        body: { error: 'Token já utilizado' }
      }).as('expiredToken');

      cy.wait('@expiredToken');
      cy.get('[data-cy="token-error"]').should('contain', 'Token já utilizado');
    });

    it('should enforce password complexity', () => {
      cy.visit(`/reset-password.html?token=${resetToken}`);

      // Test various weak passwords
      const weakPasswords = [
        { password: '123456', error: 'Senha muito fraca' },
        { password: 'password', error: 'Senha comum' },
        { password: 'Password', error: 'Adicione números' },
        { password: 'Pass123', error: 'Mínimo 8 caracteres' }
      ];

      weakPasswords.forEach(({ password, error }) => {
        cy.get('[data-cy="new-password-input"]').clear().type(password);
        cy.get('[data-cy="confirm-password-input"]').clear().type(password);
        cy.get('[data-cy="submit-button"]').click();
        cy.get('[data-cy="error-message"]').should('contain', error);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should be responsive on mobile devices', () => {
      // Test forgot password page
      cy.visit('/forgot-password.html');
      cy.get('.container').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      
      // Container should adapt to mobile width
      cy.get('.container').should('have.css', 'max-width').and('match', /\d+px/);
      
      // Test reset password page
      cy.visit(`/reset-password.html?token=${resetToken}`);
      cy.get('.container').should('be.visible');
      
      // Form inputs should be full width on mobile
      cy.get('[data-cy="new-password-input"]').should('have.css', 'width').and('match', /\d+px/);
    });

    it('should have touch-friendly elements', () => {
      cy.visit('/forgot-password.html');
      
      // Buttons should have adequate height for touch
      cy.get('[data-cy="submit-button"]')
        .should('have.css', 'min-height')
        .and('match', /4[0-9]px|5[0-9]px/); // At least 40px height
      
      // Input fields should have adequate padding
      cy.get('[data-cy="email-input"]')
        .should('have.css', 'padding')
        .and('match', /1[0-9]px/); // At least 10px padding
    });
  });
});