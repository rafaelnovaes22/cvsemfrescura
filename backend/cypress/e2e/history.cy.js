describe('History Flow', () => {
  let authToken;
  const testUser = {
    name: 'History Test User',
    email: `history.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  before(() => {
    // Registrar e fazer login do usuário de teste
    cy.request('POST', `${Cypress.env('apiUrl')}/user/register`, testUser)
      .then(() => {
        return cy.request('POST', `${Cypress.env('apiUrl')}/user/login`, {
          email: testUser.email,
          password: testUser.password
        });
      })
      .then((response) => {
        authToken = response.body.token;
        localStorage.setItem('token', authToken);
        localStorage.setItem('userEmail', testUser.email);
      });
  });

  describe('History Page Access', () => {
    it('should redirect to login if not authenticated', () => {
      cy.clearLocalStorage();
      cy.visit('/history.html');
      cy.url().should('include', '/index.html');
    });

    it('should access history page when authenticated', () => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      cy.visit('/history.html');
      cy.url().should('include', '/history.html');
    });
  });

  describe('History Page UI', () => {
    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      cy.visit('/history.html');
    });

    it('should display history page elements', () => {
      // Verificar elementos principais
      cy.get('h1').contains('Histórico de Análises').should('be.visible');
      cy.get('#analysisCount').should('be.visible');
      cy.get('#historyList').should('be.visible');
      
      // Verificar filtros
      cy.get('#searchInput').should('be.visible');
      cy.get('#statusFilter').should('be.visible');
      cy.get('#dateFilter').should('be.visible');
      cy.get('#sortBy').should('be.visible');
    });

    it('should display empty state when no analyses', () => {
      cy.get('#historyList').should('contain', 'Nenhuma análise encontrada');
    });
  });

  describe('History with Analyses', () => {
    const mockAnalysis = {
      jobTitle: 'Desenvolvedor Frontend',
      company: 'Tech Company',
      experienceLevel: 'Pleno',
      skills: ['React', 'TypeScript', 'Node.js'],
      description: 'Vaga para desenvolvedor frontend com experiência em React'
    };

    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      
      // Criar uma análise de teste
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/analyses`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: mockAnalysis
      }).then((response) => {
        cy.wrap(response.body.id).as('analysisId');
      });

      cy.visit('/history.html');
    });

    it('should display analysis in history', () => {
      cy.get('.history-item').should('have.length.at.least', 1);
      cy.get('.history-item').first().within(() => {
        cy.contains(mockAnalysis.jobTitle).should('be.visible');
        cy.contains(mockAnalysis.company).should('be.visible');
        cy.get('.status-badge').should('be.visible');
        cy.get('.view-btn').should('be.visible');
        cy.get('.download-btn').should('be.visible');
        cy.get('.delete-btn').should('be.visible');
      });
    });

    it('should filter analyses by search term', () => {
      cy.get('#searchInput').type(mockAnalysis.jobTitle);
      cy.get('.history-item').should('contain', mockAnalysis.jobTitle);
      
      cy.get('#searchInput').clear().type('NonExistentJob');
      cy.get('#historyList').should('contain', 'Nenhuma análise encontrada');
    });

    it('should filter analyses by status', () => {
      cy.get('#statusFilter').select('completed');
      cy.get('.history-item .status-badge').each(($badge) => {
        cy.wrap($badge).should('contain', 'Concluída');
      });
    });

    it('should sort analyses', () => {
      // Criar mais análises para testar ordenação
      const analyses = [
        { ...mockAnalysis, jobTitle: 'Backend Developer' },
        { ...mockAnalysis, jobTitle: 'DevOps Engineer' }
      ];

      cy.wrap(analyses).each((analysis) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/analyses`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: analysis
        });
      });

      cy.reload();
      cy.wait(1000);

      // Ordenar por data (mais recente primeiro)
      cy.get('#sortBy').select('date_desc');
      cy.get('.history-item').first().should('contain', 'DevOps Engineer');

      // Ordenar por título
      cy.get('#sortBy').select('title_asc');
      cy.get('.history-item').first().should('contain', 'Backend Developer');
    });

    it('should view analysis details', () => {
      cy.get('.history-item').first().find('.view-btn').click();
      cy.url().should('include', '/results.html');
      cy.url().should('include', 'id=');
    });

    it('should download analysis as PDF', () => {
      cy.get('.history-item').first().find('.download-btn').click();
      // Verificar se o download foi iniciado (Cypress não pode verificar downloads diretamente)
      cy.contains('Gerando PDF').should('be.visible');
    });

    it('should delete analysis', () => {
      cy.get('.history-item').first().find('.delete-btn').click();
      
      // Confirmar exclusão no modal
      cy.get('.modal').should('be.visible');
      cy.contains('Confirmar Exclusão').should('be.visible');
      cy.get('.confirm-delete-btn').click();
      
      // Verificar se a análise foi removida
      cy.contains('Análise excluída com sucesso').should('be.visible');
      cy.get('.history-item').should('have.length.lessThan', 3);
    });
  });

  describe('History Pagination', () => {
    before(() => {
      // Criar múltiplas análises para testar paginação
      const analyses = Array.from({ length: 15 }, (_, i) => ({
        jobTitle: `Test Job ${i + 1}`,
        company: 'Test Company',
        experienceLevel: 'Pleno',
        skills: ['Skill1', 'Skill2'],
        description: 'Test description'
      }));

      cy.wrap(analyses).each((analysis) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/analyses`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: analysis
        });
      });
    });

    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      cy.visit('/history.html');
    });

    it('should display pagination controls', () => {
      cy.get('.pagination').should('be.visible');
      cy.get('.page-item').should('have.length.at.least', 3);
    });

    it('should navigate between pages', () => {
      // Verificar primeira página
      cy.get('.history-item').should('have.length', 10);
      
      // Ir para segunda página
      cy.get('.pagination .page-item').contains('2').click();
      cy.get('.history-item').should('have.length.at.least', 5);
      
      // Voltar para primeira página
      cy.get('.pagination .page-item').contains('1').click();
      cy.get('.history-item').should('have.length', 10);
    });
  });

  describe('History Export', () => {
    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      cy.visit('/history.html');
    });

    it('should export history to CSV', () => {
      cy.get('#exportCsvBtn').click();
      cy.contains('Exportando histórico').should('be.visible');
    });

    it('should export history to JSON', () => {
      cy.get('#exportJsonBtn').click();
      cy.contains('Exportando histórico').should('be.visible');
    });
  });

  after(() => {
    // Limpar dados de teste
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/test/cleanup`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: { email: testUser.email }
    });
  });
});