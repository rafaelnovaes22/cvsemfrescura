describe('Complete CV Analysis Flow', () => {
  const testUser = {
    name: 'CV Analysis Test User',
    email: `cv.analysis.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  const testFiles = {
    validPDF: 'cypress/fixtures/sample-cv.pdf',
    validDOCX: 'cypress/fixtures/sample-cv.docx',
    invalidFile: 'cypress/fixtures/invalid-file.txt',
    largePDF: 'cypress/fixtures/large-cv.pdf'
  };

  const jobDescription = {
    title: 'Desenvolvedor Full Stack Senior',
    company: 'Tech Company',
    description: `Buscamos um desenvolvedor Full Stack com experiência em:
      - React.js e Node.js
      - Banco de dados SQL e NoSQL
      - APIs RESTful e GraphQL
      - Docker e Kubernetes
      - Metodologias ágeis
      - Inglês avançado`,
    requirements: [
      'Mínimo 5 anos de experiência',
      'Formação em Ciência da Computação ou áreas relacionadas',
      'Conhecimento em cloud computing (AWS/Azure/GCP)'
    ]
  };

  beforeEach(() => {
    // Register and login before each test
    cy.register(testUser);
    cy.login(testUser.email, testUser.password);
  });

  describe('CV Upload Process', () => {
    beforeEach(() => {
      cy.visit('/analisar');
    });

    it('should display the analysis page correctly', () => {
      // Check page title and main elements
      cy.get('h1').contains('Análise de Currículo').should('be.visible');
      
      // Check file upload area
      cy.get('[data-cy="file-upload-area"]').should('be.visible');
      cy.get('[data-cy="file-upload-input"]').should('exist');
      
      // Check job description textarea
      cy.get('[data-cy="job-description-textarea"]').should('be.visible');
      
      // Check analyze button (should be disabled initially)
      cy.get('[data-cy="analyze-button"]').should('be.visible').and('be.disabled');
    });

    it('should handle file drag and drop', () => {
      // Simulate drag and drop
      cy.get('[data-cy="file-upload-area"]').selectFile(testFiles.validPDF, {
        action: 'drag-drop'
      });

      // Check if file was accepted
      cy.get('[data-cy="file-name"]').should('contain', 'sample-cv.pdf');
      cy.get('[data-cy="file-size"]').should('be.visible');
      cy.get('[data-cy="remove-file-button"]').should('be.visible');
    });

    it('should validate file types', () => {
      // Try uploading invalid file type
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.invalidFile, {
        force: true
      });

      // Should show error message
      cy.get('[data-cy="error-message"]').should('contain', 'Tipo de arquivo não suportado');
      
      // File should not be accepted
      cy.get('[data-cy="file-name"]').should('not.exist');
    });

    it('should handle file size limits', () => {
      // Try uploading large file
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.largePDF, {
        force: true
      });

      // Should show error message
      cy.get('[data-cy="error-message"]').should('contain', 'Arquivo muito grande');
    });

    it('should remove uploaded file', () => {
      // Upload a file
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.validPDF, {
        force: true
      });

      // Check file is uploaded
      cy.get('[data-cy="file-name"]').should('exist');

      // Remove file
      cy.get('[data-cy="remove-file-button"]').click();

      // Check file is removed
      cy.get('[data-cy="file-name"]').should('not.exist');
      cy.get('[data-cy="analyze-button"]').should('be.disabled');
    });
  });

  describe('Job Description Input', () => {
    beforeEach(() => {
      cy.visit('/analisar');
      // Upload a valid CV first
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.validPDF, {
        force: true
      });
    });

    it('should accept job description text', () => {
      // Type job description
      cy.get('[data-cy="job-description-textarea"]')
        .type(jobDescription.description);

      // Check character count
      cy.get('[data-cy="char-count"]').should('be.visible');
      
      // Analyze button should be enabled
      cy.get('[data-cy="analyze-button"]').should('not.be.disabled');
    });

    it('should show job URL input option', () => {
      // Click on "Use URL" option
      cy.get('[data-cy="use-url-button"]').click();

      // URL input should appear
      cy.get('[data-cy="job-url-input"]').should('be.visible');
      
      // Type a URL
      cy.get('[data-cy="job-url-input"]')
        .type('https://www.linkedin.com/jobs/view/123456789');

      // Should validate URL format
      cy.get('[data-cy="url-valid-icon"]').should('be.visible');
    });

    it('should handle job description templates', () => {
      // Click on templates button
      cy.get('[data-cy="templates-button"]').click();

      // Should show template modal
      cy.get('[data-cy="templates-modal"]').should('be.visible');
      
      // Select a template
      cy.get('[data-cy="template-item"]').first().click();

      // Template should be applied
      cy.get('[data-cy="job-description-textarea"]')
        .should('not.have.value', '');
    });
  });

  describe('Analysis Process', () => {
    beforeEach(() => {
      cy.visit('/analisar');
      // Upload CV and add job description
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.validPDF, {
        force: true
      });
      cy.get('[data-cy="job-description-textarea"]')
        .type(jobDescription.description);
    });

    it('should start analysis when clicking analyze button', () => {
      // Click analyze button
      cy.get('[data-cy="analyze-button"]').click();

      // Should show loading state
      cy.get('[data-cy="loading-spinner"]').should('be.visible');
      cy.get('[data-cy="loading-message"]').should('contain', 'Analisando');

      // Should show progress steps
      cy.get('[data-cy="progress-step-upload"]').should('have.class', 'completed');
      cy.get('[data-cy="progress-step-processing"]').should('have.class', 'active');
    });

    it('should handle analysis errors gracefully', () => {
      // Intercept API call to simulate error
      cy.intercept('POST', '/api/ats/analyze', {
        statusCode: 500,
        body: { error: 'Erro ao processar arquivo' }
      });

      // Start analysis
      cy.get('[data-cy="analyze-button"]').click();

      // Should show error message
      cy.get('[data-cy="error-alert"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('contain', 'Erro ao processar');
      
      // Should allow retry
      cy.get('[data-cy="retry-button"]').should('be.visible');
    });

    it('should complete analysis successfully', () => {
      // Intercept API call with success response
      cy.intercept('POST', '/api/ats/analyze', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            matchScore: 85,
            strengths: ['Experiência relevante', 'Habilidades técnicas'],
            improvements: ['Adicionar certificações', 'Detalhar projetos'],
            keywords: {
              found: ['React', 'Node.js', 'Docker'],
              missing: ['Kubernetes', 'GraphQL']
            }
          }
        }
      }).as('analyzeCV');

      // Start analysis
      cy.get('[data-cy="analyze-button"]').click();

      // Wait for analysis to complete
      cy.wait('@analyzeCV');

      // Should redirect to results page
      cy.url().should('include', '/results');
    });
  });

  describe('Results Display', () => {
    beforeEach(() => {
      // Navigate directly to results with mock data
      cy.window().then((win) => {
        win.localStorage.setItem('analysisResult', JSON.stringify({
          matchScore: 85,
          strengths: [
            'Experiência sólida em React e Node.js',
            'Conhecimento em Docker',
            'Inglês fluente'
          ],
          improvements: [
            'Adicionar experiência com Kubernetes',
            'Incluir projetos com GraphQL',
            'Detalhar metodologias ágeis utilizadas'
          ],
          keywords: {
            found: ['React', 'Node.js', 'Docker', 'SQL', 'Agile'],
            missing: ['Kubernetes', 'GraphQL', 'AWS']
          },
          experience: {
            years: 6,
            relevant: true,
            details: 'Desenvolvedor Full Stack com 6 anos de experiência'
          }
        }));
      });
      cy.visit('/results');
    });

    it('should display match score prominently', () => {
      // Check score display
      cy.get('[data-cy="match-score"]').should('be.visible');
      cy.get('[data-cy="match-score-value"]').should('contain', '85');
      cy.get('[data-cy="match-score-label"]').should('contain', 'Compatibilidade');

      // Check score visualization (progress bar/chart)
      cy.get('[data-cy="score-visualization"]').should('be.visible');
    });

    it('should show strengths section', () => {
      cy.get('[data-cy="strengths-section"]').should('be.visible');
      cy.get('[data-cy="strengths-title"]').should('contain', 'Pontos Fortes');
      
      // Check all strengths are displayed
      cy.get('[data-cy="strength-item"]').should('have.length', 3);
      cy.get('[data-cy="strength-item"]').first()
        .should('contain', 'Experiência sólida em React');
    });

    it('should show improvements section', () => {
      cy.get('[data-cy="improvements-section"]').should('be.visible');
      cy.get('[data-cy="improvements-title"]').should('contain', 'Sugestões de Melhoria');
      
      // Check all improvements are displayed
      cy.get('[data-cy="improvement-item"]').should('have.length', 3);
      cy.get('[data-cy="improvement-item"]').first()
        .should('contain', 'Adicionar experiência com Kubernetes');
    });

    it('should display keywords analysis', () => {
      cy.get('[data-cy="keywords-section"]').should('be.visible');
      
      // Found keywords
      cy.get('[data-cy="found-keywords"]').should('be.visible');
      cy.get('[data-cy="found-keyword-tag"]').should('have.length.at.least', 3);
      
      // Missing keywords
      cy.get('[data-cy="missing-keywords"]').should('be.visible');
      cy.get('[data-cy="missing-keyword-tag"]').should('have.length.at.least', 2);
    });

    it('should allow downloading report', () => {
      cy.get('[data-cy="download-report-button"]').should('be.visible');
      
      // Click download button
      cy.get('[data-cy="download-report-button"]').click();
      
      // Should show format options
      cy.get('[data-cy="download-pdf"]').should('be.visible');
      cy.get('[data-cy="download-docx"]').should('be.visible');
    });

    it('should allow sharing results', () => {
      cy.get('[data-cy="share-button"]').should('be.visible');
      
      // Click share button
      cy.get('[data-cy="share-button"]').click();
      
      // Should show share options
      cy.get('[data-cy="share-modal"]').should('be.visible');
      cy.get('[data-cy="share-link-input"]').should('be.visible');
      cy.get('[data-cy="copy-link-button"]').should('be.visible');
    });

    it('should allow starting new analysis', () => {
      cy.get('[data-cy="new-analysis-button"]').should('be.visible');
      
      // Click new analysis
      cy.get('[data-cy="new-analysis-button"]').click();
      
      // Should navigate back to analysis page
      cy.url().should('include', '/analisar');
      
      // Previous data should be cleared
      cy.get('[data-cy="file-name"]').should('not.exist');
      cy.get('[data-cy="job-description-textarea"]').should('have.value', '');
    });
  });

  describe('Analysis History', () => {
    it('should save analysis to history', () => {
      // Complete an analysis first
      cy.visit('/analisar');
      cy.get('[data-cy="file-upload-input"]').selectFile(testFiles.validPDF, {
        force: true
      });
      cy.get('[data-cy="job-description-textarea"]')
        .type(jobDescription.description);
      
      // Mock successful analysis
      cy.intercept('POST', '/api/ats/analyze', {
        statusCode: 200,
        body: {
          success: true,
          data: { matchScore: 85 }
        }
      });
      
      cy.get('[data-cy="analyze-button"]').click();
      
      // Navigate to history
      cy.visit('/history');
      
      // Should show the analysis in history
      cy.get('[data-cy="history-item"]').should('have.length.at.least', 1);
      cy.get('[data-cy="history-item"]').first()
        .should('contain', 'sample-cv.pdf')
        .and('contain', '85%');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      cy.visit('/analisar');
    });

    it('should adapt UI for mobile screens', () => {
      // Check mobile-specific UI elements
      cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
      
      // File upload should still work
      cy.get('[data-cy="file-upload-area"]').should('be.visible');
      
      // Job description should be accessible
      cy.get('[data-cy="job-description-textarea"]').should('be.visible');
    });

    it('should handle touch interactions', () => {
      // Simulate touch to upload file
      cy.get('[data-cy="file-upload-area"]').click();
      
      // File input should be triggered
      cy.get('[data-cy="file-upload-input"]').should('exist');
    });
  });
});