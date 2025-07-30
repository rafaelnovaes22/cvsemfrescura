describe('History Page', () => {
  const testUser = {
    name: 'History Test User',
    email: `history.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  const mockTransactions = [
    {
      id: 1,
      date: new Date().toISOString(),
      type: 'purchase',
      amount: 29.90,
      credits: 1,
      status: 'completed',
      paymentMethod: 'credit_card',
      description: 'Plano Básico - 1 análise'
    },
    {
      id: 2,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'gift_code',
      credits: 3,
      status: 'completed',
      code: 'GIFT-TEST-CODE-123',
      description: 'Código presente - 3 análises'
    }
  ];

  const mockAnalyses = [
    {
      id: 1,
      date: new Date().toISOString(),
      fileName: 'cv-test-user.pdf',
      jobTitle: 'Desenvolvedor Full Stack',
      company: 'Tech Company',
      matchScore: 85,
      status: 'completed',
      jobsAnalyzed: 5
    },
    {
      id: 2,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'resume-updated.docx',
      jobTitle: 'Frontend Developer',
      company: 'Startup XYZ',
      matchScore: 92,
      status: 'completed',
      jobsAnalyzed: 3
    },
    {
      id: 3,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'old-cv.pdf',
      jobTitle: 'Software Engineer',
      company: 'Big Corp',
      matchScore: 78,
      status: 'completed',
      jobsAnalyzed: 1
    }
  ];

  beforeEach(() => {
    // Register and login
    cy.register(testUser);
    cy.login(testUser.email, testUser.password);
  });

  describe('Page Access and Navigation', () => {
    it('should require authentication to access history', () => {
      // Logout first
      cy.clearLocalStorage();
      
      // Try to access history page
      cy.visit('/history.html');
      
      // Should redirect to login or show alert
      cy.on('window:alert', (text) => {
        expect(text).to.contain('precisa estar logado');
      });
      
      cy.url().should('include', 'index.html');
    });

    it('should display history page for authenticated users', () => {
      cy.visit('/history.html');
      
      // Check page title
      cy.get('h1').contains('Histórico').should('be.visible');
      cy.get('.page-subtitle').contains('Confira o histórico').should('be.visible');
      
      // Check tabs
      cy.get('[data-cy="transactions-tab"]').should('be.visible');
      cy.get('[data-cy="analyses-tab"]').should('be.visible');
      
      // Check action buttons
      cy.get('a').contains('Comprar Mais Créditos').should('be.visible');
      cy.get('a').contains('Fazer Nova Análise').should('be.visible');
    });
  });

  describe('Transactions Tab', () => {
    beforeEach(() => {
      // Mock API response for transactions
      cy.intercept('GET', '/api/transactions/history', {
        statusCode: 200,
        body: {
          success: true,
          data: mockTransactions
        }
      }).as('getTransactions');

      cy.visit('/history.html');
      cy.wait('@getTransactions');
    });

    it('should display transactions by default', () => {
      // Transactions tab should be active
      cy.get('.tab-button').contains('Transações').should('have.class', 'active');
      cy.get('#transactions-content').should('be.visible');
      cy.get('#analyses-content').should('not.be.visible');
    });

    it('should show transaction history table', () => {
      // Check table headers
      cy.get('.transaction-table th').should('contain', 'Data');
      cy.get('.transaction-table th').should('contain', 'Descrição');
      cy.get('.transaction-table th').should('contain', 'Valor');
      cy.get('.transaction-table th').should('contain', 'Status');
    });

    it('should display all transactions', () => {
      // Check if all transactions are displayed
      cy.get('.transaction-table tbody tr').should('have.length', mockTransactions.length);
      
      // Check first transaction details
      cy.get('.transaction-table tbody tr').first().within(() => {
        cy.get('td').should('contain', 'Plano Básico');
        cy.get('td').should('contain', 'R$ 29,90');
        cy.get('.status-badge').should('contain', 'Concluído');
      });
    });

    it('should show empty state when no transactions', () => {
      // Mock empty response
      cy.intercept('GET', '/api/transactions/history', {
        statusCode: 200,
        body: {
          success: true,
          data: []
        }
      }).as('getEmptyTransactions');

      cy.reload();
      cy.wait('@getEmptyTransactions');

      // Should show empty state message
      cy.get('[data-cy="empty-transactions"]').should('be.visible');
      cy.get('[data-cy="empty-transactions"]').should('contain', 'Nenhuma transação encontrada');
    });

    it('should format transaction dates correctly', () => {
      cy.get('.transaction-date').first().then($date => {
        const dateText = $date.text();
        // Check if date is in Brazilian format (DD/MM/YYYY)
        expect(dateText).to.match(/\d{2}\/\d{2}\/\d{4}/);
      });
    });

    it('should format currency values correctly', () => {
      cy.get('.transaction-amount').each($amount => {
        const amountText = $amount.text();
        // Check if amount is in Brazilian currency format
        expect(amountText).to.match(/R\$\s*\d+,\d{2}/);
      });
    });

    it('should show different icons for different transaction types', () => {
      // Purchase transaction should have shopping cart icon
      cy.get('.transaction-table tbody tr').first()
        .find('.transaction-icon').should('contain', '🛒');
      
      // Gift code transaction should have gift icon
      cy.get('.transaction-table tbody tr').eq(1)
        .find('.transaction-icon').should('contain', '🎁');
    });
  });

  describe('Analyses Tab', () => {
    beforeEach(() => {
      // Mock API response for analyses
      cy.intercept('GET', '/api/analyses/history', {
        statusCode: 200,
        body: {
          success: true,
          data: mockAnalyses
        }
      }).as('getAnalyses');

      cy.visit('/history.html');
      
      // Switch to analyses tab
      cy.get('.tab-button').contains('Análises de Currículo').click();
      cy.wait('@getAnalyses');
    });

    it('should switch to analyses tab', () => {
      // Analyses tab should be active
      cy.get('.tab-button').contains('Análises').should('have.class', 'active');
      cy.get('#analyses-content').should('be.visible');
      cy.get('#transactions-content').should('not.be.visible');
    });

    it('should display analyses history table', () => {
      // Check table headers
      cy.get('.analysis-table th').should('contain', 'Data');
      cy.get('.analysis-table th').should('contain', 'Arquivo');
      cy.get('.analysis-table th').should('contain', 'Vaga');
      cy.get('.analysis-table th').should('contain', 'Compatibilidade');
      cy.get('.analysis-table th').should('contain', 'Ações');
    });

    it('should display all analyses', () => {
      // Check if all analyses are displayed
      cy.get('.analysis-table tbody tr').should('have.length', mockAnalyses.length);
      
      // Check first analysis details
      cy.get('.analysis-table tbody tr').first().within(() => {
        cy.get('td').should('contain', 'cv-test-user.pdf');
        cy.get('td').should('contain', 'Desenvolvedor Full Stack');
        cy.get('td').should('contain', 'Tech Company');
        cy.get('.match-score').should('contain', '85%');
        cy.get('.job-count-badge').should('contain', '5 vagas');
      });
    });

    it('should show match scores with appropriate colors', () => {
      cy.get('.match-score').each(($score) => {
        const scoreText = $score.text();
        const scoreValue = parseInt(scoreText);
        
        if (scoreValue >= 80) {
          // High scores should be green
          cy.wrap($score).should('have.css', 'color', 'rgb(22, 101, 52)');
        } else if (scoreValue >= 60) {
          // Medium scores should be yellow/orange
          cy.wrap($score).should('have.css', 'color', 'rgb(202, 138, 4)');
        } else {
          // Low scores should be red
          cy.wrap($score).should('have.css', 'color', 'rgb(220, 38, 38)');
        }
      });
    });

    it('should have view button for each analysis', () => {
      cy.get('.view-analysis-btn').should('have.length', mockAnalyses.length);
      
      // Click first view button
      cy.get('.view-analysis-btn').first().click();
      
      // Should navigate to results page with analysis data
      cy.url().should('include', '/results');
    });

    it('should show empty state when no analyses', () => {
      // Mock empty response
      cy.intercept('GET', '/api/analyses/history', {
        statusCode: 200,
        body: {
          success: true,
          data: []
        }
      }).as('getEmptyAnalyses');

      cy.reload();
      cy.get('.tab-button').contains('Análises de Currículo').click();
      cy.wait('@getEmptyAnalyses');

      // Should show empty state message
      cy.get('[data-cy="empty-analyses"]').should('be.visible');
      cy.get('[data-cy="empty-analyses"]').should('contain', 'Nenhuma análise encontrada');
      cy.get('[data-cy="start-analysis-btn"]').should('be.visible');
    });

    it('should filter analyses by date range', () => {
      // Check if date filter exists
      cy.get('[data-cy="date-filter"]').should('be.visible');
      
      // Select last 7 days
      cy.get('[data-cy="date-filter"]').select('7days');
      
      // Should show only recent analyses
      cy.get('.analysis-table tbody tr').should('have.length', 2);
    });

    it('should search analyses by filename or job title', () => {
      // Type in search box
      cy.get('[data-cy="search-analyses"]').type('Frontend');
      
      // Should show only matching analysis
      cy.get('.analysis-table tbody tr').should('have.length', 1);
      cy.get('.analysis-table tbody tr').should('contain', 'Frontend Developer');
      
      // Clear search
      cy.get('[data-cy="search-analyses"]').clear();
      cy.get('.analysis-table tbody tr').should('have.length', mockAnalyses.length);
    });
  });

  describe('Data Persistence', () => {
    it('should persist tab selection on page reload', () => {
      cy.visit('/history.html');
      
      // Switch to analyses tab
      cy.get('.tab-button').contains('Análises de Currículo').click();
      
      // Reload page
      cy.reload();
      
      // Analyses tab should still be active
      cy.get('.tab-button').contains('Análises').should('have.class', 'active');
      cy.get('#analyses-content').should('be.visible');
    });

    it('should update data when new transaction is made', () => {
      // Complete a purchase in another tab
      cy.window().then(win => {
        win.open('/payment.html', '_blank');
      });
      
      // Return to history page
      cy.visit('/history.html');
      
      // Should show updated transaction count
      cy.get('.transaction-table tbody tr').should('have.length.at.least', mockTransactions.length);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      cy.visit('/history.html');
    });

    it('should allow exporting transaction history', () => {
      cy.get('[data-cy="export-transactions"]').should('be.visible');
      
      // Click export button
      cy.get('[data-cy="export-transactions"]').click();
      
      // Should show format options
      cy.get('[data-cy="export-csv"]').should('be.visible');
      cy.get('[data-cy="export-pdf"]').should('be.visible');
    });

    it('should download CSV file when export is clicked', () => {
      cy.get('[data-cy="export-transactions"]').click();
      cy.get('[data-cy="export-csv"]').click();
      
      // Verify download was triggered
      cy.readFile('cypress/downloads/transactions-history.csv').should('exist');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.visit('/history.html');
    });

    it('should show mobile-optimized layout', () => {
      // Tabs should stack vertically on mobile
      cy.get('.tabs').should('have.css', 'flex-direction', 'column');
      
      // Tables should be scrollable
      cy.get('.transaction-table').parent().should('have.css', 'overflow-x', 'auto');
    });

    it('should have touch-friendly buttons', () => {
      // Buttons should be larger on mobile
      cy.get('.view-analysis-btn').should('have.css', 'padding').and('match', /\d+px/);
      cy.get('.tab-button').should('have.css', 'min-height').and('match', /4\dpx/);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/transactions/history', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getTransactionsError');

      cy.visit('/history.html');
      cy.wait('@getTransactionsError');

      // Should show error message
      cy.get('[data-cy="error-message"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('contain', 'Erro ao carregar');
      
      // Should show retry button
      cy.get('[data-cy="retry-button"]').should('be.visible');
    });

    it('should retry loading data when retry button is clicked', () => {
      // First request fails
      cy.intercept('GET', '/api/transactions/history', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getTransactionsError');

      cy.visit('/history.html');
      cy.wait('@getTransactionsError');

      // Mock successful response for retry
      cy.intercept('GET', '/api/transactions/history', {
        statusCode: 200,
        body: {
          success: true,
          data: mockTransactions
        }
      }).as('getTransactionsSuccess');

      // Click retry
      cy.get('[data-cy="retry-button"]').click();
      cy.wait('@getTransactionsSuccess');

      // Should show data
      cy.get('.transaction-table tbody tr').should('have.length', mockTransactions.length);
    });
  });
});