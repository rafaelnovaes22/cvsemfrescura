// Inicializa o objeto de pagamento
const payment = (() => {
  // Verifica se o Stripe está disponível e inicializa
  let stripe = null;
  let elements;
  let paymentElement;
  let currentPlanData = {};

  // Variáveis de estado para controle de validação
  let hasUserAttemptedSubmit = false;
  let isProcessingPayment = false;
  let paymentConfirmedSuccessfully = false;

  // Sistema de throttling para evitar spam de requisições
  let isCreatingPayment = false;
  let lastPaymentAttempt = 0;
  let currentPaymentPlan = null;
  const PAYMENT_COOLDOWN = 2000; // 2 segundos (reduzido de 5)

  // Usar a função global de getStripeKey do config.js
  const getStripeKey = window.getStripeKey;

  // Inicializa o Stripe apenas quando necessário (ASYNC)
  const initStripe = async () => {
    // Se já temos Stripe inicializado, retornar
    if (stripe) {
      console.log('✅ Stripe já estava inicializado');
      return stripe;
    }

    // Verificar se Stripe.js está carregado
    if (typeof Stripe === 'undefined') {
      console.error('❌ Stripe.js não está carregado');

      // Remover mensagem de carregamento - desnecessária

      // Tentar aguardar um pouco e verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (typeof Stripe === 'undefined') {
        return null;
      }
    }

    try {
      console.log('🔄 Obtendo chave do Stripe...');
      const stripeKey = await getStripeKey();

      if (!stripeKey) {
        throw new Error('Chave do Stripe não foi fornecida pelo backend');
      }

      console.log('🔑 Chave obtida, inicializando Stripe...');
      stripe = Stripe(stripeKey);
      console.log('✅ Stripe inicializado com sucesso');

      // Limpar mensagens antigas
      safeUpdateElement('paymentMessage', (el) => {
        el.style.display = 'none';
      });

      return stripe;
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);

      // Mostrar mensagem de erro para o usuário
      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>❌ Erro na configuração do pagamento</h4>
            <p>Não foi possível conectar com o sistema de pagamentos.</p>
            <p><strong>Tente:</strong></p>
            <ul>
              <li>🔄 Recarregar a página</li>
              <li>✅ Usar Boleto</li>
              <li>📧 Entrar em contato pelo suporte</li>
            </ul>
            <p><small>Erro: ${error.message}</small></p>
          </div>
        `;
        el.className = 'message error';
        el.style.display = 'block';
      });

      return null;
    }
  };

  // Inicializa o formulário de pagamento com o Stripe Elements (ASYNC)
  const initializePaymentForm = async (clientSecret) => {
    console.log('🎯 Inicializando formulário de pagamento...');

    // Verificar se já existe um paymentElement ativo e o container não está vazio
    const paymentContainer = document.getElementById('payment-element');
    if (paymentElement && paymentContainer && paymentContainer.children.length > 0) {
      console.log('✅ Stripe Elements já inicializado e ativo');
      return true;
    }

    const stripeInstance = await initStripe();
    if (!stripeInstance) {
      console.error('❌ Stripe não pôde ser inicializado');

      // Mostrar mensagem de erro quando Stripe não carrega
      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>❌ Erro na conexão com sistema de pagamento</h4>
            <p>Não foi possível carregar o processador de pagamentos.</p>
            <p><strong>Tente:</strong></p>
            <ul>
              <li>🔄 Recarregar a página</li>
              <li>🌐 Verificar sua conexão com internet</li>
              <li>📧 Entrar em contato com o suporte se persistir</li>
            </ul>
          </div>
        `;
        el.className = 'message error';
        el.style.display = 'block';
      });

      return false;
    }

    try {
      // Verificar se o container existe antes de prosseguir
      if (!paymentContainer) {
        console.error('❌ Elemento payment-element não encontrado');
        return;
      }

      // Limpar container apenas se necessário
      if (paymentContainer.children.length > 0) {
        paymentContainer.innerHTML = '';
      }

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

      // Criar elemento de pagamento com configurações aprimoradas
      const paymentElementOptions = {
        layout: {
          type: 'tabs',
          defaultCollapsed: false,
          radios: false,
          spacedAccordionItems: false
        },
        fields: {
          billingDetails: 'auto'
        },
        // Configurações para reduzir validações prematuras
        wallets: {
          applePay: 'never',
          googlePay: 'never'
        }
      };

      paymentElement = elements.create('payment', paymentElementOptions);

      // Tentar montar o elemento
      paymentElement.mount('#payment-element');

      // Event handlers para Stripe Elements - apenas suprimir validações prematuras
      paymentElement.on('change', (event) => {
        // Se pagamento foi confirmado com sucesso, suprimir TODAS as validações
        if (paymentConfirmedSuccessfully) {
          const errorElement = document.getElementById('payment-errors');
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
          return; // Não processar mais nada
        }

        // Sempre limpar erros se ainda não tentou submeter
        if (!hasUserAttemptedSubmit) {
          const errorElement = document.getElementById('payment-errors');
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
        }

        // Manter botão habilitado (exceto durante processamento)
        const submitButton = document.getElementById('submit-payment');
        if (submitButton && !isProcessingPayment) {
          submitButton.disabled = false;
        }

        // Processar erros normalmente APENAS após tentativa de submissão
        if (event.error && hasUserAttemptedSubmit && !paymentConfirmedSuccessfully) {
          const errorElement = document.getElementById('payment-errors');
          if (errorElement) {
            errorElement.textContent = event.error.message;
            errorElement.style.display = 'block';
          }
        }
      });

      // Handler para blur - suprimir se pagamento confirmado
      paymentElement.on('blur', (event) => {
        if (paymentConfirmedSuccessfully) {
          const errorElement = document.getElementById('payment-errors');
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
          return;
        }

        if (!hasUserAttemptedSubmit) {
          const errorElement = document.getElementById('payment-errors');
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
        }
      });

      // Handler para focus - sempre limpar erros
      paymentElement.on('focus', (event) => {
        const errorElement = document.getElementById('payment-errors');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
        }

        // Se pagamento confirmado, não fazer mais nada
        if (paymentConfirmedSuccessfully) {
          return;
        }

        // Sempre garantir botão habilitado
        const submitButton = document.getElementById('submit-payment');
        if (submitButton && !isProcessingPayment) {
          submitButton.disabled = false;
        }
      });

      // Handler para quando os elementos estão prontos
      paymentElement.on('ready', () => {
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
          submitButton.disabled = false;
        }

        // Esconder mensagens de carregamento
        const messageEl = document.getElementById('paymentMessage');
        if (messageEl) {
          messageEl.style.display = 'none';
        }
      });

      console.log('✅ Stripe Elements inicializado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe Elements:', error);

      // Mostrar mensagem de erro quando há problema na inicialização
      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>❌ Erro ao carregar formulário de pagamento</h4>
            <p>Houve um problema ao inicializar o sistema de pagamentos.</p>
            <p><strong>Erro:</strong> ${error.message}</p>
            <p><strong>Tente:</strong></p>
            <ul>
              <li>🔄 Recarregar a página</li>
              <li>🌐 Verificar sua conexão com internet</li>
              <li>📧 Entrar em contato com o suporte</li>
            </ul>
          </div>
        `;
        el.className = 'message error';
        el.style.display = 'block';
      });

      return false;
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
  const createPaymentIntent = async (planData, paymentMethod = 'card', additionalData = {}, showErrors = true) => {
    // Lock para evitar múltiplas criações simultâneas
    if (isCreatingPayment) {
      console.warn('⚠️ Já está criando pagamento, ignorando requisição duplicada');
      return false;
    }
    isCreatingPayment = true;

    try {
      // Usar CONFIG - sempre disponível
      const apiBaseUrl = (() => {
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          return window.CONFIG.api.baseUrl;
        }

        // Se CONFIG não estiver disponível, falhar explicitamente
        console.error('❌ CONFIG não disponível em createPaymentIntent!');
        throw new Error('Configuração não disponível');
      })();

      const paymentData = {
        amount: parseFloat(planData.price),
        planName: planData.plan,
        credits: parseInt(planData.credits),
        paymentMethod: paymentMethod
      };

      // Adiciona dados específicos para cada método de pagamento
      if (paymentMethod === 'boleto') {
        Object.assign(paymentData, additionalData);
      }

      console.log('🚀 Criando payment intent...', { method: paymentMethod, amount: paymentData.amount });
      console.log('📊 Dados completos sendo enviados:', paymentData);
      console.log('🔍 Validação dos dados:');
      console.log('   amount:', paymentData.amount, typeof paymentData.amount);
      console.log('   planName:', paymentData.planName, typeof paymentData.planName);
      console.log('   credits:', paymentData.credits, typeof paymentData.credits);
      console.log('   paymentMethod:', paymentData.paymentMethod, typeof paymentData.paymentMethod);
      console.log('👤 Token de autenticação:', auth.getToken() ? 'Presente' : 'Ausente');

      // Faz a requisição para criar o PaymentIntent
      const response = await fetch(`${apiBaseUrl}/api/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify(paymentData)
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Status text:', response.statusText);

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
          const stripeInitialized = await initializePaymentForm(data.clientSecret);
          // Só mostrar o formulário se o Stripe Elements realmente conseguiu inicializar
          if (stripeInitialized !== false) {
            safeUpdateElement('stripe-payment-form', (el) => el.style.display = 'block');
            console.log('✅ Formulário Stripe Elements exibido');
          }
        }

      } else if (paymentMethod === 'boleto' && data.boletoData) {
        renderBoleto(data.boletoData);
      }

      console.log('✅ Payment intent criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar intenção de pagamento:', error);
      if (showErrors) {
        safeUpdateElement('paymentMessage', (el) => {
          el.textContent = `Erro: ${error.message}`;
          el.className = 'message error';
          el.style.display = 'block';
        });
      }
      return false;
    } finally {
      // Sempre liberar o lock após um delay menor para evitar clicks duplos
      setTimeout(() => {
        isCreatingPayment = false;
      }, 500);
    }
  };

  // Funções obsoletas: renderBoleto removida
  // Stripe Elements agora gerencia automaticamente as interfaces de Boleto

  // Processa o pagamento com o Stripe
  const processPayment = async () => {
    try {
      console.log('💳 Iniciando processamento de pagamento...');

      // Declarar errorElement UMA única vez
      let errorElement = document.getElementById('payment-errors');

      // Limpar erros existentes antes de iniciar
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }

      const messageEl = document.getElementById('paymentMessage');
      if (messageEl) {
        messageEl.textContent = '';
        messageEl.style.display = 'none';
      }

      // MARCAR que o usuário tentou submeter - agora validações podem aparecer
      hasUserAttemptedSubmit = true;
      isProcessingPayment = true;

      const submitButton = document.getElementById('submit-payment');
      if (submitButton) {
        submitButton.disabled = true;
      }

      // Aguardar um momento para garantir que interface está limpa
      await new Promise(resolve => setTimeout(resolve, 100));

      safeUpdateElement('paymentMessage', (el) => {
        el.textContent = 'Processando pagamento...';
        el.className = 'message success';
        el.style.display = 'block';
      });

      // Verificar se o usuário está autenticado OU se há dados de checkout rápido
      const user = auth?.getUser();
      let guestData = null;

      if (!user) {
        // Verificar se temos dados de checkout rápido
        if (typeof window.getGuestCheckoutData === 'function') {
          guestData = window.getGuestCheckoutData();
          if (!guestData || !guestData.name || !guestData.email) {
            throw new Error('Preencha os dados do checkout rápido para continuar');
          }
          console.log('👤 Processando checkout rápido para:', guestData.email);
        } else {
          throw new Error('Você precisa estar logado para realizar pagamentos');
        }
      } else {
        console.log('👤 Usuário autenticado:', user.email);
      }

      // Verificar se Stripe Elements está pronto
      console.log('💳 Processando pagamento com cartão...');

      if (!stripe || !elements) {
        console.error('❌ Stripe ou Elements não inicializados');
        throw new Error('Sistema de pagamento não está pronto. Tente recarregar a página.');
      }

      // Verificar se o elemento de pagamento existe
      if (!paymentElement) {
        console.error('❌ Elemento de pagamento não criado');
        throw new Error('Formulário de pagamento não carregado. Tente recarregar a página.');
      }

      console.log('🔄 Confirmando pagamento com Stripe...');

      // CONFIRMAR PAGAMENTO DIRETAMENTE - sem pré-validação
      const confirmParams = {
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success.html`,
        },
        redirect: 'if_required'
      };

      const { error, paymentIntent } = await stripe.confirmPayment(confirmParams);

      // Se há erro, verificar o tipo
      if (error) {
        console.log('⚠️ Erro no Stripe:', error);

        // Verificar se é erro de campo em branco/incompleto
        const isBlankFieldError =
          error.code === 'incomplete_number' ||
          error.code === 'incomplete_cvc' ||
          error.code === 'incomplete_expiry' ||
          error.code === 'incomplete_zip' ||
          error.code === 'validation_error' ||
          error.message?.includes('incomplete') ||
          error.message?.includes('complete') ||
          error.message?.includes('em branco') ||
          error.message?.includes('preenchido') ||
          error.message?.includes('required') ||
          error.message?.includes('missing');

        if (isBlankFieldError) {
          console.log('❌ Campos em branco detectados - informando usuário');
          throw new Error('Preencha todos os campos do cartão: número, data de expiração e CVV.');
        } else {
          // Erro diferente (cartão recusado, etc.)
          throw new Error(error.message || 'Erro ao processar pagamento');
        }
      }

      console.log('✅ Pagamento confirmado pelo Stripe:', paymentIntent?.status);

      // MARCAR pagamento como confirmado com sucesso ANTES de continuar
      paymentConfirmedSuccessfully = true;

      // Limpar QUALQUER erro que possa ter aparecido - reutilizando errorElement
      errorElement = document.getElementById('payment-errors');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }

      // Iniciar limpeza contínua para garantir que nenhuma validação apareça após sucesso
      const successCleanupInterval = setInterval(() => {
        const errorElementCleanup = document.getElementById('payment-errors');
        if (errorElementCleanup && errorElementCleanup.textContent) {
          errorElementCleanup.textContent = '';
          errorElementCleanup.style.display = 'none';
        }
      }, 50);

      // Parar limpeza após redirecionamento
      setTimeout(() => {
        clearInterval(successCleanupInterval);
      }, 3000);

      // Se chegou aqui, o pagamento foi processado com sucesso
      // Confirma o pagamento no servidor
      const transactionId = sessionStorage.getItem('currentTransactionId');
      const paymentIntentId = paymentIntent?.id || sessionStorage.getItem('paymentIntentId');

      if (!paymentIntentId) {
        console.error('❌ PaymentIntent ID não encontrado');
        throw new Error('ID do pagamento não encontrado');
      }

      console.log('🔍 Confirmando pagamento no servidor:', paymentIntentId);

      // Preparar headers e dados da requisição
      const headers = {
        'Content-Type': 'application/json'
      };

      const requestBody = {
        paymentIntentId: paymentIntentId,
        transactionId: transactionId
      };

      // Se é usuário logado, adicionar token de autenticação
      if (user) {
        headers['Authorization'] = `Bearer ${auth.getToken()}`;
      } else if (guestData) {
        // Para checkout rápido, incluir dados do guest
        requestBody.guestData = guestData;
      }

      // Verificar se CONFIG está definido
      const apiBaseUrl = (() => {
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          return window.CONFIG.api.baseUrl;
        }

        // Se CONFIG não estiver disponível, falhar explicitamente
        console.error('❌ CONFIG não disponível em processPayment!');
        throw new Error('Configuração não disponível');
      })();

      const response = await fetch(`${apiBaseUrl}/api/payment/confirm`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na confirmação do servidor:', errorData);
        throw new Error(errorData.error || 'Erro ao confirmar pagamento no servidor');
      }

      const data = await response.json();
      console.log('✅ Pagamento confirmado no servidor:', data);

      // Atualiza os créditos do usuário localmente (apenas para usuários logados)
      const currentUser = auth.getUser();
      if (currentUser && data.credits) {
        currentUser.credits = data.credits;
        localStorage.setItem('user', JSON.stringify(currentUser));
        console.log('✅ Créditos atualizados localmente:', data.credits);
      }

      // Limpar dados de sessão
      sessionStorage.removeItem('currentTransactionId');
      sessionStorage.removeItem('paymentIntentId');

      // Salvar dados para página de sucesso
      if (guestData && guestData.email) {
        sessionStorage.setItem('guestCheckoutEmail', guestData.email);
        console.log('✅ Dados do checkout rápido salvos para página de sucesso');
      }

      // Mostrar mensagem de sucesso antes de redirecionar
      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
            <div class="payment-success-message">
              <h4>✅ Pagamento realizado com sucesso!</h4>
              <p>${guestData ? 'Sua conta foi criada e os créditos adicionados.' : 'Seus créditos foram adicionados à sua conta.'}</p>
              <p>Redirecionando...</p>
            </div>
          `;
        el.className = 'message success';
        el.style.display = 'block';
      });

      // Redireciona após um pequeno delay
      setTimeout(() => {
        window.location.href = 'payment-success.html';
      }, 2000);

    } catch (error) {
      console.error('❌ Erro no processamento de pagamento:', error);

      // Tratamento inteligente de erros baseado no tipo e mensagem
      let errorMessage = error.message;
      let errorType = 'error';

      // Erros de validação de campos
      if (error.message.includes('incomplete') ||
        error.message.includes('dados do cartão') ||
        error.message.includes('preenchidos corretamente') ||
        error.message.includes('Preencha todos os campos')) {
        errorMessage = 'Preencha todos os campos do cartão: número, data de expiração e CVV.';
        errorType = 'warning';

        // Erros de cartão recusado
      } else if (error.message.includes('Your card was declined') ||
        error.message.includes('declined')) {
        errorMessage = 'Cartão recusado. Verifique os dados ou tente outro cartão.';

        // Erros de rede
      } else if (error.message.includes('network') ||
        error.message.includes('conexão')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';

        // Erros de autenticação
      } else if (error.message.includes('authentication') ||
        error.message.includes('token') ||
        error.message.includes('login')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';

        // Erros relacionados ao formulário não estar pronto
      } else if (error.message.includes('formulário') ||
        error.message.includes('não encontrado') ||
        error.message.includes('carregou')) {
        errorMessage = 'Formulário de pagamento não carregou completamente. Tente recarregar a página.';

        // Erros de CVV ou dados de segurança
      } else if (error.message.includes('cvc') ||
        error.message.includes('security') ||
        error.message.includes('cvv')) {
        errorMessage = 'Código de segurança (CVV) inválido. Verifique o código no verso do cartão.';

        // Erros de data de expiração
      } else if (error.message.includes('expiry') ||
        error.message.includes('expiration') ||
        error.message.includes('expiração')) {
        errorMessage = 'Data de expiração inválida. Verifique o mês e ano do cartão.';

        // Outros erros do Stripe
      } else if (error.message.includes('stripe') ||
        error.message.includes('payment')) {
        errorMessage = 'Erro no processamento do pagamento. Tente novamente em alguns minutos.';
      }

      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>❌ ${errorType === 'warning' ? 'Atenção' : 'Erro no pagamento'}</h4>
            <p>${errorMessage}</p>
            ${errorType === 'warning' ?
            '<p><small><strong>Dica:</strong> Certifique-se de preencher número do cartão, data de expiração e CVV completamente.</small></p>' :
            '<p><small>Se o problema persistir, tente outro método de pagamento ou entre em contato conosco.</small></p>'
          }
          </div>
        `;
        el.className = `message ${errorType}`;
        el.style.display = 'block';
      });
    } finally {
      // IMPORTANTE: Resetar estados de processamento
      isProcessingPayment = false;
      // NÃO resetar hasUserAttemptedSubmit - deixar ativo para próximas validações

      // Re-habilita o botão independentemente do resultado
      setTimeout(() => {
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
          submitButton.disabled = false;
          console.log('🔄 Botão de pagamento reabilitado');
        }
      }, 1000); // Delay de 1 segundo para evitar spam
    }
  };

  // Método obsoleto: Stripe Elements agora gerencia automaticamente os métodos de pagamento
  const togglePaymentMethods = () => {
    // Função removida - Stripe Elements agora controla a interface automaticamente
    console.log('ℹ️ togglePaymentMethods obsoleta - Stripe Elements ativo');
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

        // Inicializa o formulário (Stripe Elements gerencia os métodos automaticamente)
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

          // Verificar se CONFIG está definido
          const apiBaseUrl = (() => {
            if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
              return window.CONFIG.api.baseUrl;
            }

            // Se CONFIG não estiver disponível, falhar explicitamente
            console.error('❌ CONFIG não disponível em processPayment!');
            throw new Error('Configuração não disponível');
          })();

          const confirmResponse = await fetch(`${apiBaseUrl}/api/payment/confirm`, {
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
    checkPaymentStatus,
    initStripe,
    createPaymentIntent,
    processPayment,
    // Expor variável de controle para proteção global
    get isPaymentConfirmed() { return paymentConfirmedSuccessfully; },
    get isProcessing() { return isProcessingPayment; }
  };
})();

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Sistema de pagamento carregado');

  // Inicializar listeners se estiver na página de pagamento
  if (document.getElementById('paymentModal') || document.querySelector('.buy-now')) {
    payment.initListeners();
    console.log('✅ Listeners de pagamento inicializados');
  }

  // Verificar status de pagamento se estiver na página de sucesso
  if (window.location.pathname.includes('payment-success')) {
    payment.checkPaymentStatus().then(result => {
      if (result) {
        console.log('Status do pagamento:', result);
      }
    });
  }
});
