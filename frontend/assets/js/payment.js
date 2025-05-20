// Inicializa o objeto de pagamento
const payment = (() => {
  // Inicializa o Stripe com a chave pública
  const stripe = Stripe('pk_test_51O9XYZDpUTYQcVZZ5jfFYvKZKfPSBCWMwTfCXxF1nHlBVWkbLp8tg3UrFBejIadsfJW5JKstLvmPB5UOe7y8WgFv00nS20y5N5');
  let elements;
  let paymentElement;
  let currentPlanData = {};

  // Inicializa o formulário de pagamento com o Stripe Elements
  const initializePaymentForm = (clientSecret) => {
    // Carrega os elementos do Stripe
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#583819',
          colorBackground: '#F3EADA',
          colorText: '#443523',
          colorDanger: '#dc3545',
          fontFamily: 'IBM Plex Sans, sans-serif',
          borderRadius: '6px',
        },
      },
    });

    // Limpa o div de pagamento
    const paymentContainer = document.getElementById('payment-element');
    paymentContainer.innerHTML = '';

    // Monta o elemento de pagamento
    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    // Captura erros
    paymentElement.on('change', (event) => {
      document.getElementById('payment-errors').textContent = event.error ? event.error.message : '';
    });
  };

  // Cria uma intenção de pagamento no servidor
  const createPaymentIntent = async (planData, paymentMethod = 'card', additionalData = {}) => {
    try {
      currentPlanData = planData;
      const userId = auth.getUser()?.id;
      
      if (!userId) {
        document.getElementById('paymentMessage').textContent = 'Você precisa estar logado para realizar compras.';
        document.getElementById('paymentMessage').className = 'message error';
        document.getElementById('paymentMessage').style.display = 'block';
        return false;
      }

      // Mostra mensagem de processamento
      document.getElementById('paymentMessage').textContent = 'Iniciando processamento...';
      document.getElementById('paymentMessage').className = 'message success';
      document.getElementById('paymentMessage').style.display = 'block';
      
      // Dados básicos para o pagamento
      const paymentData = {
        amount: planData.price,
        planName: planData.plan,
        credits: planData.credits,
        paymentMethod: paymentMethod
      };
      
      // Adiciona dados específicos para cada método de pagamento
      if (paymentMethod === 'boleto' || paymentMethod === 'pix') {
        Object.assign(paymentData, additionalData);
      }
      
      // Faz a requisição para criar o PaymentIntent
      const response = await fetch('http://localhost:3000/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const data = await response.json();
      
      // Guarda o ID da transação
      sessionStorage.setItem('currentTransactionId', data.transactionId);
      
      // Inicializa o formulário de pagamento
      initializePaymentForm(data.clientSecret);
      
      // Atualiza a UI
      document.getElementById('stripe-payment-form').style.display = 'block';
      document.getElementById('payment-form-regular').style.display = 'none';
      
      return true;
    } catch (error) {
      console.error('Erro ao criar intenção de pagamento:', error);
      document.getElementById('paymentMessage').textContent = `Erro: ${error.message}`;
      document.getElementById('paymentMessage').className = 'message error';
      document.getElementById('paymentMessage').style.display = 'block';
      return false;
    }
  };

  // Renderiza o QR Code do PIX na tela
  const renderPixQRCode = (pixData) => {
    // Mostrar container do PIX
    document.getElementById('pix-container').style.display = 'block';
    document.getElementById('stripe-payment-form').style.display = 'none';
    document.getElementById('boleto-container').style.display = 'none';
    
    // Configurar dados do PIX
    document.getElementById('pix-qrcode').innerHTML = `<img src="${pixData.qr_code_url}" alt="QR Code PIX" style="width:100%;max-width:300px;"/>`;
    document.getElementById('pix-code').textContent = pixData.qr_code;
    
    // Adicionar botão para copiar código PIX
    document.getElementById('copy-pix-code').addEventListener('click', () => {
      navigator.clipboard.writeText(pixData.qr_code).then(() => {
        document.getElementById('copy-message').textContent = 'Código PIX copiado!';
        setTimeout(() => {
          document.getElementById('copy-message').textContent = '';
        }, 3000);
      });
    });
    
    // Mostrar instruções de pagamento
    document.getElementById('paymentMessage').textContent = 'Escaneie o QR Code ou copie o código PIX para pagar';
    document.getElementById('paymentMessage').className = 'message success';
    document.getElementById('paymentMessage').style.display = 'block';
  };
  
  // Renderiza o Boleto na tela
  const renderBoleto = (boletoData) => {
    // Mostrar container do boleto
    document.getElementById('boleto-container').style.display = 'block';
    document.getElementById('stripe-payment-form').style.display = 'none';
    document.getElementById('pix-container').style.display = 'none';
    
    // Configurar dados do boleto
    document.getElementById('boleto-code').textContent = boletoData.code;
    const boletoLink = document.getElementById('boleto-link');
    boletoLink.href = boletoData.pdf_url;
    boletoLink.style.display = 'block';
    
    // Adicionar botão para copiar código de barras
    document.getElementById('copy-boleto-code').addEventListener('click', () => {
      navigator.clipboard.writeText(boletoData.code).then(() => {
        document.getElementById('copy-boleto-message').textContent = 'Código do boleto copiado!';
        setTimeout(() => {
          document.getElementById('copy-boleto-message').textContent = '';
        }, 3000);
      });
    });
    
    // Mostrar instruções de pagamento
    document.getElementById('paymentMessage').textContent = 'O boleto foi gerado. Você pode imprimi-lo ou copiar o código de barras.';
    document.getElementById('paymentMessage').className = 'message success';
    document.getElementById('paymentMessage').style.display = 'block';
  };

  // Processa o pagamento com o Stripe
  const processPayment = async () => {
    try {
      document.getElementById('submit-payment').disabled = true;
      document.getElementById('paymentMessage').textContent = 'Processando pagamento...';
      document.getElementById('paymentMessage').className = 'message success';
      document.getElementById('paymentMessage').style.display = 'block';

      // Verifica o método de pagamento selecionado
      const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
      
      if (selectedMethod === 'card') {
        // Confirma o pagamento com cartão
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success.html`,
          },
          redirect: 'if_required'
        });

        if (error) {
          throw new Error(error.message || 'Erro ao processar pagamento');
        }

        // Se não houve redirecionamento e não há erro, o pagamento foi bem-sucedido
        // Confirma o pagamento no servidor
        const transactionId = sessionStorage.getItem('currentTransactionId');
        const paymentIntentId = sessionStorage.getItem('paymentIntentId');
        
        const response = await fetch('http://localhost:3000/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.getToken()}`
          },
          body: JSON.stringify({
            transactionId,
            paymentIntentId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao confirmar pagamento');
        }
      } else if (selectedMethod === 'pix') {
        // Obter os dados do usuário
        const user = auth.getUser();
        const name = document.getElementById('pix-name').value || user.name;
        const email = document.getElementById('pix-email').value || user.email;
        const taxId = document.getElementById('pix-cpf').value;
        
        // Valida CPF
        if (!taxId || taxId.length < 11) {
          throw new Error('CPF inválido. Por favor, informe um CPF válido.');
        }
        
        // Cria intenção de pagamento com PIX
        const success = await createPaymentIntent(currentPlanData, 'pix', {
          taxId,
          name,
          email
        });
        
        if (!success) {
          throw new Error('Erro ao gerar pagamento PIX');
        }
        
        // Aguarda o pagamento via webhook
        // No PIX, o usuário é redirecionado para a página de sucesso apenas quando o webhook confirma o pagamento
        return;
      } else if (selectedMethod === 'boleto') {
        // Obter os dados do usuário para o boleto
        const user = auth.getUser();
        const name = document.getElementById('boleto-name').value || user.name;
        const email = document.getElementById('boleto-email').value || user.email;
        const taxId = document.getElementById('boleto-cpf').value;
        const address = document.getElementById('boleto-address').value;
        const city = document.getElementById('boleto-city').value;
        const state = document.getElementById('boleto-state').value;
        const postalCode = document.getElementById('boleto-postal-code').value;
        
        // Validar dados
        if (!taxId || taxId.length < 11) {
          throw new Error('CPF inválido. Por favor, informe um CPF válido.');
        }
        
        if (!address || !city || !state || !postalCode) {
          throw new Error('Todos os campos de endereço são obrigatórios para boleto.');
        }
        
        // Cria intenção de pagamento com boleto
        const success = await createPaymentIntent(currentPlanData, 'boleto', {
          taxId,
          name,
          email,
          address,
          city,
          state,
          postalCode
        });
        
        if (!success) {
          throw new Error('Erro ao gerar boleto');
        }
        
        // Aguarda o pagamento via webhook
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao confirmar pagamento');
      }

      const data = await response.json();
      
      // Atualiza os créditos do usuário localmente
      const user = auth.getUser();
      if (user) {
        user.credits = data.credits;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Exibe mensagem de sucesso
      document.getElementById('paymentMessage').textContent = `Pagamento processado com sucesso! ${currentPlanData.credits} análises foram adicionadas à sua conta.`;
      
      // Redireciona de volta para a página principal após alguns segundos
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      document.getElementById('paymentMessage').textContent = `Erro: ${error.message}`;
      document.getElementById('paymentMessage').className = 'message error';
      document.getElementById('paymentMessage').style.display = 'block';
      document.getElementById('submit-payment').disabled = false;
    }
  };

  // Alterna entre os diferentes formulários de métodos de pagamento
  const togglePaymentMethods = () => {
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const stripeForm = document.getElementById('stripe-payment-form');
    const pixForm = document.getElementById('pix-form');
    const boletoForm = document.getElementById('boleto-form');
    const pixContainer = document.getElementById('pix-container');
    const boletoContainer = document.getElementById('boleto-container');
    
    paymentMethodRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        // Esconde todos os formulários e containers
        stripeForm.style.display = 'none';
        pixForm.style.display = 'none';
        boletoForm.style.display = 'none';
        pixContainer.style.display = 'none';
        boletoContainer.style.display = 'none';
        
        // Mostra o formulário selecionado
        if (this.value === 'card') {
          stripeForm.style.display = 'block';
        } else if (this.value === 'pix') {
          pixForm.style.display = 'block';
        } else if (this.value === 'boleto') {
          boletoForm.style.display = 'block';
        }
      });
    });
    
    // Configura os eventos dos formulários
    document.getElementById('pix-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      await processPayment();
    });
    
    document.getElementById('boleto-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      await processPayment();
    });
  };
  
  // Inicializa os listeners de eventos na página de pagamento
  const initListeners = () => {
    // Ouvintes para botões de compra
    const buyButtons = document.querySelectorAll('.buy-now');
    buyButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Extrai dados do plano
        const planData = {
          plan: this.getAttribute('data-plan'),
          price: this.getAttribute('data-price'),
          credits: parseInt(this.getAttribute('data-credits'))
        };
        
        // Armazena dados do plano
        sessionStorage.setItem('selectedPlan', planData.plan);
        sessionStorage.setItem('selectedPrice', planData.price);
        sessionStorage.setItem('selectedCredits', planData.credits);
        
        // Abre o modal
        document.getElementById('paymentModal').style.display = 'flex';
        
        // Configura os métodos de pagamento
        togglePaymentMethods();
        
        // Inicializa o formulário padrão (cartão)
        createPaymentIntent(planData);
      });
    });

    // Ouvinte para o formulário de pagamento Stripe
    document.getElementById('stripe-payment-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      await processPayment();
    });

    // Ouvinte para fechar o modal
    document.querySelector('.close-modal').addEventListener('click', function() {
      document.getElementById('paymentModal').style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
      if (e.target === document.getElementById('paymentModal')) {
        document.getElementById('paymentModal').style.display = 'none';
      }
    });
  };

  // Verifica o status do pagamento (para uso após redirecionamento)
  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    
    if (paymentIntentId && paymentIntentClientSecret) {
      try {
        const response = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
        const { paymentIntent } = response;
        
        // Se o pagamento foi bem sucedido, confirma no servidor
        if (paymentIntent.status === 'succeeded') {
          // Guardamos o ID para confirmar o pagamento
          sessionStorage.setItem('paymentIntentId', paymentIntentId);
          
          const transactionId = sessionStorage.getItem('currentTransactionId');
          
          const confirmResponse = await fetch('http://localhost:3000/api/payment/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify({
              transactionId,
              paymentIntentId
            })
          });
          
          if (!confirmResponse.ok) {
            throw new Error('Erro ao confirmar pagamento');
          }
          
          const data = await confirmResponse.json();
          
          // Atualiza os créditos do usuário
          const user = auth.getUser();
          if (user) {
            user.credits = data.credits;
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          return {
            success: true,
            message: 'Pagamento confirmado com sucesso!'
          };
        } else {
          return {
            success: false,
            message: `Status do pagamento: ${paymentIntent.status}`
          };
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        return {
          success: false,
          message: `Erro ao verificar status do pagamento: ${error.message}`
        };
      }
    }
    
    return null;
  };

  // Retorna as funções públicas
  return {
    initListeners,
    checkPaymentStatus
  };
})();
