describe('Password Recovery Flow', () => {
  const testUser = {
    name: 'Password Recovery Test User',
    email: `password.recovery.${Date.now()}@example.com`,
    password: 'OldPassword123!',
    newPassword: 'NewPassword123!',
    phone: '11987654321'
  };
  
  let resetToken;

  before(() => {
    // Registrar usuário de teste
    cy.request('POST', `${Cypress.env('apiUrl')}/user/register`, testUser);
  });

  describe('Forgot Password Page', () => {
    beforeEach(() => {
      cy.visit('/forgot-password.html');
    });

    it('should display forgot password form', () => {
      cy.get('h1').contains('Esqueci minha senha').should('be.visible');
      cy.get('#forgotPasswordForm').should('be.visible');
      cy.get('#emailInput').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      cy.contains('Voltar ao login').should('be.visible');
    });

    it('should validate email field', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Email é obrigatório').should('be.visible');
      
      cy.get('#emailInput').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.contains('Email inválido').should('be.visible');
    });

    it('should show error for non-existent email', () => {
      cy.get('#emailInput').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email não encontrado').should('be.visible');
    });

    it('should successfully request password reset', () => {
      cy.get('#emailInput').type(testUser.email);
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email enviado com sucesso').should('be.visible');
      cy.contains('Verifique sua caixa de entrada').should('be.visible');
      cy.get('#successMessage').should('be.visible');
    });

    it('should show rate limit message for multiple requests', () => {
      // Primeira solicitação
      cy.get('#emailInput').type(testUser.email);
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
      
      // Segunda solicitação muito rápida
      cy.visit('/forgot-password.html');
      cy.get('#emailInput').type(testUser.email);
      cy.get('button[type="submit"]').click();
      
      cy.contains('Aguarde antes de solicitar novamente').should('be.visible');
    });

    it('should navigate back to login', () => {
      cy.get('a').contains('Voltar ao login').click();
      cy.url().should('include', '/index.html');
    });
  });

  describe('Reset Password Page', () => {
    before(() => {
      // Simular obtenção do token de reset
      cy.request('POST', `${Cypress.env('apiUrl')}/password-reset/forgot-password`, {
        email: testUser.email
      }).then((response) => {
        // Em um ambiente real, o token viria por email
        // Aqui vamos simular obtendo diretamente da API de teste
        cy.request('GET', `${Cypress.env('apiUrl')}/test/reset-token`, {
          email: testUser.email
        }).then((tokenResponse) => {
          resetToken = tokenResponse.body.token;
        });
      });
    });

    beforeEach(() => {
      cy.visit(`/reset-password.html?token=${resetToken}`);
    });

    it('should display reset password form', () => {
      cy.get('h1').contains('Redefinir Senha').should('be.visible');
      cy.get('#resetPasswordForm').should('be.visible');
      cy.get('#newPassword').should('be.visible');
      cy.get('#confirmPassword').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid token', () => {
      cy.visit('/reset-password.html?token=invalid-token-123');
      cy.contains('Token inválido ou expirado').should('be.visible');
    });

    it('should show error for missing token', () => {
      cy.visit('/reset-password.html');
      cy.contains('Token não fornecido').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.get('#newPassword').type('weak');
      cy.get('button[type="submit"]').click();
      cy.contains('Senha deve ter pelo menos 8 caracteres').should('be.visible');
      
      cy.get('#newPassword').clear().type('12345678');
      cy.get('button[type="submit"]').click();
      cy.contains('Senha deve conter letras maiúsculas').should('be.visible');
      
      cy.get('#newPassword').clear().type('Abcd1234');
      cy.get('button[type="submit"]').click();
      cy.contains('Senha deve conter caracteres especiais').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.get('#newPassword').type(testUser.newPassword);
      cy.get('#confirmPassword').type('DifferentPassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.contains('As senhas não coincidem').should('be.visible');
    });

    it('should show password strength indicator', () => {
      cy.get('#passwordStrength').should('not.be.visible');
      
      cy.get('#newPassword').type('weak');
      cy.get('#passwordStrength').should('be.visible');
      cy.get('#passwordStrength').should('have.class', 'weak');
      
      cy.get('#newPassword').clear().type('Medium123');
      cy.get('#passwordStrength').should('have.class', 'medium');
      
      cy.get('#newPassword').clear().type(testUser.newPassword);
      cy.get('#passwordStrength').should('have.class', 'strong');
    });

    it('should toggle password visibility', () => {
      cy.get('#newPassword').should('have.attr', 'type', 'password');
      cy.get('#toggleNewPassword').click();
      cy.get('#newPassword').should('have.attr', 'type', 'text');
      cy.get('#toggleNewPassword').click();
      cy.get('#newPassword').should('have.attr', 'type', 'password');
      
      cy.get('#confirmPassword').should('have.attr', 'type', 'password');
      cy.get('#toggleConfirmPassword').click();
      cy.get('#confirmPassword').should('have.attr', 'type', 'text');
    });

    it('should successfully reset password', () => {
      cy.get('#newPassword').type(testUser.newPassword);
      cy.get('#confirmPassword').type(testUser.newPassword);
      cy.get('button[type="submit"]').click();
      
      cy.contains('Senha redefinida com sucesso').should('be.visible');
      cy.contains('Redirecionando para o login').should('be.visible');
      
      // Verificar redirecionamento
      cy.wait(3000);
      cy.url().should('include', '/index.html');
    });

    it('should prevent reuse of reset token', () => {
      cy.visit(`/reset-password.html?token=${resetToken}`);
      cy.contains('Token inválido ou expirado').should('be.visible');
    });
  });

  describe('Login with New Password', () => {
    it('should fail login with old password', () => {
      cy.visit('/index.html');
      cy.get('#loginEmail').type(testUser.email);
      cy.get('#loginPassword').type(testUser.password);
      cy.get('#loginForm button[type="submit"]').click();
      
      cy.contains('Credenciais inválidas').should('be.visible');
    });

    it('should successfully login with new password', () => {
      cy.visit('/index.html');
      cy.get('#loginEmail').type(testUser.email);
      cy.get('#loginPassword').type(testUser.newPassword);
      cy.get('#loginForm button[type="submit"]').click();
      
      cy.url().should('include', '/analisar.html');
    });
  });

  describe('Password Reset Email', () => {
    it('should include necessary information in reset email', () => {
      // Este teste verificaria o conteúdo do email em um ambiente real
      // Aqui vamos simular verificando a API de teste
      cy.request('GET', `${Cypress.env('apiUrl')}/test/last-email`, {
        to: testUser.email
      }).then((response) => {
        const email = response.body;
        
        expect(email.subject).to.include('Redefinição de Senha');
        expect(email.html).to.include('reset-password.html?token=');
        expect(email.html).to.include(testUser.name);
        expect(email.html).to.include('Este link expira em 1 hora');
      });
    });
  });

  describe('Security Features', () => {
    it('should expire reset token after time limit', () => {
      // Simular token expirado
      cy.request('POST', `${Cypress.env('apiUrl')}/test/expire-token`, {
        token: resetToken
      });
      
      cy.visit(`/reset-password.html?token=${resetToken}`);
      cy.contains('Token expirado').should('be.visible');
    });

    it('should log password reset activity', () => {
      // Verificar log de atividade
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/user/activity-log`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then((response) => {
        const activities = response.body;
        const resetActivity = activities.find(a => a.type === 'password_reset');
        
        expect(resetActivity).to.exist;
        expect(resetActivity.ip).to.exist;
        expect(resetActivity.userAgent).to.exist;
      });
    });

    it('should notify user of password change', () => {
      // Verificar notificação por email
      cy.request('GET', `${Cypress.env('apiUrl')}/test/last-email`, {
        to: testUser.email,
        subject: 'Senha Alterada'
      }).then((response) => {
        const email = response.body;
        
        expect(email).to.exist;
        expect(email.html).to.include('Sua senha foi alterada');
        expect(email.html).to.include('Se você não fez esta alteração');
      });
    });
  });

  describe('Password Recovery Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/forgot-password.html');
      cy.get('#emailInput').should('have.attr', 'aria-label');
      cy.get('#forgotPasswordForm').should('have.attr', 'aria-label');
      
      cy.visit(`/reset-password.html?token=test-token`);
      cy.get('#newPassword').should('have.attr', 'aria-label');
      cy.get('#confirmPassword').should('have.attr', 'aria-label');
    });

    it('should be keyboard navigable', () => {
      cy.visit('/forgot-password.html');
      cy.get('#emailInput').focus();
      cy.focused().should('have.id', 'emailInput');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('should announce form errors to screen readers', () => {
      cy.visit('/forgot-password.html');
      cy.get('button[type="submit"]').click();
      cy.get('[role="alert"]').should('exist');
      cy.get('[aria-live="polite"]').should('exist');
    });
  });

  describe('Mobile Experience', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should be responsive on mobile devices', () => {
      cy.visit('/forgot-password.html');
      cy.get('#forgotPasswordForm').should('be.visible');
      cy.get('#emailInput').should('be.visible');
      
      // Verificar que o formulário não está cortado
      cy.get('#forgotPasswordForm').should('be.within.viewport');
    });

    it('should show mobile-friendly keyboard for email', () => {
      cy.visit('/forgot-password.html');
      cy.get('#emailInput').should('have.attr', 'type', 'email');
      cy.get('#emailInput').should('have.attr', 'autocomplete', 'email');
    });
  });

  after(() => {
    // Limpar dados de teste
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/test/cleanup`,
      body: { email: testUser.email }
    });
  });
});