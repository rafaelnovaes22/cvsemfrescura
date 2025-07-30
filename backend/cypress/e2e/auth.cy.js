describe('Authentication Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `e2e.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  describe('User Registration through Login Page', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should display login form with option to register', () => {
      cy.get('form').should('be.visible');
      cy.contains('Não tem uma conta?').should('be.visible');
      cy.contains('Cadastre-se').should('be.visible');
    });

    it('should switch to registration form when clicking register', () => {
      cy.contains('Cadastre-se').click();
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="phone"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.contains('Cadastre-se').click();
      cy.get('button[type="submit"]').click();
      cy.contains('obrigatório').should('be.visible');
    });

    it('should show validation error for invalid email', () => {
      cy.contains('Cadastre-se').click();
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.contains('inválido').should('be.visible');
    });

    it('should show validation error for weak password', () => {
      cy.contains('Cadastre-se').click();
      cy.get('input[name="password"]').type('weak');
      cy.get('button[type="submit"]').click();
      cy.contains('Senha deve ter pelo menos').should('be.visible');
    });

    it('should successfully register a new user', () => {
      cy.contains('Cadastre-se').click();
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="phone"]').type(testUser.phone);
      
      cy.get('button[type="submit"]').click();
      
      // Should show success message or redirect
      cy.url().should('not.contain', '/login');
    });

    it('should show error for duplicate email', () => {
      // First register the user
      cy.register(testUser);
      
      // Try to register again with same email
      cy.visit('/login');
      cy.contains('Cadastre-se').click();
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="phone"]').type(testUser.phone);
      
      cy.get('button[type="submit"]').click();
      cy.contains('já cadastrado').should('be.visible');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Register a user first
      cy.register();
      cy.visit('/login');
    });

    it('should display login form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Credenciais inválidas').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.get('input[name="email"]').type(Cypress.env('testEmail'));
      cy.get('input[name="password"]').type(Cypress.env('testPassword'));
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('not.contain', '/login');
      cy.contains('Dashboard').should('be.visible');
    });

    it('should show password visibility toggle', () => {
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      cy.get('[data-cy="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    });

    it('should remember user with "Remember me" checkbox', () => {
      cy.get('input[type="checkbox"]').check();
      cy.get('input[name="email"]').type(Cypress.env('testEmail'));
      cy.get('input[name="password"]').type(Cypress.env('testPassword'));
      cy.get('button[type="submit"]').click();
      
      // Clear session storage but not local storage
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });
      
      cy.reload();
      // Should still be logged in
      cy.url().should('not.contain', '/login');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/dashboard');
    });

    it('should display logout button when logged in', () => {
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });

    it('should successfully logout', () => {
      cy.get('[data-cy="logout-button"]').click();
      cy.url().should('contain', '/login');
      cy.get('input[name="email"]').should('be.visible');
    });

    it('should clear auth token on logout', () => {
      cy.get('[data-cy="logout-button"]').click();
      
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
        expect(win.sessionStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.register();
      cy.visit('/login');
    });

    it('should display password reset form', () => {
      cy.contains('Esqueceu sua senha?').click();
      cy.get('input[name="email"]').should('be.visible');
      cy.contains('Enviar link de recuperação').should('be.visible');
    });

    it('should show validation error for empty email', () => {
      cy.contains('Esqueceu sua senha?').click();
      cy.contains('Enviar link de recuperação').click();
      cy.contains('Email é obrigatório').should('be.visible');
    });

    it('should show validation error for invalid email', () => {
      cy.contains('Esqueceu sua senha?').click();
      cy.get('input[name="email"]').type('invalid-email');
      cy.contains('Enviar link de recuperação').click();
      cy.contains('Email inválido').should('be.visible');
    });

    it('should successfully request password reset', () => {
      cy.contains('Esqueceu sua senha?').click();
      cy.get('input[name="email"]').type(Cypress.env('testEmail'));
      cy.contains('Enviar link de recuperação').click();
      
      cy.contains('Link de recuperação enviado').should('be.visible');
    });

    it('should show error for non-existent email', () => {
      cy.contains('Esqueceu sua senha?').click();
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.contains('Enviar link de recuperação').click();
      
      cy.contains('Email não encontrado').should('be.visible');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should maintain session on page refresh', () => {
      cy.visit('/dashboard');
      cy.reload();
      cy.url().should('not.contain', '/login');
      cy.contains('Dashboard').should('be.visible');
    });

    it('should redirect to login when token expires', () => {
      // Simulate token expiration
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'expired-token');
      });
      
      cy.visit('/dashboard');
      cy.url().should('contain', '/login');
    });

    it('should handle concurrent sessions', () => {
      // Login in another tab (simulated)
      cy.window().then((win) => {
        const newToken = 'new-session-token';
        win.localStorage.setItem('authToken', newToken);
      });
      
      // Current session should be updated
      cy.reload();
      cy.url().should('not.contain', '/login');
    });

    it('should clear session on browser close (session storage)', () => {
      // Use session storage for non-remembered login
      cy.window().then((win) => {
        win.sessionStorage.setItem('authToken', 'session-token');
        win.localStorage.removeItem('authToken');
      });
      
      // Simulate browser close by clearing session storage
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });
      
      cy.reload();
      cy.url().should('contain', '/login');
    });
  });
});