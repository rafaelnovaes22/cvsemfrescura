describe('FAQ Flow', () => {
  describe('FAQ Page Access', () => {
    it('should access FAQ page without authentication', () => {
      cy.visit('/faq.html');
      cy.url().should('include', '/faq.html');
      cy.contains('Perguntas Frequentes').should('be.visible');
    });

    it('should have navigation links to FAQ from other pages', () => {
      // Verificar link do footer
      cy.visit('/index.html');
      cy.get('footer').contains('FAQ').click();
      cy.url().should('include', '/faq.html');
      
      // Verificar link do menu
      cy.visit('/analisar.html');
      cy.get('.nav-menu').contains('Ajuda').click();
      cy.get('.dropdown-menu').contains('FAQ').click();
      cy.url().should('include', '/faq.html');
    });
  });

  describe('FAQ Page Structure', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should display FAQ page elements', () => {
      cy.get('h1').contains('Perguntas Frequentes').should('be.visible');
      cy.get('#faqSearch').should('be.visible');
      cy.get('#faqCategories').should('be.visible');
      cy.get('#faqList').should('be.visible');
      cy.get('.faq-item').should('have.length.at.least', 10);
    });

    it('should display FAQ categories', () => {
      cy.get('#faqCategories .category-btn').should('have.length.at.least', 5);
      cy.get('#faqCategories').should('contain', 'Geral');
      cy.get('#faqCategories').should('contain', 'Conta');
      cy.get('#faqCategories').should('contain', 'Pagamento');
      cy.get('#faqCategories').should('contain', 'Análise');
      cy.get('#faqCategories').should('contain', 'Técnico');
    });

    it('should display FAQ statistics', () => {
      cy.get('#faqStats').should('be.visible');
      cy.get('#totalQuestions').should('be.visible');
      cy.get('#helpfulVotes').should('be.visible');
      cy.get('#lastUpdated').should('be.visible');
    });
  });

  describe('FAQ Search Functionality', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should search FAQs by keyword', () => {
      cy.get('#faqSearch').type('senha');
      cy.wait(500);
      
      cy.get('.faq-item:visible').each(($item) => {
        cy.wrap($item).should('contain.text', 'senha');
      });
      
      cy.get('.no-results').should('not.exist');
    });

    it('should show no results message for non-existent search', () => {
      cy.get('#faqSearch').type('xyzabc123nonexistent');
      cy.wait(500);
      
      cy.get('.no-results').should('be.visible');
      cy.contains('Nenhuma pergunta encontrada').should('be.visible');
    });

    it('should highlight search terms', () => {
      cy.get('#faqSearch').type('pagamento');
      cy.wait(500);
      
      cy.get('.faq-item:visible .highlight').should('exist');
      cy.get('.highlight').should('have.css', 'background-color');
    });

    it('should clear search', () => {
      cy.get('#faqSearch').type('teste');
      cy.wait(500);
      cy.get('.faq-item:visible').should('have.length.lessThan', 10);
      
      cy.get('#clearSearch').click();
      cy.get('#faqSearch').should('have.value', '');
      cy.get('.faq-item:visible').should('have.length.at.least', 10);
    });

    it('should show search suggestions', () => {
      cy.get('#faqSearch').type('como');
      cy.wait(500);
      
      cy.get('#searchSuggestions').should('be.visible');
      cy.get('#searchSuggestions .suggestion').should('have.length.at.least', 3);
    });
  });

  describe('FAQ Categories', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should filter FAQs by category', () => {
      cy.get('.category-btn[data-category="payment"]').click();
      
      cy.get('.faq-item:visible').each(($item) => {
        cy.wrap($item).should('have.attr', 'data-category', 'payment');
      });
      
      cy.get('.category-btn[data-category="payment"]').should('have.class', 'active');
    });

    it('should show all FAQs when clicking "Todas"', () => {
      // Filtrar por categoria primeiro
      cy.get('.category-btn[data-category="account"]').click();
      cy.get('.faq-item:visible').should('have.length.lessThan', 10);
      
      // Mostrar todas
      cy.get('.category-btn[data-category="all"]').click();
      cy.get('.faq-item:visible').should('have.length.at.least', 10);
    });

    it('should update URL with category filter', () => {
      cy.get('.category-btn[data-category="technical"]').click();
      cy.url().should('include', 'category=technical');
    });

    it('should load with category from URL', () => {
      cy.visit('/faq.html?category=payment');
      cy.get('.category-btn[data-category="payment"]').should('have.class', 'active');
      cy.get('.faq-item:visible').each(($item) => {
        cy.wrap($item).should('have.attr', 'data-category', 'payment');
      });
    });
  });

  describe('FAQ Accordion Behavior', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should expand and collapse FAQ items', () => {
      const firstFaq = cy.get('.faq-item').first();
      
      // Verificar estado inicial (fechado)
      firstFaq.find('.faq-answer').should('not.be.visible');
      firstFaq.find('.expand-icon').should('have.class', 'fa-chevron-down');
      
      // Expandir
      firstFaq.find('.faq-question').click();
      firstFaq.find('.faq-answer').should('be.visible');
      firstFaq.find('.expand-icon').should('have.class', 'fa-chevron-up');
      
      // Colapsar
      firstFaq.find('.faq-question').click();
      firstFaq.find('.faq-answer').should('not.be.visible');
      firstFaq.find('.expand-icon').should('have.class', 'fa-chevron-down');
    });

    it('should expand multiple FAQs simultaneously', () => {
      cy.get('.faq-item').eq(0).find('.faq-question').click();
      cy.get('.faq-item').eq(1).find('.faq-question').click();
      
      cy.get('.faq-item').eq(0).find('.faq-answer').should('be.visible');
      cy.get('.faq-item').eq(1).find('.faq-answer').should('be.visible');
    });

    it('should expand all FAQs', () => {
      cy.get('#expandAllBtn').click();
      
      cy.get('.faq-answer').each(($answer) => {
        cy.wrap($answer).should('be.visible');
      });
    });

    it('should collapse all FAQs', () => {
      // Expandir todas primeiro
      cy.get('#expandAllBtn').click();
      cy.wait(500);
      
      // Colapsar todas
      cy.get('#collapseAllBtn').click();
      
      cy.get('.faq-answer').each(($answer) => {
        cy.wrap($answer).should('not.be.visible');
      });
    });
  });

  describe('FAQ Voting System', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
      cy.get('.faq-item').first().find('.faq-question').click();
    });

    it('should display voting buttons', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.helpful-section').should('be.visible');
        cy.get('.helpful-yes').should('be.visible');
        cy.get('.helpful-no').should('be.visible');
        cy.get('.helpful-count').should('be.visible');
      });
    });

    it('should vote helpful', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.helpful-count').invoke('text').then((initialCount) => {
          cy.get('.helpful-yes').click();
          cy.contains('Obrigado pelo feedback').should('be.visible');
          cy.get('.helpful-yes').should('be.disabled');
          cy.get('.helpful-no').should('be.disabled');
        });
      });
    });

    it('should vote not helpful and show feedback form', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.helpful-no').click();
        cy.get('.feedback-form').should('be.visible');
        cy.get('textarea[placeholder*="Como podemos melhorar"]').should('be.visible');
        cy.get('.submit-feedback').should('be.visible');
      });
    });

    it('should submit feedback for not helpful vote', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.helpful-no').click();
        cy.get('textarea').type('A resposta poderia ser mais detalhada');
        cy.get('.submit-feedback').click();
        cy.contains('Feedback enviado').should('be.visible');
      });
    });

    it('should prevent duplicate votes', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.helpful-yes').click();
        cy.wait(1000);
        cy.reload();
        cy.get('.faq-item').first().find('.faq-question').click();
        cy.get('.helpful-yes').should('be.disabled');
        cy.get('.helpful-no').should('be.disabled');
      });
    });
  });

  describe('FAQ Related Articles', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
      cy.get('.faq-item').first().find('.faq-question').click();
    });

    it('should display related articles', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.related-articles').should('be.visible');
        cy.get('.related-article').should('have.length.at.least', 2);
      });
    });

    it('should navigate to related article', () => {
      cy.get('.faq-item').first().within(() => {
        cy.get('.related-article').first().click();
      });
      
      cy.get('.faq-answer:visible').should('have.length', 1);
    });
  });

  describe('FAQ Contact Support', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should display contact support section', () => {
      cy.get('#contactSupport').should('be.visible');
      cy.contains('Não encontrou o que procurava?').should('be.visible');
      cy.get('.contact-support-btn').should('be.visible');
    });

    it('should navigate to contact page with pre-filled subject', () => {
      cy.get('#faqSearch').type('teste específico');
      cy.wait(500);
      cy.get('.contact-support-btn').click();
      
      cy.url().should('include', '/contact.html');
      cy.url().should('include', 'subject=');
      cy.get('#contactSubject').should('contain.value', 'teste específico');
    });
  });

  describe('FAQ Print and Share', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should have print button', () => {
      cy.get('#printFaqBtn').should('be.visible');
      cy.get('#printFaqBtn').click();
      // Verificar que a função de impressão foi chamada
      cy.window().its('print').should('be.called');
    });

    it('should share FAQ link', () => {
      cy.get('.faq-item').first().find('.faq-question').click();
      cy.get('.faq-item').first().find('.share-btn').click();
      
      cy.get('.share-modal').should('be.visible');
      cy.get('.copy-link-btn').click();
      cy.contains('Link copiado').should('be.visible');
    });

    it('should have direct link to specific FAQ', () => {
      cy.get('.faq-item').first().then(($faq) => {
        const faqId = $faq.attr('id');
        cy.visit(`/faq.html#${faqId}`);
        
        cy.get(`#${faqId} .faq-answer`).should('be.visible');
        cy.get(`#${faqId}`).should('have.class', 'highlighted');
      });
    });
  });

  describe('FAQ Accessibility', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should have proper ARIA attributes', () => {
      cy.get('.faq-item').each(($item) => {
        cy.wrap($item).find('.faq-question').should('have.attr', 'aria-expanded');
        cy.wrap($item).find('.faq-answer').should('have.attr', 'aria-hidden');
      });
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.id', 'faqSearch');
      
      cy.focused().tab();
      cy.focused().should('have.class', 'category-btn');
      
      cy.focused().tab().tab().tab();
      cy.focused().should('have.class', 'faq-question');
      
      // Expandir com Enter
      cy.focused().type('{enter}');
      cy.focused().parent().find('.faq-answer').should('be.visible');
    });

    it('should announce changes to screen readers', () => {
      cy.get('.faq-item').first().find('.faq-question').click();
      cy.get('[aria-live="polite"]').should('contain', 'Pergunta expandida');
    });
  });

  describe('FAQ Mobile Experience', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.visit('/faq.html');
    });

    it('should be responsive on mobile', () => {
      cy.get('#faqSearch').should('be.visible');
      cy.get('#faqCategories').should('be.visible');
      cy.get('.faq-item').should('be.visible');
    });

    it('should have mobile-friendly touch targets', () => {
      cy.get('.faq-question').first().should('have.css', 'min-height').and('match', /4[0-9]px/);
      cy.get('.category-btn').first().should('have.css', 'padding').and('not.equal', '0px');
    });

    it('should show categories in horizontal scroll on mobile', () => {
      cy.get('#faqCategories').should('have.css', 'overflow-x', 'auto');
    });
  });

  describe('FAQ Analytics', () => {
    beforeEach(() => {
      cy.visit('/faq.html');
    });

    it('should track FAQ views', () => {
      cy.get('.faq-item').first().find('.faq-question').click();
      
      // Verificar que o evento de analytics foi disparado
      cy.window().its('dataLayer').should('include', {
        event: 'faq_view',
        faq_id: cy.get('.faq-item').first().attr('id')
      });
    });

    it('should track search queries', () => {
      cy.get('#faqSearch').type('pagamento');
      cy.wait(1000);
      
      cy.window().its('dataLayer').should('include', {
        event: 'faq_search',
        search_term: 'pagamento'
      });
    });
  });
});