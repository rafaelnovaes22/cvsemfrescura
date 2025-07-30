describe('CV Generation Flow', () => {
  const testUser = {
    name: 'CV Test User',
    email: `cv.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  const cvData = {
    fullName: 'João Silva Santos',
    email: 'joao.silva@example.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    linkedin: 'linkedin.com/in/joaosilva',
    objective: 'Busco oportunidade como Desenvolvedor Full Stack para aplicar meus conhecimentos em React e Node.js',
    experience: [
      {
        position: 'Desenvolvedor Full Stack',
        company: 'Tech Solutions Ltda',
        period: '2022 - Presente',
        description: 'Desenvolvimento de aplicações web usando React, Node.js e MongoDB'
      },
      {
        position: 'Desenvolvedor Junior',
        company: 'StartUp XYZ',
        period: '2020 - 2022',
        description: 'Manutenção e desenvolvimento de features em aplicações web'
      }
    ],
    education: [
      {
        degree: 'Bacharelado em Ciência da Computação',
        institution: 'Universidade Federal de São Paulo',
        period: '2016 - 2020'
      }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git', 'Docker'],
    languages: [
      { language: 'Inglês', level: 'Avançado' },
      { language: 'Espanhol', level: 'Intermediário' }
    ]
  };

  beforeEach(() => {
    // Register and login before each test
    cy.register(testUser);
    cy.login(testUser.email, testUser.password);
  });

  describe('CV Form', () => {
    beforeEach(() => {
      cy.visit('/create-cv');
    });

    it('should display CV creation form', () => {
      cy.get('h1').contains('Criar Currículo').should('be.visible');
      cy.get('form').should('be.visible');
      
      // Check main sections
      cy.contains('Informações Pessoais').should('be.visible');
      cy.contains('Objetivo Profissional').should('be.visible');
      cy.contains('Experiência Profissional').should('be.visible');
      cy.contains('Formação Acadêmica').should('be.visible');
      cy.contains('Habilidades').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();
      
      cy.contains('Nome completo é obrigatório').should('be.visible');
      cy.contains('Email é obrigatório').should('be.visible');
      cy.contains('Telefone é obrigatório').should('be.visible');
    });

    it('should fill personal information', () => {
      cy.get('input[name="fullName"]').type(cvData.fullName);
      cy.get('input[name="email"]').type(cvData.email);
      cy.get('input[name="phone"]').type(cvData.phone);
      cy.get('input[name="address"]').type(cvData.address);
      cy.get('input[name="linkedin"]').type(cvData.linkedin);
      
      // Verify values are filled
      cy.get('input[name="fullName"]').should('have.value', cvData.fullName);
      cy.get('input[name="email"]').should('have.value', cvData.email);
    });

    it('should add and remove experience entries', () => {
      // Add first experience
      cy.get('button[data-cy="add-experience"]').click();
      cy.get('input[name="experience[0].position"]').type(cvData.experience[0].position);
      cy.get('input[name="experience[0].company"]').type(cvData.experience[0].company);
      cy.get('input[name="experience[0].period"]').type(cvData.experience[0].period);
      cy.get('textarea[name="experience[0].description"]').type(cvData.experience[0].description);
      
      // Add second experience
      cy.get('button[data-cy="add-experience"]').click();
      cy.get('input[name="experience[1].position"]').type(cvData.experience[1].position);
      cy.get('input[name="experience[1].company"]').type(cvData.experience[1].company);
      
      // Remove first experience
      cy.get('button[data-cy="remove-experience-0"]').click();
      
      // Verify only second experience remains
      cy.get('input[name="experience[0].position"]').should('have.value', cvData.experience[1].position);
    });

    it('should add education entries', () => {
      cy.get('button[data-cy="add-education"]').click();
      cy.get('input[name="education[0].degree"]').type(cvData.education[0].degree);
      cy.get('input[name="education[0].institution"]').type(cvData.education[0].institution);
      cy.get('input[name="education[0].period"]').type(cvData.education[0].period);
    });

    it('should add skills using tags input', () => {
      cvData.skills.forEach(skill => {
        cy.get('input[data-cy="skills-input"]').type(`${skill}{enter}`);
      });
      
      // Verify all skills are added
      cvData.skills.forEach(skill => {
        cy.contains(skill).should('be.visible');
      });
      
      // Remove a skill
      cy.get('[data-cy="remove-skill-React"]').click();
      cy.contains('React').should('not.exist');
    });

    it('should save draft automatically', () => {
      cy.get('input[name="fullName"]').type(cvData.fullName);
      
      // Wait for auto-save
      cy.wait(2000);
      
      // Refresh page
      cy.reload();
      
      // Check if draft is loaded
      cy.get('input[name="fullName"]').should('have.value', cvData.fullName);
      cy.contains('Rascunho carregado').should('be.visible');
    });
  });

  describe('CV Preview', () => {
    beforeEach(() => {
      cy.visit('/create-cv');
      // Fill basic information
      cy.get('input[name="fullName"]').type(cvData.fullName);
      cy.get('input[name="email"]').type(cvData.email);
      cy.get('input[name="phone"]').type(cvData.phone);
      cy.get('textarea[name="objective"]').type(cvData.objective);
    });

    it('should show live preview', () => {
      // Check if preview panel exists
      cy.get('[data-cy="cv-preview"]').should('be.visible');
      
      // Verify preview updates in real-time
      cy.get('[data-cy="preview-name"]').should('contain', cvData.fullName);
      cy.get('[data-cy="preview-email"]').should('contain', cvData.email);
      cy.get('[data-cy="preview-phone"]').should('contain', cvData.phone);
      cy.get('[data-cy="preview-objective"]').should('contain', cvData.objective);
    });

    it('should toggle preview on mobile', () => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      
      // Preview should be hidden by default on mobile
      cy.get('[data-cy="cv-preview"]').should('not.be.visible');
      
      // Toggle preview
      cy.get('button[data-cy="toggle-preview"]').click();
      cy.get('[data-cy="cv-preview"]').should('be.visible');
      
      // Toggle back
      cy.get('button[data-cy="toggle-preview"]').click();
      cy.get('[data-cy="cv-preview"]').should('not.be.visible');
    });

    it('should switch between preview templates', () => {
      // Select different template
      cy.get('select[data-cy="template-selector"]').select('modern');
      cy.get('[data-cy="cv-preview"]').should('have.class', 'template-modern');
      
      cy.get('select[data-cy="template-selector"]').select('classic');
      cy.get('[data-cy="cv-preview"]').should('have.class', 'template-classic');
    });
  });

  describe('CV Generation and Download', () => {
    beforeEach(() => {
      cy.visit('/create-cv');
      // Fill complete CV data
      fillCompleteCVForm(cvData);
    });

    it('should generate CV successfully', () => {
      cy.get('button[data-cy="generate-cv"]').click();
      
      // Should show loading state
      cy.get('button[data-cy="generate-cv"]').should('contain', 'Gerando...');
      
      // Should show success message
      cy.contains('Currículo gerado com sucesso', { timeout: 10000 }).should('be.visible');
      
      // Should enable download button
      cy.get('button[data-cy="download-cv"]').should('not.be.disabled');
    });

    it('should download CV as PDF', () => {
      cy.get('button[data-cy="generate-cv"]').click();
      cy.contains('Currículo gerado com sucesso', { timeout: 10000 });
      
      // Download PDF
      cy.get('button[data-cy="download-cv"]').click();
      
      // Verify download started (check for file in downloads folder)
      cy.readFile('cypress/downloads/curriculo.pdf').should('exist');
    });

    it('should share CV link', () => {
      cy.get('button[data-cy="generate-cv"]').click();
      cy.contains('Currículo gerado com sucesso', { timeout: 10000 });
      
      // Click share button
      cy.get('button[data-cy="share-cv"]').click();
      
      // Should show share modal
      cy.get('[data-cy="share-modal"]').should('be.visible');
      cy.get('input[data-cy="share-link"]').should('contain.value', '/cv/view/');
      
      // Copy link
      cy.get('button[data-cy="copy-link"]').click();
      cy.contains('Link copiado').should('be.visible');
    });

    it('should save CV to user profile', () => {
      cy.get('button[data-cy="generate-cv"]').click();
      cy.contains('Currículo gerado com sucesso', { timeout: 10000 });
      
      // Go to profile
      cy.visit('/profile/cvs');
      
      // Should show saved CV
      cy.contains(cvData.fullName).should('be.visible');
      cy.contains('Criado em').should('be.visible');
    });
  });

  describe('CV Templates', () => {
    beforeEach(() => {
      cy.visit('/create-cv');
    });

    it('should display available templates', () => {
      cy.get('button[data-cy="choose-template"]').click();
      cy.get('[data-cy="template-modal"]').should('be.visible');
      
      // Should show at least 3 templates
      cy.get('[data-cy^="template-option-"]').should('have.length.at.least', 3);
    });

    it('should preview template before selection', () => {
      cy.get('button[data-cy="choose-template"]').click();
      
      // Hover over template to see preview
      cy.get('[data-cy="template-option-modern"]').trigger('mouseenter');
      cy.get('[data-cy="template-preview-modern"]').should('be.visible');
    });

    it('should apply selected template', () => {
      fillCompleteCVForm(cvData);
      
      cy.get('button[data-cy="choose-template"]').click();
      cy.get('[data-cy="template-option-creative"]').click();
      cy.get('button[data-cy="apply-template"]').click();
      
      // Preview should update with new template
      cy.get('[data-cy="cv-preview"]').should('have.class', 'template-creative');
    });
  });

  describe('CV Import/Export', () => {
    beforeEach(() => {
      cy.visit('/create-cv');
    });

    it('should import CV from LinkedIn', () => {
      cy.get('button[data-cy="import-linkedin"]').click();
      
      // Should redirect to LinkedIn OAuth
      cy.url().should('include', 'linkedin.com/oauth');
      
      // Simulate OAuth callback
      cy.visit('/create-cv?linkedin_import=success');
      
      // Should show import success
      cy.contains('Dados importados do LinkedIn').should('be.visible');
      
      // Some fields should be pre-filled
      cy.get('input[name="fullName"]').should('not.have.value', '');
      cy.get('input[name="email"]').should('not.have.value', '');
    });

    it('should export CV data as JSON', () => {
      fillCompleteCVForm(cvData);
      
      cy.get('button[data-cy="export-data"]').click();
      
      // Should download JSON file
      cy.readFile('cypress/downloads/cv-data.json').then((data) => {
        expect(data.fullName).to.equal(cvData.fullName);
        expect(data.email).to.equal(cvData.email);
      });
    });

    it('should import CV data from JSON', () => {
      // Upload JSON file
      cy.get('input[data-cy="import-file"]').attachFile('cv-data.json');
      
      // Should populate form with imported data
      cy.contains('Dados importados com sucesso').should('be.visible');
      cy.get('input[name="fullName"]').should('have.value', cvData.fullName);
    });
  });
});

// Helper function to fill complete CV form
function fillCompleteCVForm(data) {
  // Personal Information
  cy.get('input[name="fullName"]').type(data.fullName);
  cy.get('input[name="email"]').type(data.email);
  cy.get('input[name="phone"]').type(data.phone);
  cy.get('input[name="address"]').type(data.address);
  cy.get('input[name="linkedin"]').type(data.linkedin);
  
  // Objective
  cy.get('textarea[name="objective"]').type(data.objective);
  
  // Experience
  data.experience.forEach((exp, index) => {
    cy.get('button[data-cy="add-experience"]').click();
    cy.get(`input[name="experience[${index}].position"]`).type(exp.position);
    cy.get(`input[name="experience[${index}].company"]`).type(exp.company);
    cy.get(`input[name="experience[${index}].period"]`).type(exp.period);
    cy.get(`textarea[name="experience[${index}].description"]`).type(exp.description);
  });
  
  // Education
  data.education.forEach((edu, index) => {
    cy.get('button[data-cy="add-education"]').click();
    cy.get(`input[name="education[${index}].degree"]`).type(edu.degree);
    cy.get(`input[name="education[${index}].institution"]`).type(edu.institution);
    cy.get(`input[name="education[${index}].period"]`).type(edu.period);
  });
  
  // Skills
  data.skills.forEach(skill => {
    cy.get('input[data-cy="skills-input"]').type(`${skill}{enter}`);
  });
  
  // Languages
  data.languages.forEach((lang, index) => {
    cy.get('button[data-cy="add-language"]').click();
    cy.get(`input[name="languages[${index}].language"]`).type(lang.language);
    cy.get(`select[name="languages[${index}].level"]`).select(lang.level);
  });
}