describe('Contact/Support Flow', () => {
  const testUser = {
    name: 'Contact Test User',
    email: `contact.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };
  
  let authToken;

  before(() => {
    // Registrar e fazer login do usuário de teste
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, testUser)
      .then(() => {
        return cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
      })
      .then((response) => {
        authToken = response.body.token;
      });
  });

  describe('Contact Page Access', () => {
    it('should access contact page without authentication', () => {
      cy.visit('/contact.html');
      cy.url().should('include', '/contact.html');
      cy.contains('Entre em Contato').should('be.visible');
    });

    it('should pre-fill form for authenticated users', () => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      localStorage.setItem('userName', testUser.name);
      
      cy.visit('/contact.html');
      cy.get('#contactName').should('have.value', testUser.name);
      cy.get('#contactEmail').should('have.value', testUser.email);
    });
  });

  describe('Contact Form Validation', () => {
    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should display contact form elements', () => {
      cy.get('#contactForm').should('be.visible');
      cy.get('#contactName').should('be.visible');
      cy.get('#contactEmail').should('be.visible');
      cy.get('#contactSubject').should('be.visible');
      cy.get('#contactCategory').should('be.visible');
      cy.get('#contactMessage').should('be.visible');
      cy.get('#contactPriority').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty required fields', () => {
      cy.get('button[type="submit"]').click();
      
      cy.contains('Nome é obrigatório').should('be.visible');
      cy.contains('Email é obrigatório').should('be.visible');
      cy.contains('Assunto é obrigatório').should('be.visible');
      cy.contains('Mensagem é obrigatória').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('#contactEmail').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.contains('Email inválido').should('be.visible');
    });

    it('should validate message length', () => {
      cy.get('#contactMessage').type('Short');
      cy.get('button[type="submit"]').click();
      cy.contains('Mensagem deve ter pelo menos 10 caracteres').should('be.visible');
    });

    it('should show character count for message', () => {
      const message = 'Esta é uma mensagem de teste para verificar o contador';
      cy.get('#contactMessage').type(message);
      cy.get('#messageCharCount').should('contain', `${message.length}/1000`);
    });
  });

  describe('Contact Form Categories', () => {
    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should display all contact categories', () => {
      cy.get('#contactCategory').click();
      cy.get('#contactCategory option').should('have.length.at.least', 5);
      cy.get('#contactCategory').should('contain', 'Dúvida');
      cy.get('#contactCategory').should('contain', 'Suporte Técnico');
      cy.get('#contactCategory').should('contain', 'Sugestão');
      cy.get('#contactCategory').should('contain', 'Reclamação');
      cy.get('#contactCategory').should('contain', 'Outros');
    });

    it('should show additional fields for technical support', () => {
      cy.get('#contactCategory').select('technical');
      cy.get('#technicalDetails').should('be.visible');
      cy.get('#browserInfo').should('be.visible');
      cy.get('#osInfo').should('be.visible');
      cy.get('#errorMessage').should('be.visible');
    });

    it('should show urgency field for complaints', () => {
      cy.get('#contactCategory').select('complaint');
      cy.get('#urgencyLevel').should('be.visible');
    });
  });

  describe('Contact Form Submission', () => {
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Teste de Contato E2E',
      category: 'suggestion',
      message: 'Esta é uma mensagem de teste para verificar o envio do formulário de contato através dos testes E2E.',
      priority: 'medium'
    };

    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should successfully submit contact form', () => {
      cy.get('#contactName').type(contactData.name);
      cy.get('#contactEmail').type(contactData.email);
      cy.get('#contactSubject').type(contactData.subject);
      cy.get('#contactCategory').select(contactData.category);
      cy.get('#contactMessage').type(contactData.message);
      cy.get('#contactPriority').select(contactData.priority);
      
      cy.get('button[type="submit"]').click();
      
      cy.contains('Mensagem enviada com sucesso').should('be.visible');
      cy.contains('Entraremos em contato em breve').should('be.visible');
    });

    it('should clear form after successful submission', () => {
      // Preencher e enviar formulário
      cy.get('#contactName').type(contactData.name);
      cy.get('#contactEmail').type(contactData.email);
      cy.get('#contactSubject').type(contactData.subject);
      cy.get('#contactMessage').type(contactData.message);
      
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
      
      // Verificar se o formulário foi limpo
      cy.get('#contactName').should('have.value', '');
      cy.get('#contactEmail').should('have.value', '');
      cy.get('#contactSubject').should('have.value', '');
      cy.get('#contactMessage').should('have.value', '');
    });

    it('should handle file attachments', () => {
      cy.get('#contactName').type(contactData.name);
      cy.get('#contactEmail').type(contactData.email);
      cy.get('#contactSubject').type(contactData.subject);
      cy.get('#contactMessage').type(contactData.message);
      
      // Anexar arquivo
      const fileName = 'test-document.pdf';
      cy.get('#attachmentInput').attachFile(fileName);
      cy.get('#attachmentList').should('contain', fileName);
      
      cy.get('button[type="submit"]').click();
      cy.contains('Mensagem enviada com sucesso').should('be.visible');
    });

    it('should validate file size limit', () => {
      // Simular arquivo muito grande
      const largeFileName = 'large-file.zip';
      cy.get('#attachmentInput').attachFile({
        filePath: largeFileName,
        fileSize: 11 * 1024 * 1024 // 11MB
      });
      
      cy.contains('Arquivo muito grande').should('be.visible');
    });

    it('should handle multiple file attachments', () => {
      cy.get('#contactName').type(contactData.name);
      cy.get('#contactEmail').type(contactData.email);
      cy.get('#contactSubject').type(contactData.subject);
      cy.get('#contactMessage').type(contactData.message);
      
      // Anexar múltiplos arquivos
      const files = ['doc1.pdf', 'doc2.docx', 'image.png'];
      files.forEach(file => {
        cy.get('#attachmentInput').attachFile(file);
      });
      
      cy.get('#attachmentList .attachment-item').should('have.length', 3);
      
      // Remover um arquivo
      cy.get('#attachmentList .remove-attachment').first().click();
      cy.get('#attachmentList .attachment-item').should('have.length', 2);
    });
  });

  describe('Contact Form with Authentication', () => {
    beforeEach(() => {
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', testUser.email);
      localStorage.setItem('userName', testUser.name);
      cy.visit('/contact.html');
    });

    it('should show ticket history for authenticated users', () => {
      cy.get('#ticketHistory').should('be.visible');
      cy.contains('Histórico de Tickets').should('be.visible');
    });

    it('should display previous tickets', () => {
      // Enviar um ticket primeiro
      cy.get('#contactSubject').type('Ticket de Teste');
      cy.get('#contactMessage').type('Mensagem do ticket de teste para histórico');
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
      
      // Recarregar página
      cy.reload();
      
      // Verificar histórico
      cy.get('#ticketHistory .ticket-item').should('have.length.at.least', 1);
      cy.get('#ticketHistory').should('contain', 'Ticket de Teste');
    });

    it('should view ticket details', () => {
      cy.get('#ticketHistory .ticket-item').first().click();
      cy.get('#ticketDetailsModal').should('be.visible');
      cy.get('#ticketDetailsModal').should('contain', 'Detalhes do Ticket');
    });

    it('should filter tickets by status', () => {
      cy.get('#ticketStatusFilter').select('open');
      cy.get('#ticketHistory .ticket-item').each(($item) => {
        cy.wrap($item).find('.status-badge').should('contain', 'Aberto');
      });
    });
  });

  describe('FAQ Integration', () => {
    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should display FAQ section', () => {
      cy.get('#faqSection').should('be.visible');
      cy.contains('Perguntas Frequentes').should('be.visible');
    });

    it('should search FAQ before submitting', () => {
      cy.get('#contactSubject').type('como resetar senha');
      cy.wait(500);
      
      cy.get('#faqSuggestions').should('be.visible');
      cy.get('#faqSuggestions .faq-item').should('have.length.at.least', 1);
      cy.get('#faqSuggestions').should('contain', 'senha');
    });

    it('should redirect to FAQ when clicking suggestion', () => {
      cy.get('#contactSubject').type('pagamento');
      cy.wait(500);
      
      cy.get('#faqSuggestions .faq-item').first().click();
      cy.url().should('include', '/faq.html');
    });
  });

  describe('Contact Response Time', () => {
    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should display estimated response time', () => {
      cy.get('#contactCategory').select('doubt');
      cy.get('#responseTime').should('be.visible');
      cy.get('#responseTime').should('contain', '24-48 horas');
      
      cy.get('#contactCategory').select('technical');
      cy.get('#responseTime').should('contain', '4-8 horas');
      
      cy.get('#contactPriority').select('high');
      cy.get('#responseTime').should('contain', '2-4 horas');
    });
  });

  describe('Contact Form Accessibility', () => {
    beforeEach(() => {
      cy.visit('/contact.html');
    });

    it('should have proper ARIA labels', () => {
      cy.get('#contactForm').should('have.attr', 'aria-label');
      cy.get('#contactName').should('have.attr', 'aria-label');
      cy.get('#contactEmail').should('have.attr', 'aria-label');
      cy.get('#contactMessage').should('have.attr', 'aria-label');
    });

    it('should be keyboard navigable', () => {
      cy.get('#contactName').focus();
      cy.focused().should('have.id', 'contactName');
      
      cy.focused().tab();
      cy.focused().should('have.id', 'contactEmail');
      
      cy.focused().tab();
      cy.focused().should('have.id', 'contactSubject');
    });

    it('should announce form errors to screen readers', () => {
      cy.get('button[type="submit"]').click();
      cy.get('[role="alert"]').should('exist');
      cy.get('[aria-live="polite"]').should('exist');
    });
  });

  describe('Contact Form Rate Limiting', () => {
    it('should prevent spam submissions', () => {
      const contactData = {
        name: 'Spam Test',
        email: 'spam@test.com',
        subject: 'Spam Test',
        message: 'This is a spam test message'
      };

      // Tentar enviar múltiplas mensagens rapidamente
      for (let i = 0; i < 5; i++) {
        cy.visit('/contact.html');
        cy.get('#contactName').type(contactData.name);
        cy.get('#contactEmail').type(contactData.email);
        cy.get('#contactSubject').type(`${contactData.subject} ${i}`);
        cy.get('#contactMessage').type(contactData.message);
        cy.get('button[type="submit"]').click();
        
        if (i < 3) {
          cy.contains('Mensagem enviada com sucesso').should('be.visible');
        }
      }
      
      // Após 3 mensagens, deve mostrar limite
      cy.contains('Limite de mensagens atingido').should('be.visible');
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