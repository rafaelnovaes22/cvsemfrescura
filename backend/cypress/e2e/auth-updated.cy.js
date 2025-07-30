describe('Authentication Flow - Modal Based', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `e2e.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  describe('User Registration through Modal', () => {
    beforeEach(() => {
      cy.visit('/analisar.html?login=true');
      // Aguarda o modal aparecer
      cy.get('#authModal', { timeout: 10000 }).should('be.visible');
    });

    it('should display login modal with option to register', () => {
      cy.get('#authModal').should('be.visible');
      cy.get('#loginForm').should('be.visible');
      cy.contains('Não tem uma conta?').should('be.visible');
      cy.contains('Cadastre-se').should('be.visible');
    });

    it('should switch to registration form when clicking register', () => {
      cy.contains('Cadastre-se').click();
      cy.get('#registerForm').should('be.visible');
      cy.get('#loginForm').should('not.be.visible');
      cy.get('#authModalTitle').should('contain', 'Cadastrar');
    });

    it('should register a new user successfully', () => {
      // Mudar para formulário de registro
      cy.contains('Cadastre-se').click();
      
      // Preencher formulário
      cy.get('#registerForm input[name="name"]').type(testUser.name);
      cy.get('#registerForm input[name="email"]').type(testUser.email);
      cy.get('#registerForm input[name="password"]').type(testUser.password);
      cy.get('#registerForm input[name="phone"]').type(testUser.phone);
      
      // Submeter
      cy.get('#registerForm button[type="submit"]').click();
      
      // Verificar sucesso
      cy.get('#authModal').should('not.be.visible');
      cy.contains('Cadastro realizado').should('be.visible');
    });
  });

  describe('User Login through Modal', () => {
    beforeEach(() => {
      // Registrar usuário primeiro
      cy.register(testUser);
      cy.visit('/analisar.html?login=true');
      cy.get('#authModal', { timeout: 10000 }).should('be.visible');
    });

    it('should display login form in modal', () => {
      cy.get('#loginForm').should('be.visible');
      cy.get('#loginForm input[name="email"]').should('be.visible');
      cy.get('#loginForm input[name="password"]').should('be.visible');
      cy.get('#loginForm button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('#loginForm input[name="email"]').type('wrong@example.com');
      cy.get('#loginForm input[name="password"]').type('wrongpassword');
      cy.get('#loginForm button[type="submit"]').click();
      
      cy.contains('inválid').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.get('#loginForm input[name="email"]').type(testUser.email);
      cy.get('#loginForm input[name="password"]').type(testUser.password);
      cy.get('#loginForm button[type="submit"]').click();
      
      // Modal deve fechar
      cy.get('#authModal').should('not.be.visible');
      
      // Deve estar autenticado
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
      });
    });

    it('should close modal when clicking X button', () => {
      cy.get('#closeAuthModal').click();
      cy.get('#authModal').should('not.be.visible');
    });

    it('should close modal when clicking outside', () => {
      cy.get('#authModal').click('topLeft');
      cy.get('#authModal').should('not.be.visible');
    });
  });

  describe('Password Reset through Modal', () => {
    beforeEach(() => {
      cy.register(testUser);
      cy.visit('/analisar.html?login=true');
      cy.get('#authModal', { timeout: 10000 }).should('be.visible');
    });

    it('should show forgot password option', () => {
      cy.contains('Esqueceu sua senha?').should('be.visible');
    });

    it('should navigate to password reset when clicking forgot password', () => {
      cy.contains('Esqueceu sua senha?').click();
      // Verifica se redireciona ou mostra formulário de reset
      cy.url().should('include', 'reset-password');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.register(testUser);
    });

    it('should maintain session after login', () => {
      cy.visit('/analisar.html?login=true');
      cy.get('#authModal').should('be.visible');
      
      // Login
      cy.get('#loginForm input[name="email"]').type(testUser.email);
      cy.get('#loginForm input[name="password"]').type(testUser.password);
      cy.get('#loginForm button[type="submit"]').click();
      
      // Recarregar página
      cy.reload();
      
      // Não deve mostrar modal de login novamente
      cy.get('#authModal').should('not.exist');
    });

    it('should redirect to login when accessing without auth', () => {
      // Limpar autenticação
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
      
      cy.visit('/analisar.html');
      
      // Deve mostrar modal de login após um tempo
      cy.get('#authModal', { timeout: 10000 }).should('be.visible');
    });
  });
});