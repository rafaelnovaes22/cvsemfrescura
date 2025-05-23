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

      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-error-message">
            <h4>⚠️ Carregando sistema de pagamento...</h4>
            <p>O sistema está carregando. Aguarde alguns segundos e tente novamente.</p>
            <p><strong>Se o problema persistir:</strong></p>
            <ul>
              <li>🔄 Recarregue a página</li>
              <li>✅ Use PIX ou Boleto como alternativa</li>
            </ul>
          </div>
        `;
        el.className = 'message warning';
        el.style.display = 'block';
      });

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

      // Limpar mensagens de erro se houver
      safeUpdateElement('paymentMessage', (el) => {
        if (el.textContent.includes('Carregando sistema') || el.textContent.includes('Erro na configuração')) {
          el.style.display = 'none';
        }
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
              <li>✅ Usar PIX ou Boleto</li>
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

      // Esconder formulário de cartão e ativar PIX automaticamente
      const stripeForm = document.getElementById('stripe-payment-form');
      if (stripeForm) {
        stripeForm.style.display = 'none';
      }

      // Marcar PIX como padrão
      const pixRadio = document.querySelector('input[name="payment-method"][value="pix"]');
      if (pixRadio) {
        pixRadio.checked = true;
        pixRadio.dispatchEvent(new Event('change'));
      }

      safeUpdateElement('paymentMessage', (el) => {
        el.innerHTML = `
          <div class="payment-fallback-message">
            <h4>⚠️ Problema com pagamento por cartão</h4>
            <p>Selecionamos automaticamente o <strong>PIX</strong> para você.</p>
            <p><small>PIX é mais rápido e não tem taxas!</small></p>
          </div>
        `;
        el.className = 'message warning';
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
        // Apenas ignorar tentativas duplicadas muito rápidas (menos de 500ms)
        if (now - lastPaymentAttempt < 500) {
          return false;
        }
        // Se passou mais de 500ms, permitir nova tentativa
        isCreatingPayment = false;
      }

      if (now - lastPaymentAttempt < PAYMENT_COOLDOWN) {
        const remainingTime = Math.ceil((PAYMENT_COOLDOWN - (now - lastPaymentAttempt)) / 1000);
        if (remainingTime > 1) { // Só mostrar se for mais de 1 segundo
          safeUpdateElement('paymentMessage', (el) => {
            el.textContent = `Aguarde ${remainingTime} segundos antes de tentar novamente.`;
            el.className = 'message warning';
            el.style.display = 'block';
          });
          return false;
        }
      }

      // Verificar se é tentativa duplicada do mesmo plano (só para tentativas muito rápidas)
      if (currentPaymentPlan === planKey && (now - lastPaymentAttempt) < 1000) {
        console.log('⚠️ Tentativa duplicada muito rápida detectada, ignorando...');
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
      const response = await fetch(`${window.CONFIG.api.baseUrl}/api/payment/create-intent`, {
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
      // Sempre liberar o lock após um delay menor para evitar clicks duplos
      setTimeout(() => {
        isCreatingPayment = false;
      }, 500);
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

      // Verificar se o usuário está autenticado
      const user = auth?.getUser();
      if (!user) {
        throw new Error('Você precisa estar logado para realizar pagamentos');
      }

      console.log('👤 Usuário autenticado:', user.email);

      // Verifica o método de pagamento selecionado
      const selectedMethodInput = document.querySelector('input[name="payment-method"]:checked');
      if (!selectedMethodInput) {
        throw new Error('Selecione um método de pagamento');
      }

      const selectedMethod = selectedMethodInput.value;
      console.log('💰 Método de pagamento selecionado:', selectedMethod);

      if (selectedMethod === 'card') {
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

        const response = await fetch(`${window.CONFIG.api.baseUrl}/api/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.getToken()}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntentId,
            transactionId: transactionId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Erro na confirmação do servidor:', errorData);
          throw new Error(errorData.error || 'Erro ao confirmar pagamento no servidor');
        }

        const data = await response.json();
        console.log('✅ Pagamento confirmado no servidor:', data);

        // Atualiza os créditos do usuário localmente
        const currentUser = auth.getUser();
        if (currentUser && data.credits) {
          currentUser.credits = data.credits;
          localStorage.setItem('user', JSON.stringify(currentUser));
          console.log('✅ Créditos atualizados localmente:', data.credits);
        }

        // Limpar dados de sessão
        sessionStorage.removeItem('currentTransactionId');
        sessionStorage.removeItem('paymentIntentId');

        // Mostrar mensagem de sucesso antes de redirecionar
        safeUpdateElement('paymentMessage', (el) => {
          el.innerHTML = `
            <div class="payment-success-message">
              <h4>✅ Pagamento realizado com sucesso!</h4>
              <p>Seus créditos foram adicionados à sua conta.</p>
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

          const confirmResponse = await fetch(`${window.CONFIG.api.baseUrl}/api/payment/confirm`, {
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
