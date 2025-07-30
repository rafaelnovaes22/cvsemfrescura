describe('Admin Flow', () => {
  let adminToken;
  let userToken;
  
  const adminUser = {
    email: 'admin@cvsemfrescura.com',
    password: 'AdminPassword123!'
  };
  
  const regularUser = {
    name: 'Regular Test User',
    email: `regular.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  before(() => {
    // Fazer login como admin
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, adminUser)
      .then((response) => {
        adminToken = response.body.token;
      });
      
    // Criar e fazer login de usuário regular
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, regularUser)
      .then(() => {
        return cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
          email: regularUser.email,
          password: regularUser.password
        });
      })
      .then((response) => {
        userToken = response.body.token;
      });
  });

  describe('Admin Access Control', () => {
    it('should deny access to admin page for non-authenticated users', () => {
      cy.visit('/admin.html');
      cy.url().should('include', '/index.html');
    });

    it('should deny access to admin page for regular users', () => {
      localStorage.setItem('token', userToken);
      localStorage.setItem('userEmail', regularUser.email);
      cy.visit('/admin.html');
      cy.contains('Acesso negado').should('be.visible');
    });

    it('should allow access to admin page for admin users', () => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.url().should('include', '/admin.html');
      cy.contains('Painel Administrativo').should('be.visible');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
    });

    it('should display dashboard statistics', () => {
      cy.get('#totalUsers').should('be.visible');
      cy.get('#totalAnalyses').should('be.visible');
      cy.get('#activeUsers').should('be.visible');
      cy.get('#revenue').should('be.visible');
      
      // Verificar gráficos
      cy.get('#userGrowthChart').should('be.visible');
      cy.get('#analysisChart').should('be.visible');
      cy.get('#revenueChart').should('be.visible');
    });

    it('should display navigation tabs', () => {
      cy.get('.nav-tabs').should('be.visible');
      cy.get('[data-tab="dashboard"]').should('be.visible');
      cy.get('[data-tab="users"]').should('be.visible');
      cy.get('[data-tab="analyses"]').should('be.visible');
      cy.get('[data-tab="gift-codes"]').should('be.visible');
      cy.get('[data-tab="settings"]').should('be.visible');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="users"]').click();
    });

    it('should display users list', () => {
      cy.get('#usersTable').should('be.visible');
      cy.get('#usersTable tbody tr').should('have.length.at.least', 1);
    });

    it('should search users', () => {
      cy.get('#userSearch').type(regularUser.email);
      cy.get('#usersTable tbody tr').should('have.length', 1);
      cy.get('#usersTable').should('contain', regularUser.email);
    });

    it('should filter users by status', () => {
      cy.get('#userStatusFilter').select('active');
      cy.get('#usersTable tbody tr').each(($row) => {
        cy.wrap($row).find('.status-badge').should('contain', 'Ativo');
      });
    });

    it('should view user details', () => {
      cy.get('#usersTable tbody tr').first().find('.view-user-btn').click();
      cy.get('#userDetailsModal').should('be.visible');
      cy.get('#userDetailsModal').should('contain', 'Detalhes do Usuário');
    });

    it('should edit user', () => {
      cy.get('#usersTable tbody tr').first().find('.edit-user-btn').click();
      cy.get('#editUserModal').should('be.visible');
      
      // Alterar status do usuário
      cy.get('#editUserStatus').select('suspended');
      cy.get('#saveUserBtn').click();
      
      cy.contains('Usuário atualizado com sucesso').should('be.visible');
    });

    it('should export users list', () => {
      cy.get('#exportUsersBtn').click();
      cy.contains('Exportando usuários').should('be.visible');
    });
  });

  describe('Analysis Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="analyses"]').click();
    });

    it('should display analyses list', () => {
      cy.get('#analysesTable').should('be.visible');
    });

    it('should filter analyses by date', () => {
      const today = new Date().toISOString().split('T')[0];
      cy.get('#analysisDateFrom').type(today);
      cy.get('#analysisDateTo').type(today);
      cy.get('#filterAnalysesBtn').click();
      
      // Verificar se as análises são do dia atual
      cy.get('#analysesTable tbody tr').each(($row) => {
        cy.wrap($row).find('.analysis-date').should('contain', today);
      });
    });

    it('should view analysis details', () => {
      cy.get('#analysesTable tbody tr').first().find('.view-analysis-btn').click();
      cy.get('#analysisDetailsModal').should('be.visible');
    });

    it('should delete analysis', () => {
      cy.get('#analysesTable tbody tr').first().find('.delete-analysis-btn').click();
      cy.get('#confirmDeleteModal').should('be.visible');
      cy.get('#confirmDeleteBtn').click();
      cy.contains('Análise excluída com sucesso').should('be.visible');
    });
  });

  describe('Gift Code Management', () => {
    const newGiftCode = {
      code: `TEST-${Date.now()}`,
      value: 50,
      maxUses: 10,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="gift-codes"]').click();
    });

    it('should display gift codes list', () => {
      cy.get('#giftCodesTable').should('be.visible');
    });

    it('should create new gift code', () => {
      cy.get('#createGiftCodeBtn').click();
      cy.get('#createGiftCodeModal').should('be.visible');
      
      cy.get('#giftCodeInput').type(newGiftCode.code);
      cy.get('#giftCodeValue').type(newGiftCode.value.toString());
      cy.get('#giftCodeMaxUses').type(newGiftCode.maxUses.toString());
      cy.get('#giftCodeExpiry').type(newGiftCode.expiresAt);
      
      cy.get('#saveGiftCodeBtn').click();
      cy.contains('Código criado com sucesso').should('be.visible');
      cy.get('#giftCodesTable').should('contain', newGiftCode.code);
    });

    it('should search gift codes', () => {
      cy.get('#giftCodeSearch').type(newGiftCode.code);
      cy.get('#giftCodesTable tbody tr').should('have.length', 1);
      cy.get('#giftCodesTable').should('contain', newGiftCode.code);
    });

    it('should view gift code usage', () => {
      cy.get('#giftCodesTable tbody tr').first().find('.view-usage-btn').click();
      cy.get('#giftCodeUsageModal').should('be.visible');
      cy.get('#giftCodeUsageModal').should('contain', 'Uso do Código');
    });

    it('should deactivate gift code', () => {
      cy.get('#giftCodesTable tbody tr').first().find('.deactivate-code-btn').click();
      cy.contains('Código desativado com sucesso').should('be.visible');
    });
  });

  describe('System Settings', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="settings"]').click();
    });

    it('should display system settings', () => {
      cy.get('#settingsForm').should('be.visible');
      cy.get('#maintenanceMode').should('be.visible');
      cy.get('#registrationEnabled').should('be.visible');
      cy.get('#emailNotifications').should('be.visible');
    });

    it('should update system settings', () => {
      // Ativar modo de manutenção
      cy.get('#maintenanceMode').check();
      cy.get('#saveSettingsBtn').click();
      cy.contains('Configurações salvas com sucesso').should('be.visible');
      
      // Desativar modo de manutenção
      cy.get('#maintenanceMode').uncheck();
      cy.get('#saveSettingsBtn').click();
    });

    it('should display API limits configuration', () => {
      cy.get('#apiRateLimit').should('be.visible');
      cy.get('#maxAnalysesPerDay').should('be.visible');
      cy.get('#maxFileSize').should('be.visible');
    });

    it('should update API limits', () => {
      cy.get('#apiRateLimit').clear().type('100');
      cy.get('#maxAnalysesPerDay').clear().type('50');
      cy.get('#saveApiLimitsBtn').click();
      cy.contains('Limites atualizados com sucesso').should('be.visible');
    });
  });

  describe('Admin Reports', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="reports"]').click();
    });

    it('should generate user activity report', () => {
      cy.get('#reportType').select('user-activity');
      cy.get('#reportDateFrom').type('2024-01-01');
      cy.get('#reportDateTo').type('2024-12-31');
      cy.get('#generateReportBtn').click();
      
      cy.contains('Gerando relatório').should('be.visible');
      cy.get('#reportResults', { timeout: 10000 }).should('be.visible');
    });

    it('should generate revenue report', () => {
      cy.get('#reportType').select('revenue');
      cy.get('#reportDateFrom').type('2024-01-01');
      cy.get('#reportDateTo').type('2024-12-31');
      cy.get('#generateReportBtn').click();
      
      cy.contains('Gerando relatório').should('be.visible');
      cy.get('#reportResults', { timeout: 10000 }).should('be.visible');
    });

    it('should export report', () => {
      cy.get('#reportType').select('user-activity');
      cy.get('#generateReportBtn').click();
      cy.wait(2000);
      
      cy.get('#exportReportBtn').click();
      cy.get('#exportFormat').select('pdf');
      cy.get('#confirmExportBtn').click();
      cy.contains('Exportando relatório').should('be.visible');
    });
  });

  describe('Admin Activity Log', () => {
    beforeEach(() => {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('isAdmin', 'true');
      cy.visit('/admin.html');
      cy.get('[data-tab="logs"]').click();
    });

    it('should display activity logs', () => {
      cy.get('#activityLogsTable').should('be.visible');
      cy.get('#activityLogsTable tbody tr').should('have.length.at.least', 1);
    });

    it('should filter logs by action type', () => {
      cy.get('#logActionFilter').select('user-update');
      cy.get('#filterLogsBtn').click();
      
      cy.get('#activityLogsTable tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'Atualização de usuário');
      });
    });

    it('should search logs', () => {
      cy.get('#logSearch').type(adminUser.email);
      cy.get('#activityLogsTable tbody tr').each(($row) => {
        cy.wrap($row).should('contain', adminUser.email);
      });
    });
  });

  after(() => {
    // Limpar dados de teste
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/test/cleanup`,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: { email: regularUser.email }
    });
  });
});