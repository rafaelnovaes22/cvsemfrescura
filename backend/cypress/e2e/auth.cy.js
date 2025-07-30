describe('Authentication Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `e2e.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  describe('User Registration', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should display registration form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="phone"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Nome é obrigatório').should('be.visible');
      cy.contains('Email é obrigatório').should('be.visible');
      cy.contains('Senha é obrigatória').should('be.visible');
    });

    it('should show validation error for invalid email', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.contains('Email inválido').should('be.visible');
    });

    it('should show validation error for weak password', () => {
      cy.get('input[name="password"]').type('weak');
      cy.get('button[type="submit"]').click();
      cy.contains('Senha deve ter pelo menos').should('be.visible');
    });

    it('should successfully register a new user', () => {
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="phone"]').type(testUser.phone);
      
      cy.get('button[type="submit"]').click();
      
      // Should redirect to login or dashboard
      cy.url().should('not.include', '/register');
      cy.contains('Cadastro realizado com sucesso').should('be.visible');
    });

    it('should show error for duplicate email', () => {
      // First, register the user via API
      cy.register(testUser);
      
      // Try to register again with same email
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="phone"]').type(testUser.phone);
      
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email já cadastrado').should('be.visible');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Register a user before each login test
      cy.register(testUser);
      cy.visit('/login');
    });

    it('should display login form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Email é obrigatório').should('be.visible');
      cy.contains('Senha é obrigatória').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type('WrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email ou senha incorretos').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains(testUser.name).should('be.visible');
      
      // Check if auth token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
        expect(win.localStorage.getItem('userId')).to.exist;
      });
    });

    it('should redirect to requested page after login', () => {
      // Try to access protected route
      cy.visit('/create-cv');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Login
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect back to create-cv
      cy.url().should('include', '/create-cv');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      // Register and login before each test
      cy.register(testUser);
      cy.login(testUser.email, testUser.password);
      cy.visit('/dashboard');
    });

    it('should display logout button when logged in', () => {
      cy.get('button[data-cy="logout-button"]').should('be.visible');
    });

    it('should successfully logout user', () => {
      cy.get('button[data-cy="logout-button"]').click();
      
      // Should redirect to home or login
      cy.url().should('not.include', '/dashboard');
      
      // Check if auth token is removed
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
        expect(win.localStorage.getItem('userId')).to.be.null;
      });
    });

    it('should not allow access to protected routes after logout', () => {
      cy.get('button[data-cy="logout-button"]').click();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.register(testUser);
      cy.visit('/forgot-password');
    });

    it('should display password reset form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation error for empty email', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Email é obrigatório').should('be.visible');
    });

    it('should send password reset email', () => {
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email de recuperação enviado').should('be.visible');
    });

    it('should handle non-existent email gracefully', () => {
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should still show success message for security
      cy.contains('Email de recuperação enviado').should('be.visible');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.register(testUser);
      cy.login(testUser.email, testUser.password);
    });

    it('should maintain session on page refresh', () => {
      cy.visit('/dashboard');
      cy.contains(testUser.name).should('be.visible');
      
      // Refresh the page
      cy.reload();
      
      // Should still be logged in
      cy.contains(testUser.name).should('be.visible');
      cy.url().should('include', '/dashboard');
    });

    it('should handle expired token gracefully', () => {
      // Set an expired token
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'expired-token');
      });
      
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.contains('Sessão expirada').should('be.visible');
    });
  });
});