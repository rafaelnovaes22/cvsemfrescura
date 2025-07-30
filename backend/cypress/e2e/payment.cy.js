describe('Payment Flow', () => {
  const testUser = {
    name: 'Payment Test User',
    email: `payment.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '11987654321'
  };

  const paymentData = {
    cardNumber: '4111111111111111', // Test Visa card
    cardName: 'Test User',
    expiryDate: '12/25',
    cvv: '123',
    cpf: '123.456.789-00',
    billingAddress: {
      street: 'Rua Teste',
      number: '123',
      complement: 'Apto 456',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000'
    }
  };

  beforeEach(() => {
    // Register and login before each test
    cy.register(testUser);
    cy.login(testUser.email, testUser.password);
  });

  describe('Plan Selection', () => {
    beforeEach(() => {
      cy.visit('/plans');
    });

    it('should display available plans', () => {
      cy.get('h1').contains('Escolha seu Plano').should('be.visible');
      
      // Should show at least 3 plans
      cy.get('[data-cy^="plan-card-"]').should('have.length.at.least', 3);
      
      // Check basic plan
      cy.get('[data-cy="plan-card-basic"]').within(() => {
        cy.contains('Básico').should('be.visible');
        cy.contains('R$').should('be.visible');
        cy.contains('1 currículo').should('be.visible');
        cy.get('button').contains('Escolher').should('be.visible');
      });
      
      // Check pro plan
      cy.get('[data-cy="plan-card-pro"]').within(() => {
        cy.contains('Profissional').should('be.visible');
        cy.contains('5 currículos').should('be.visible');
        cy.contains('Templates premium').should('be.visible');
      });
      
      // Check premium plan
      cy.get('[data-cy="plan-card-premium"]').within(() => {
        cy.contains('Premium').should('be.visible');
        cy.contains('Currículos ilimitados').should('be.visible');
        cy.contains('Suporte prioritário').should('be.visible');
      });
    });

    it('should highlight recommended plan', () => {
      cy.get('[data-cy="plan-card-pro"]').should('have.class', 'recommended');
      cy.get('[data-cy="plan-card-pro"]').contains('Mais Popular').should('be.visible');
    });

    it('should show plan comparison', () => {
      cy.get('button[data-cy="compare-plans"]').click();
      cy.get('[data-cy="comparison-modal"]').should('be.visible');
      
      // Check comparison table
      cy.get('table').should('be.visible');
      cy.contains('Currículos por mês').should('be.visible');
      cy.contains('Templates').should('be.visible');
      cy.contains('Exportar PDF').should('be.visible');
      cy.contains('Suporte').should('be.visible');
    });

    it('should select a plan and proceed to checkout', () => {
      cy.get('[data-cy="plan-card-pro"]').within(() => {
        cy.get('button').contains('Escolher').click();
      });
      
      // Should redirect to checkout
      cy.url().should('include', '/checkout');
      cy.contains('Finalizar Compra').should('be.visible');
      cy.contains('Plano Profissional').should('be.visible');
    });
  });

  describe('Checkout Process', () => {
    beforeEach(() => {
      // Select a plan first
      cy.visit('/plans');
      cy.get('[data-cy="plan-card-pro"]').within(() => {
        cy.get('button').click();
      });
    });

    it('should display order summary', () => {
      cy.get('[data-cy="order-summary"]').should('be.visible');
      cy.contains('Resumo do Pedido').should('be.visible');
      cy.contains('Plano Profissional').should('be.visible');
      cy.contains('R$').should('be.visible');
      cy.contains('Total').should('be.visible');
    });

    it('should apply discount coupon', () => {
      cy.get('input[data-cy="coupon-input"]').type('DESCONTO20');
      cy.get('button[data-cy="apply-coupon"]').click();
      
      // Should show discount applied
      cy.contains('Cupom aplicado').should('be.visible');
      cy.contains('Desconto: 20%').should('be.visible');
      
      // Total should be updated
      cy.get('[data-cy="total-amount"]').invoke('text').should('include', 'R$');
    });

    it('should show error for invalid coupon', () => {
      cy.get('input[data-cy="coupon-input"]').type('INVALIDCOUPON');
      cy.get('button[data-cy="apply-coupon"]').click();
      
      cy.contains('Cupom inválido').should('be.visible');
    });

    it('should validate payment form', () => {
      cy.get('button[data-cy="submit-payment"]').click();
      
      // Should show validation errors
      cy.contains('Número do cartão é obrigatório').should('be.visible');
      cy.contains('Nome no cartão é obrigatório').should('be.visible');
      cy.contains('Data de validade é obrigatória').should('be.visible');
      cy.contains('CVV é obrigatório').should('be.visible');
    });

    it('should fill payment information', () => {
      // Card information
      cy.get('input[data-cy="card-number"]').type(paymentData.cardNumber);
      cy.get('input[data-cy="card-name"]').type(paymentData.cardName);
      cy.get('input[data-cy="expiry-date"]').type(paymentData.expiryDate);
      cy.get('input[data-cy="cvv"]').type(paymentData.cvv);
      cy.get('input[data-cy="cpf"]').type(paymentData.cpf);
      
      // Billing address
      cy.get('input[data-cy="billing-street"]').type(paymentData.billingAddress.street);
      cy.get('input[data-cy="billing-number"]').type(paymentData.billingAddress.number);
      cy.get('input[data-cy="billing-complement"]').type(paymentData.billingAddress.complement);
      cy.get('input[data-cy="billing-neighborhood"]').type(paymentData.billingAddress.neighborhood);
      cy.get('input[data-cy="billing-city"]').type(paymentData.billingAddress.city);
      cy.get('select[data-cy="billing-state"]').select(paymentData.billingAddress.state);
      cy.get('input[data-cy="billing-zipcode"]').type(paymentData.billingAddress.zipCode);
    });

    it('should show card brand detection', () => {
      cy.get('input[data-cy="card-number"]').type('4111');
      cy.get('[data-cy="card-brand"]').should('have.class', 'visa');
      
      cy.get('input[data-cy="card-number"]').clear().type('5555');
      cy.get('[data-cy="card-brand"]').should('have.class', 'mastercard');
    });

    it('should format card number automatically', () => {
      cy.get('input[data-cy="card-number"]').type('4111111111111111');
      cy.get('input[data-cy="card-number"]').should('have.value', '4111 1111 1111 1111');
    });

    it('should accept terms and conditions', () => {
      // Fill payment form
      fillPaymentForm(paymentData);
      
      // Try to submit without accepting terms
      cy.get('button[data-cy="submit-payment"]').click();
      cy.contains('Você deve aceitar os termos').should('be.visible');
      
      // Accept terms
      cy.get('input[data-cy="accept-terms"]').check();
      cy.get('button[data-cy="submit-payment"]').should('not.be.disabled');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      // Select plan and fill checkout form
      cy.visit('/plans');
      cy.get('[data-cy="plan-card-pro"]').within(() => {
        cy.get('button').click();
      });
      fillPaymentForm(paymentData);
      cy.get('input[data-cy="accept-terms"]').check();
    });

    it('should process payment successfully', () => {
      cy.get('button[data-cy="submit-payment"]').click();
      
      // Should show processing state
      cy.get('[data-cy="payment-processing"]').should('be.visible');
      cy.contains('Processando pagamento').should('be.visible');
      
      // Should redirect to success page
      cy.url().should('include', '/payment/success', { timeout: 10000 });
      cy.contains('Pagamento Confirmado').should('be.visible');
      cy.contains('Obrigado pela sua compra').should('be.visible');
      
      // Should show order details
      cy.get('[data-cy="order-number"]').should('be.visible');
      cy.contains('Plano Profissional').should('be.visible');
    });

    it('should handle payment failure', () => {
      // Use card that triggers failure
      cy.get('input[data-cy="card-number"]').clear().type('4000000000000002');
      
      cy.get('button[data-cy="submit-payment"]').click();
      
      // Should show error
      cy.contains('Pagamento recusado', { timeout: 10000 }).should('be.visible');
      cy.contains('Verifique os dados do cartão').should('be.visible');
      
      // Should stay on checkout page
      cy.url().should('include', '/checkout');
    });

    it('should handle 3D Secure authentication', () => {
      // Use card that requires 3DS
      cy.get('input[data-cy="card-number"]').clear().type('4000000000003220');
      
      cy.get('button[data-cy="submit-payment"]').click();
      
      // Should show 3DS modal
      cy.get('[data-cy="3ds-modal"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Autenticação do Banco').should('be.visible');
      
      // Simulate 3DS completion
      cy.get('button[data-cy="3ds-complete"]').click();
      
      // Should proceed to success
      cy.url().should('include', '/payment/success');
    });

    it('should send confirmation email', () => {
      cy.get('button[data-cy="submit-payment"]').click();
      
      // Wait for success page
      cy.url().should('include', '/payment/success', { timeout: 10000 });
      
      // Check email notification
      cy.contains('Email de confirmação enviado').should('be.visible');
      cy.contains(testUser.email).should('be.visible');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      // Create a subscription first
      createSubscription(testUser, 'pro');
      cy.visit('/account/subscription');
    });

    it('should display current subscription', () => {
      cy.contains('Minha Assinatura').should('be.visible');
      cy.contains('Plano Profissional').should('be.visible');
      cy.contains('Ativo').should('be.visible');
      cy.contains('Próxima cobrança').should('be.visible');
      cy.get('[data-cy="subscription-status"]').should('have.class', 'active');
    });

    it('should show usage statistics', () => {
      cy.get('[data-cy="usage-stats"]').should('be.visible');
      cy.contains('Currículos criados este mês').should('be.visible');
      cy.contains('0 de 5').should('be.visible');
      cy.get('[data-cy="usage-progress"]').should('be.visible');
    });

    it('should upgrade subscription', () => {
      cy.get('button[data-cy="upgrade-plan"]').click();
      
      // Should show upgrade modal
      cy.get('[data-cy="upgrade-modal"]').should('be.visible');
      cy.contains('Fazer Upgrade').should('be.visible');
      
      // Select premium plan
      cy.get('[data-cy="select-premium"]').click();
      cy.get('button[data-cy="confirm-upgrade"]').click();
      
      // Should process upgrade
      cy.contains('Upgrade realizado com sucesso').should('be.visible');
      cy.contains('Plano Premium').should('be.visible');
    });

    it('should downgrade subscription', () => {
      cy.get('button[data-cy="change-plan"]').click();
      
      // Select basic plan
      cy.get('[data-cy="select-basic"]').click();
      cy.get('button[data-cy="confirm-change"]').click();
      
      // Should show downgrade warning
      cy.contains('Atenção: Downgrade de Plano').should('be.visible');
      cy.contains('Você perderá acesso a').should('be.visible');
      
      // Confirm downgrade
      cy.get('button[data-cy="confirm-downgrade"]').click();
      
      cy.contains('Plano alterado').should('be.visible');
      cy.contains('Efetivo no próximo ciclo').should('be.visible');
    });

    it('should cancel subscription', () => {
      cy.get('button[data-cy="cancel-subscription"]').click();
      
      // Should show cancellation modal
      cy.get('[data-cy="cancel-modal"]').should('be.visible');
      cy.contains('Cancelar Assinatura').should('be.visible');
      
      // Select reason
      cy.get('select[data-cy="cancel-reason"]').select('Muito caro');
      cy.get('textarea[data-cy="cancel-feedback"]').type('Feedback de teste');
      
      cy.get('button[data-cy="confirm-cancel"]').click();
      
      // Should show retention offer
      cy.contains('Que tal um desconto?').should('be.visible');
      cy.contains('50% de desconto').should('be.visible');
      
      // Decline offer and proceed
      cy.get('button[data-cy="decline-offer"]').click();
      
      cy.contains('Assinatura cancelada').should('be.visible');
      cy.contains('Acesso até').should('be.visible');
    });

    it('should update payment method', () => {
      cy.get('button[data-cy="update-payment"]').click();
      
      // Should show payment update form
      cy.get('[data-cy="update-payment-modal"]').should('be.visible');
      
      // Fill new card details
      cy.get('input[data-cy="new-card-number"]').type('5555555555554444');
      cy.get('input[data-cy="new-card-name"]').type('New Card');
      cy.get('input[data-cy="new-expiry"]').type('12/26');
      cy.get('input[data-cy="new-cvv"]').type('456');
      
      cy.get('button[data-cy="save-payment"]').click();
      
      cy.contains('Método de pagamento atualizado').should('be.visible');
    });

    it('should show billing history', () => {
      cy.get('a[data-cy="billing-history"]').click();
      
      cy.url().should('include', '/account/billing');
      cy.contains('Histórico de Pagamentos').should('be.visible');
      
      // Should show at least one transaction
      cy.get('[data-cy^="transaction-"]').should('have.length.at.least', 1);
      
      // Check transaction details
      cy.get('[data-cy="transaction-0"]').within(() => {
        cy.contains('Plano Profissional').should('be.visible');
        cy.contains('R$').should('be.visible');
        cy.contains('Pago').should('be.visible');
        cy.get('button[data-cy="download-invoice"]').should('be.visible');
      });
    });

    it('should download invoice', () => {
      cy.visit('/account/billing');
      
      cy.get('[data-cy="transaction-0"]').within(() => {
        cy.get('button[data-cy="download-invoice"]').click();
      });
      
      // Verify invoice download
      cy.readFile('cypress/downloads/invoice-*.pdf').should('exist');
    });
  });

  describe('Payment Methods', () => {
    beforeEach(() => {
      cy.visit('/checkout');
    });

    it('should support credit card payment', () => {
      cy.get('[data-cy="payment-method-credit"]').should('be.checked');
      cy.get('[data-cy="credit-card-form"]').should('be.visible');
    });

    it('should support PIX payment', () => {
      cy.get('[data-cy="payment-method-pix"]').click();
      cy.get('[data-cy="pix-instructions"]').should('be.visible');
      
      cy.get('button[data-cy="generate-pix"]').click();
      
      // Should show QR code and copy button
      cy.get('[data-cy="pix-qrcode"]').should('be.visible');
      cy.get('[data-cy="pix-code"]').should('be.visible');
      cy.get('button[data-cy="copy-pix"]').should('be.visible');
    });

    it('should support boleto payment', () => {
      cy.get('[data-cy="payment-method-boleto"]').click();
      cy.get('[data-cy="boleto-form"]').should('be.visible');
      
      // Fill CPF
      cy.get('input[data-cy="boleto-cpf"]').type(paymentData.cpf);
      
      cy.get('button[data-cy="generate-boleto"]').click();
      
      // Should show boleto details
      cy.contains('Boleto gerado com sucesso').should('be.visible');
      cy.get('[data-cy="boleto-barcode"]').should('be.visible');
      cy.get('button[data-cy="download-boleto"]').should('be.visible');
    });
  });
});

// Helper function to fill payment form
function fillPaymentForm(data) {
  cy.get('input[data-cy="card-number"]').type(data.cardNumber);
  cy.get('input[data-cy="card-name"]').type(data.cardName);
  cy.get('input[data-cy="expiry-date"]').type(data.expiryDate);
  cy.get('input[data-cy="cvv"]').type(data.cvv);
  cy.get('input[data-cy="cpf"]').type(data.cpf);
  
  cy.get('input[data-cy="billing-street"]').type(data.billingAddress.street);
  cy.get('input[data-cy="billing-number"]').type(data.billingAddress.number);
  cy.get('input[data-cy="billing-complement"]').type(data.billingAddress.complement);
  cy.get('input[data-cy="billing-neighborhood"]').type(data.billingAddress.neighborhood);
  cy.get('input[data-cy="billing-city"]').type(data.billingAddress.city);
  cy.get('select[data-cy="billing-state"]').select(data.billingAddress.state);
  cy.get('input[data-cy="billing-zipcode"]').type(data.billingAddress.zipCode);
}

// Helper function to create a subscription via API
function createSubscription(user, plan) {
  cy.request('POST', `${Cypress.env('apiUrl')}/subscriptions/create`, {
    userId: user.id,
    plan: plan,
    paymentMethod: 'test_card'
  });
}