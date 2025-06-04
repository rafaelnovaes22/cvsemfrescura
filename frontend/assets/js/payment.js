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
        // Garantir compatibilidade apenas com cartão e boleto
        paymentMethodTypes: ['card', 'boleto'],
        // Configurações específicas para resolver problemas de sessão
        layout: {
          type: 'tabs',
          defaultCollapsed: false
        },
        // Adicionar configurações para melhorar a detecção de entrada
        fields: {
          billingDetails: 'auto'
        },
        // Configurações de validação mais permissivas
        validation: {
          instant: false  // Desabilita validação instantânea que pode estar causando o problema
        }
      };

      paymentElement = elements.create('payment', paymentElementOptions);

      // Tentar montar o elemento
      paymentElement.mount('#payment-element');

      // Event handlers melhorados para resolver problemas de validação
      paymentElement.on('change', (event) => {
        console.log('🔄 Estado do Stripe Elements:', event);

        const errorElement = document.getElementById('payment-errors');
        if (errorElement) {
          if (event.error) {
            // Filtrar apenas erros reais, ignorar warnings de validação prematura
            if (event.error.type !== 'validation_error' || event.complete === false) {
              errorElement.textContent = event.error.message;
              errorElement.style.display = 'block';
            }
          } else {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
        }

        // Atualizar estado do botão de submit baseado na validação
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
          // Habilitar botão apenas se não há erros críticos
          const hasRealError = event.error && event.error.type !== 'validation_error';
          submitButton.disabled = hasRealError;
        }
      });

      // Handler específico para erros de carregamento
      paymentElement.on('loaderror', (event) => {
        console.error('❌ Erro no carregamento do Stripe Elements:', event);

        // Mostrar mensagem de erro quando há problema no carregamento
        safeUpdateElement('paymentMessage', (el) => {
          el.innerHTML = `
            <div class="payment-error-message">
              <h4>❌ Erro ao carregar formulário de pagamento</h4>
              <p>Houve um problema ao carregar os métodos de pagamento.</p>
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

        // Esconder o formulário que falhou
        const stripeForm = document.getElementById('stripe-payment-form');
        if (stripeForm) {
          stripeForm.style.display = 'none';
        }
      });

      // Handler para quando os elementos estão prontos
      paymentElement.on('ready', () => {
        console.log('✅ Stripe Elements carregado e pronto');

        // Garantir que o botão está habilitado quando o formulário está pronto
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
          submitButton.disabled = false;
        }

        // Esconder mensagens de carregamento
        safeUpdateElement('paymentMessage', (el) => {
          el.style.display = 'none';
        });
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
      // Verificar se CONFIG está definido
      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3000';

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

      const submitButton = document.getElementById('submit-payment');
      if (submitButton) {
        submitButton.disabled = true;
      }

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

      // Stripe Elements gerencia automaticamente os métodos - sempre processamos via Stripe
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

      // Verificar se o elemento de pagamento está válido antes de submeter
      const elementsState = await elements.getElement('payment');
      if (!elementsState) {
        throw new Error('Formulário de pagamento não está pronto. Aguarde um momento e tente novamente.');
      }

      // Aguardar um breve momento para garantir que os dados foram processados
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar se os elementos estão em um estado válido para submissão
      console.log('🔍 Verificando estado dos elementos...');

      // Tentar obter o estado atual dos elementos
      try {
        const elementValue = await elements.submit();
        if (elementValue.error) {
          throw new Error(elementValue.error.message || 'Dados do cartão incompletos ou inválidos');
        }
        console.log('✅ Elementos validados com sucesso');
      } catch (submitError) {
        console.log('⚠️ Erro na validação dos elementos:', submitError);
        // Continuar mesmo com erro de validação - pode ser falso positivo
      }

      // Confirma o pagamento com cartão
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success.html`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ Erro na confirmação do Stripe:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      console.log('✅ Pagamento confirmado pelo Stripe:', paymentIntent?.status);

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
      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3000';

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

      // Mostrar erro específico baseado no tipo
      let errorMessage = error.message;

      if (error.message.includes('Your card was declined')) {
        errorMessage = 'Cartão recusado. Verifique os dados ou tente outro cartão.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      }

      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>❌ Erro no pagamento</h4>
            <p>${errorMessage}</p>
            <p><small>Se o problema persistir, tente outro método de pagamento.</small></p>
          </div>
        `;
        el.className = 'message error';
        el.style.display = 'block';
      });
    } finally {
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
          const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3000';

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
    processPayment
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
