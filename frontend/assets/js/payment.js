// Inicializa o objeto de pagamento
const payment = (() => {
  // Verifica se o Stripe está disponível e inicializa
  let stripe = null;
  let elements;
  let paymentElement;
  let currentPlanData = {};

  // Sistema de throttling para evitar spam de requisições
  let isCreatingPayment = false;
  let lastPaymentAttempt = 0;
  let currentPaymentPlan = null;
  const PAYMENT_COOLDOWN = 5000; // 5 segundos

  // Inicializa o Stripe apenas quando necessário (ASYNC)
  const initStripe = async () => {
    if (!stripe && typeof Stripe !== 'undefined') {
      try {
        let stripeKey = null;

        // Tentar buscar do backend primeiro
        if (typeof getStripeKey === 'function') {
          try {
            stripeKey = await getStripeKey();
            console.log('✅ Chave obtida do backend (.env)');
          } catch (error) {
            console.warn('⚠️ Falha ao obter chave do backend:', error.message);
          }
        }

        // Se não conseguiu obter do backend, mostrar erro
        if (!stripeKey) {
          throw new Error('Não foi possível obter chave do Stripe do backend');
        }

        if (!stripeKey) {
          console.error('❌ Não foi possível obter a chave do Stripe');
          return null;
        }

        stripe = Stripe(stripeKey);
        console.log('✅ Stripe inicializado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao inicializar Stripe:', error);
        return null;
      }
    }
    return stripe;
  };

  // Inicializa o formulário de pagamento com o Stripe Elements (ASYNC)
  const initializePaymentForm = async (clientSecret) => {
    const stripeInstance = await initStripe();
    if (!stripeInstance) {
      console.error('❌ Stripe não pôde ser inicializado');
      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = 'Erro na inicialização do pagamento. Tente PIX ou Boleto.';
        el.className = 'message error';
        el.style.display = 'block';
      });
      return;
    }

    try {
      // Verificar se o container existe antes de prosseguir
      const paymentContainer = document.getElementById('payment-element');
      if (!paymentContainer) {
        console.error('❌ Elemento payment-element não encontrado');
        return;
      }

      // Limpar container
      paymentContainer.innerHTML = '';

      // Configuração compatível com Stripe Elements mais recente
      const elementsOptions = {
        clientSecret: clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#583819',
            colorBackground: '#F3EADA',
            colorText: '#443523',
            colorDanger: '#dc3545',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '6px',
          }
        },
        locale: 'pt-BR'
      };

      // Inicializar Elements
      elements = stripe.elements(elementsOptions);

      // Criar elemento de pagamento com configurações específicas
      const paymentElementOptions = {
        // Garantir compatibilidade com diferentes tipos de pagamento
        paymentMethodTypes: ['card'],
        // Configurações específicas para resolver problemas de sessão
        layout: {
          type: 'tabs',
          defaultCollapsed: false
        }
      };

      paymentElement = elements.create('payment', paymentElementOptions);

      // Tentar montar o elemento
      paymentElement.mount('#payment-element');

      // Event handlers melhorados
      paymentElement.on('change', (event) => {
        const errorElement = document.getElementById('payment-errors');
        if (errorElement) {
          if (event.error) {
            errorElement.textContent = event.error.message;
            errorElement.style.display = 'block';
          } else {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
        }
      });

      // Handler específico para erros de carregamento
      paymentElement.on('loaderror', (event) => {
        console.error('❌ Erro no carregamento do Stripe Elements:', event);

        // Mostrar alternativas para o usuário
        safeUpdateElement('paymentMessage', (el) => {
          el.innerHTML = `
            <div class="payment-error-message">
              <h4>⚠️ Problema na inicialização do cartão</h4>
              <p>Tente uma das alternativas:</p>
              <ul>
                <li>✅ <strong>PIX</strong> - Pagamento instantâneo</li>
                <li>✅ <strong>Boleto</strong> - Pagamento à vista</li>
                <li>🔄 Recarregue a página e tente novamente</li>
              </ul>
            </div>
          `;
          el.className = 'message warning';
          el.style.display = 'block';
        });

        // Esconder o formulário de cartão e mostrar alternativas
        const stripeForm = document.getElementById('stripe-payment-form');
        if (stripeForm) {
          stripeForm.style.display = 'none';
        }

        // Marcar PIX como opção padrão
        const pixRadio = document.querySelector('input[name="payment-method"][value="pix"]');
        if (pixRadio) {
          pixRadio.checked = true;
          pixRadio.dispatchEvent(new Event('change'));
        }
      });

      // Handler para quando os elementos estão prontos
      paymentElement.on('ready', () => {
        console.log('✅ Stripe Elements carregado e pronto');
        safeUpdateElement('paymentMessage', (el) => {
          el.textContent = 'Formulário de pagamento carregado com sucesso!';
          el.className = 'message success';
          el.style.display = 'block';
          // Esconder mensagem após 3 segundos
          setTimeout(() => {
            el.style.display = 'none';
          }, 3000);
        });
      });

      console.log('✅ Stripe Elements inicializado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe Elements:', error);

      // Fallback para quando há erro na inicialização
      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-fallback-message">
            <h4>❌ Erro no pagamento por cartão</h4>
            <p><strong>Recomendação:</strong> Use PIX ou Boleto</p>
            <p><small>Erro: ${error.message}</small></p>
          </div>
        `;
        el.className = 'message error';
        el.style.display = 'block';
      });

      // Automaticamente selecionar PIX como alternativa
      const pixRadio = document.querySelector('input[name="payment-method"][value="pix"]');
      if (pixRadio) {
        pixRadio.checked = true;
        pixRadio.dispatchEvent(new Event('change'));
      }
    }
  };

  // Função auxiliar para verificar se um elemento existe antes de modificá-lo
  const safeUpdateElement = (elementId, updateFunction) => {
    const element = document.getElementById(elementId);
    if (element && updateFunction) {
      updateFunction(element);
    } else if (!element) {
      console.warn(`⚠️ Elemento ${elementId} não encontrado`);
    }
  };

  // Cria uma intenção de pagamento no servidor
  const createPaymentIntent = async (planData, paymentMethod = 'card', additionalData = {}) => {
    try {
      // Verificar se é a mesma requisição (prevenção adicional)
      const planKey = `${planData.plan}-${paymentMethod}`;

      // Verificar throttling
      const now = Date.now();
      if (isCreatingPayment) {
        console.log('⏳ Já há uma requisição de pagamento em andamento...');
        return false;
      }

      if (now - lastPaymentAttempt < PAYMENT_COOLDOWN) {
        const remainingTime = Math.ceil((PAYMENT_COOLDOWN - (now - lastPaymentAttempt)) / 1000);
        safeUpdateElement('paymentMessage', (el) => {
          el.textContent = `Aguarde ${remainingTime} segundos antes de tentar novamente.`;
          el.className = 'message warning';
          el.style.display = 'block';
        });
        return false;
      }

      // Verificar se é tentativa duplicada do mesmo plano
      if (currentPaymentPlan === planKey && (now - lastPaymentAttempt) < 10000) {
        console.log('⚠️ Tentativa duplicada detectada, ignorando...');
        return false;
      }

      isCreatingPayment = true;
      lastPaymentAttempt = now;
      currentPaymentPlan = planKey;

      currentPlanData = planData;
      const userId = auth.getUser()?.id;

      if (!userId) {
        safeUpdateElement('paymentMessage', (el) => {
          el.textContent = 'Você precisa estar logado para realizar compras.';
          el.className = 'message error';
          el.style.display = 'block';
        });
        return false;
      }

      // Mostra mensagem de processamento
      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = 'Iniciando processamento...';
        el.className = 'message success';
        el.style.display = 'block';
      });

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

      console.log('🚀 Criando payment intent...', { method: paymentMethod, amount: paymentData.amount });

      // Faz a requisição para criar o PaymentIntent
      const response = await fetch(`${CONFIG.api.baseUrl}/api/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao processar pagamento';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, pega o texto bruto
          const errorText = await response.text();
          if (errorText.includes('Muitas ten')) {
            errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Guarda o ID da transação
      sessionStorage.setItem('currentTransactionId', data.transactionId);

      // Inicializa o formulário de pagamento baseado no método
      if (paymentMethod === 'card') {
        if (data.clientSecret) {
          await initializePaymentForm(data.clientSecret);
          safeUpdateElement('stripe-payment-form', (el) => el.style.display = 'block');
        }
      } else if (paymentMethod === 'pix' && data.pixData) {
        renderPixQRCode(data.pixData);
      } else if (paymentMethod === 'boleto' && data.boletoData) {
        renderBoleto(data.boletoData);
      }

      console.log('✅ Payment intent criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar intenção de pagamento:', error);
      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = `Erro: ${error.message}`;
        el.className = 'message error';
        el.style.display = 'block';
      });
      return false;
    } finally {
      // Sempre liberar o lock após um delay para evitar clicks duplos
      setTimeout(() => {
        isCreatingPayment = false;
      }, 1000);
    }
  };

  // Renderiza o QR Code do PIX na tela
  const renderPixQRCode = (pixData) => {
    // Mostrar container do PIX
    safeUpdateElement('pix-container', (el) => el.style.display = 'block');
    safeUpdateElement('stripe-payment-form', (el) => el.style.display = 'none');
    safeUpdateElement('boleto-container', (el) => el.style.display = 'none');

    // Configurar dados do PIX
    safeUpdateElement('pix-qrcode', (el) => {
      if (pixData.qr_code_url) {
        el.innerHTML = `<img src="${pixData.qr_code_url}" alt="QR Code PIX" style="width:100%;max-width:300px;"/>`;
      } else {
        el.innerHTML = '<p>QR Code será gerado em breve...</p>';
      }
    });
    safeUpdateElement('pix-code', (el) => {
      el.textContent = pixData.qr_code || 'Código PIX será gerado em breve...';
    });

    // Adicionar botão para copiar código PIX
    const copyButton = document.getElementById('copy-pix-code');
    if (copyButton && pixData.qr_code) {
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(pixData.qr_code).then(() => {
          safeUpdateElement('copy-message', (el) => {
            el.textContent = 'Código PIX copiado!';
            setTimeout(() => {
              el.textContent = '';
            }, 3000);
          });
        });
      });
    }

    // Mostrar instruções de pagamento
    safeUpdateElement('paymentMessage', (el) => {
      el.textContent = 'Escaneie o QR Code ou copie o código PIX para pagar';
      el.className = 'message success';
      el.style.display = 'block';
    });
  };

  // Renderiza o Boleto na tela
  const renderBoleto = (boletoData) => {
    // Mostrar container do boleto
    safeUpdateElement('boleto-container', (el) => el.style.display = 'block');
    safeUpdateElement('stripe-payment-form', (el) => el.style.display = 'none');
    safeUpdateElement('pix-container', (el) => el.style.display = 'none');

    // Configurar dados do boleto
    safeUpdateElement('boleto-code', (el) => {
      el.textContent = boletoData.code || 'Código do boleto será gerado em breve...';
    });

    const boletoLink = document.getElementById('boleto-link');
    if (boletoLink && boletoData.pdf_url) {
      boletoLink.href = boletoData.pdf_url;
      boletoLink.style.display = 'block';
    }

    // Adicionar botão para copiar código de barras
    const copyButton = document.getElementById('copy-boleto-code');
    if (copyButton && boletoData.code) {
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(boletoData.code).then(() => {
          safeUpdateElement('copy-boleto-message', (el) => {
            el.textContent = 'Código do boleto copiado!';
            setTimeout(() => {
              el.textContent = '';
            }, 3000);
          });
        });
      });
    }

    // Mostrar instruções de pagamento
    safeUpdateElement('paymentMessage', (el) => {
      el.textContent = 'O boleto foi gerado. Você pode imprimi-lo ou copiar o código de barras.';
      el.className = 'message success';
      el.style.display = 'block';
    });
  };

  // Processa o pagamento com o Stripe
  const processPayment = async () => {
    try {
      const submitButton = document.getElementById('submit-payment');
      if (submitButton) {
        submitButton.disabled = true;
      }

      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = 'Processando pagamento...';
        el.className = 'message success';
        el.style.display = 'block';
      });

      // Verifica o método de pagamento selecionado
      const selectedMethodInput = document.querySelector('input[name="payment-method"]:checked');
      if (!selectedMethodInput) {
        throw new Error('Selecione um método de pagamento');
      }

      const selectedMethod = selectedMethodInput.value;

      if (selectedMethod === 'card') {
        if (!stripe || !elements) {
          throw new Error('Stripe não foi inicializado corretamente');
        }

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

        const response = await fetch(`${CONFIG.api.baseUrl}/api/payment/confirm`, {
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

        const data = await response.json();

        // Atualiza os créditos do usuário localmente
        const user = auth.getUser();
        if (user) {
          user.credits = data.credits;
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Redireciona para página de sucesso
        window.location.href = 'payment-success.html';

      } else if (selectedMethod === 'pix') {
        // Obter os dados do usuário
        const user = auth.getUser();
        const name = document.getElementById('pix-name')?.value || user.name;
        const email = document.getElementById('pix-email')?.value || user.email;
        const taxId = document.getElementById('pix-cpf')?.value;

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

        return;
      } else if (selectedMethod === 'boleto') {
        // Obter os dados do usuário para o boleto
        const user = auth.getUser();
        const name = document.getElementById('boleto-name')?.value || user.name;
        const email = document.getElementById('boleto-email')?.value || user.email;
        const taxId = document.getElementById('boleto-cpf')?.value;
        const address = document.getElementById('boleto-address')?.value;
        const city = document.getElementById('boleto-city')?.value;
        const state = document.getElementById('boleto-state')?.value;
        const postalCode = document.getElementById('boleto-postal-code')?.value;

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

        return;
      }

    } catch (error) {
      console.error('❌ Erro no processamento de pagamento:', error);
      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = `Erro: ${error.message}`;
        el.className = 'message error';
        el.style.display = 'block';
      });
    } finally {
      // Re-habilita o botão independentemente do resultado
      const submitButton = document.getElementById('submit-payment');
      if (submitButton) {
        submitButton.disabled = false;
      }
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
      radio.addEventListener('change', function () {
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
    document.getElementById('pix-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      await processPayment();
    });

    document.getElementById('boleto-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      await processPayment();
    });
  };

  // Inicializa os listeners de eventos na página de pagamento
  const initListeners = () => {
    // Ouvintes para botões de compra
    const buyButtons = document.querySelectorAll('.buy-now');
    buyButtons.forEach(button => {
      button.addEventListener('click', function (e) {
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
    document.getElementById('stripe-payment-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      await processPayment();
    });

    // Ouvinte para fechar o modal
    document.querySelector('.close-modal').addEventListener('click', function () {
      document.getElementById('paymentModal').style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function (e) {
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

          const confirmResponse = await fetch(`${CONFIG.api.baseUrl}/api/payment/confirm`, {
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
