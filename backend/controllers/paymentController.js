// Integração com Stripe para pagamentos - CV Sem Frescura
const config = require('../config/environment');

let stripe = null;

// Função para inicializar o Stripe
function initializeStripe() {
  try {
    // Usar configuração de ambiente para determinar as chaves  
    const stripeConfig = config.stripe;
    let secretKey = stripeConfig.secretKey;

    // 🧹 LIMPEZA ADICIONAL (backup safety)
    if (secretKey && typeof secretKey === 'string') {
      console.log('[STRIPE] 🔍 Chave original:', secretKey ? `${secretKey.substring(0, 10)}...` : 'NULL');

      // Limpeza extra por segurança
      secretKey = secretKey.trim().replace(/[\r\n\t\u0000-\u001f]/g, '');

      console.log('[STRIPE] 🧹 Chave limpa:', secretKey ? `${secretKey.substring(0, 10)}...` : 'NULL');
      console.log('[STRIPE] 🔍 Length original vs limpa:', stripeConfig.secretKey?.length, 'vs', secretKey.length);
    }

    // ✅ ACEITAR TANTO CHAVES COMPLETAS (sk_) QUANTO CHAVES RESTRITAS (rk_)
    // Chaves restritas são mais seguras e recomendadas pelo Stripe
    const isValidStripeKey = secretKey && (secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));

    if (isValidStripeKey) {
      const Stripe = require('stripe');
      stripe = Stripe(secretKey);

      console.log('[STRIPE] ✅ Integração configurada com Stripe');
      console.log('[STRIPE] 🌍 Ambiente:', config.environment.name);
      console.log('[STRIPE] 🔑 Tipo de chave:', stripeConfig.environment);
      console.log('[STRIPE] 🔐 Tipo de key:', secretKey.startsWith('sk_') ? 'Completa (sk_)' : 'Restrita (rk_) - Mais Segura');
      console.log('[STRIPE] 🔑 Chave:', secretKey.substring(0, 20) + '...');
      return true;
    } else {
      console.log('[STRIPE] ⚠️ STRIPE_SECRET_KEY não configurada ou inválida.');
      console.log('[STRIPE] 🔍 Debug - secretKey exists:', !!secretKey);
      console.log('[STRIPE] 🔍 Debug - secretKey type:', typeof secretKey);
      console.log('[STRIPE] 🔍 Debug - secretKey length:', secretKey?.length || 0);
      console.log('[STRIPE] 🔍 Debug - startsWith sk_:', secretKey ? secretKey.startsWith('sk_') : 'N/A');
      console.log('[STRIPE] 🔍 Debug - startsWith rk_:', secretKey ? secretKey.startsWith('rk_') : 'N/A');

      if (secretKey && secretKey.length > 0) {
        console.log('[STRIPE] 🔍 First 20 chars:', JSON.stringify(secretKey.substring(0, 20)));
      }

      return false;
    }
  } catch (stripeError) {
    console.log('[STRIPE] ❌ Erro ao inicializar Stripe:', stripeError.message);
    console.log('[STRIPE] ⚠️ Funcionalidades de pagamento desabilitadas.');
    stripe = null;
    return false;
  }
}

// Função para garantir que o Stripe está inicializado
function ensureStripeInitialized() {
  if (!stripe) {
    console.log('[STRIPE] 🔄 Tentando re-inicializar Stripe...');
    return initializeStripe();
  }
  return true;
}

// Inicialização inicial
initializeStripe();

const Transaction = require('../models/Transaction');
const User = require('../models/user');

// Cria uma intenção de pagamento no Stripe
exports.createPaymentIntent = async (req, res) => {
  try {
    // Verificar se Stripe está configurado e tentar re-inicializar se necessário
    if (!stripe) {
      console.log('[PAYMENT] ⚠️ Stripe não inicializado, tentando re-inicializar...');
      if (!ensureStripeInitialized()) {
        return res.status(503).json({
          error: 'Serviço de pagamento indisponível',
          details: 'Stripe não configurado no servidor'
        });
      }
    }

    const { amount, planName, credits, paymentMethod, guestUser } = req.body;

    if (!amount || !planName || !credits || !paymentMethod) {
      return res.status(400).json({ error: 'Informações de pagamento incompletas' });
    }

    // Converte o valor para centavos (Stripe trabalha com centavos)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    console.log(`[PAYMENT] 🎯 Criando pagamento: ${paymentMethod} - R$ ${amount} - ${credits} créditos`);

    // Opções básicas para o PaymentIntent
    const userId = req.user ? req.user.id : 'anonymous';
    const userEmail = req.user ? req.user.email : (guestUser ? guestUser.email : req.body.email || 'anonymous@example.com');

    const paymentIntentOptions = {
      amount: amountInCents,
      currency: 'brl',
      metadata: {
        userId: userId,
        planName,
        credits: credits.toString(),
        guestEmail: guestUser ? guestUser.email : null,
        guestName: guestUser ? guestUser.name : null
      }
    };

    console.log(`[PAYMENT] 🔧 PaymentIntent options:`, {
      amount: paymentIntentOptions.amount,
      currency: paymentIntentOptions.currency,
      paymentMethod,
      environment: config.environment.name
    });

    // Configura opções específicas baseadas no método de pagamento
    if (paymentMethod === 'card') {
      // Para cartão de crédito - configuração mais compatível
      paymentIntentOptions.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never' // Evitar redirecionamentos problemáticos
      };

      // Em produção, adicionar configurações específicas
      if (config.environment.name === 'production') {
        console.log('[PAYMENT] 🚀 Configuração específica para produção');
        paymentIntentOptions.confirm = false;
        paymentIntentOptions.capture_method = 'automatic';
      }

      console.log('[PAYMENT] 💳 Configurando pagamento por cartão');
    } else if (paymentMethod === 'boleto') {
      // Para boleto
      paymentIntentOptions.payment_method_types = ['boleto'];

      // Dados do boleto
      const boletoData = {
        type: 'boleto',
        boleto: {
          tax_id: req.body.taxId || '00000000000',
        },
        billing_details: {
          name: req.body.name || 'Nome do Pagador',
          email: req.body.email || userEmail,
          address: {
            line1: req.body.address || 'Endereço do Pagador',
            city: req.body.city || 'Cidade',
            state: req.body.state || 'Estado',
            postal_code: req.body.postalCode || '00000000',
            country: 'BR'
          }
        }
      };

      paymentIntentOptions.payment_method_data = boletoData;
      console.log('[PAYMENT] 🧾 Configurando pagamento por boleto');

    } else {
      return res.status(400).json({ error: 'Método de pagamento não suportado' });
    }

    // Cria o PaymentIntent com as opções configuradas
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    console.log('[PAYMENT] ✅ PaymentIntent criado:', paymentIntent.id);

    // Resposta base
    const response = {
      clientSecret: paymentIntent.client_secret
    };

    // Adiciona dados específicos para Boleto
    if (paymentMethod === 'boleto') {
      // Para Boleto, vamos criar os dados do boleto
      response.boletoData = {
        code: paymentIntent.next_action?.boleto_display_details?.number || 'BOLETO_CODE_PLACEHOLDER',
        pdf_url: paymentIntent.next_action?.boleto_display_details?.pdf || null,
        expires_at: paymentIntent.next_action?.boleto_display_details?.expires_at || null
      };
      console.log('[PAYMENT] 🧾 Dados do boleto adicionados à resposta');
    }

    try {
      // Tenta criar o registro da transação no banco (apenas se usuário estiver logado)
      if (req.user) {
        const transaction = await Transaction.create({
          userId: req.user.id,
          amount: amount,
          credits: credits,
          status: 'pending',
          paymentMethod: paymentMethod,
          paymentIntentId: paymentIntent.id,
          metadata: {
            planName,
            paymentMethod
          }
        });

        console.log('[PAYMENT] 💾 Transação salva no banco:', transaction.id);
        response.transactionId = transaction.id;
      } else {
        console.log('[PAYMENT] ⚠️ Usuário anônimo - transação não salva no banco');
      }

    } catch (dbError) {
      console.warn('[PAYMENT] ⚠️ Aviso: Não foi possível salvar a transação no banco de dados. Continuando sem ID.', dbError.message);

      // Se não conseguir criar no banco, adiciona os créditos diretamente (apenas para desenvolvimento e usuário logado)
      if (process.env.NODE_ENV === 'development' && req.user) {
        try {
          const user = await User.findByPk(req.user.id);
          if (user) {
            const currentCredits = user.credits || 0;
            await user.update({
              credits: currentCredits + parseInt(credits)
            });
            console.log(`[PAYMENT] 🎁 Créditos adicionados diretamente (DEV): ${credits} para o usuário ${req.user.id}`);
          }
        } catch (userError) {
          console.error('[PAYMENT] ❌ Erro ao atualizar créditos do usuário:', userError);
        }
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[PAYMENT] ❌ Erro ao criar intenção de pagamento:', error);
    res.status(500).json({
      error: 'Erro ao processar pagamento',
      details: error.message
    });
  }
};

// Confirma um pagamento e atualiza os créditos do usuário
exports.confirmPayment = async (req, res) => {
  try {
    // Verificar se Stripe está configurado e tentar re-inicializar se necessário
    if (!stripe) {
      console.log('[PAYMENT] ⚠️ Stripe não inicializado, tentando re-inicializar...');
      if (!ensureStripeInitialized()) {
        return res.status(503).json({
          error: 'Serviço de pagamento indisponível',
          details: 'Stripe não configurado no servidor'
        });
      }
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'PaymentIntent ID é obrigatório' });
    }

    console.log(`[PAYMENT] 🔍 Confirmando pagamento: ${paymentIntentId}`);

    // Verifica o status do pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`[PAYMENT] 📊 Status do pagamento: ${paymentIntent.status}`);

    if (paymentIntent.status !== 'succeeded') {
      console.log(`[PAYMENT] ❌ Pagamento não concluído. Status: ${paymentIntent.status}`);
      return res.status(400).json({
        error: 'Pagamento não foi concluído com sucesso',
        status: paymentIntent.status
      });
    }

    // Buscar transação pelo paymentIntentId
    let transaction = await Transaction.findOne({
      where: { paymentIntentId: paymentIntentId }
    });

    if (!transaction) {
      console.warn(`[PAYMENT] ⚠️ Transação não encontrada para PaymentIntent: ${paymentIntentId}`);

      // Criar transação se não existir (fallback para garantir que os créditos sejam adicionados)
      const userId = paymentIntent.metadata.userId;
      const credits = parseInt(paymentIntent.metadata.credits);
      const planName = paymentIntent.metadata.planName;

      // Validar se userId é numérico (não "anonymous")
      const numericUserId = parseInt(userId);
      if (!isNaN(numericUserId) && credits) {
        transaction = await Transaction.create({
          userId: numericUserId,
          amount: paymentIntent.amount / 100, // Converter de centavos para reais
          credits: credits,
          status: 'completed',
          paymentMethod: 'card', // Assumir cartão se não especificado
          paymentIntentId: paymentIntentId,
          metadata: {
            planName: planName,
            paymentMethod: 'card',
            createdFromConfirmation: true
          }
        });
        console.log(`[PAYMENT] 💾 Transação criada durante confirmação: ${transaction.id}`);
      } else {
        return res.status(404).json({
          error: 'Transação não encontrada e dados insuficientes para criar',
          details: `userId: ${userId}, credits: ${credits}`
        });
      }
    }

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Atualiza o status da transação
    await transaction.update({
      status: 'completed',
      metadata: {
        ...transaction.metadata,
        paymentStatus: paymentIntent.status,
        paymentDate: new Date()
      }
    });

    // Atualiza os créditos do usuário
    const user = await User.findByPk(transaction.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Adiciona os créditos ao usuário
    const currentCredits = user.credits || 0;
    await user.update({
      credits: currentCredits + transaction.credits
    });

    console.log(`[PAYMENT] ✅ Pagamento confirmado - ${transaction.credits} créditos adicionados ao usuário ${user.id}`);

    // Retorna o sucesso e os créditos atualizados
    res.json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      credits: currentCredits + transaction.credits
    });
  } catch (error) {
    console.error('[PAYMENT] ❌ Erro ao confirmar pagamento:', error);
    res.status(500).json({
      error: 'Erro ao confirmar pagamento',
      details: error.message
    });
  }
};

// Webhook para receber eventos do Stripe
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // Verifica a assinatura do webhook
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Erro na assinatura do webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  // Retorna uma resposta de sucesso
  res.json({ received: true });
};

// Função auxiliar para lidar com pagamentos bem-sucedidos
async function handleSuccessfulPayment(paymentIntent) {
  try {
    console.log(`[WEBHOOK] 🎯 Processando pagamento bem-sucedido: ${paymentIntent.id}`);

    // Encontra a transação relacionada
    const transaction = await Transaction.findOne({
      where: { paymentIntentId: paymentIntent.id }
    });

    if (!transaction) {
      console.warn(`[WEBHOOK] ⚠️ Transação não encontrada para paymentIntent: ${paymentIntent.id}`);

      // Verificar se é um checkout rápido (usuário anônimo)
      const guestEmail = paymentIntent.metadata.guestEmail;
      const guestName = paymentIntent.metadata.guestName;
      const credits = parseInt(paymentIntent.metadata.credits);
      const planName = paymentIntent.metadata.planName;

      if (guestEmail && guestName && credits) {
        console.log(`[WEBHOOK] 👤 Processando checkout rápido para: ${guestEmail}`);

        // Verificar se o usuário já existe
        let user = await User.findOne({ where: { email: guestEmail } });

        if (!user) {
          // Criar conta automaticamente
          const tempPassword = Math.random().toString(36).substring(2, 15);
          user = await User.create({
            name: guestName,
            email: guestEmail,
            password: tempPassword, // Será pedido para alterar no primeiro login
            credits: credits,
            isGuestAccount: true,
            metadata: {
              createdFromCheckout: true,
              checkoutDate: new Date(),
              planName: planName
            }
          });
          console.log(`[WEBHOOK] ✅ Conta criada automaticamente: ${user.id} (${guestEmail})`);
        } else {
          // Usuário já existe, apenas adicionar créditos
          const currentCredits = user.credits || 0;
          await user.update({
            credits: currentCredits + credits
          });
          console.log(`[WEBHOOK] ✅ Créditos adicionados a conta existente: ${credits} para ${guestEmail}`);
        }

        // Criar transação
        const newTransaction = await Transaction.create({
          userId: user.id,
          amount: paymentIntent.amount / 100,
          credits: credits,
          status: 'completed',
          paymentMethod: 'guest_checkout',
          paymentIntentId: paymentIntent.id,
          metadata: {
            planName: planName,
            createdFromWebhook: true,
            webhookDate: new Date(),
            guestCheckout: true
          }
        });

        console.log(`[WEBHOOK] 💾 Transação criada para checkout rápido: ${newTransaction.id}`);
        return;
      }

      // Criar transação baseada nos metadados do PaymentIntent (fallback para usuários logados)
      const userId = paymentIntent.metadata.userId;

      if (userId && userId !== 'anonymous' && credits) {
        const newTransaction = await Transaction.create({
          userId: userId,
          amount: paymentIntent.amount / 100,
          credits: credits,
          status: 'completed',
          paymentMethod: 'webhook_recovery',
          paymentIntentId: paymentIntent.id,
          metadata: {
            planName: planName,
            createdFromWebhook: true,
            webhookDate: new Date()
          }
        });

        console.log(`[WEBHOOK] 💾 Transação criada via webhook: ${newTransaction.id}`);

        // Atualizar créditos do usuário
        const user = await User.findByPk(userId);
        if (user) {
          const currentCredits = user.credits || 0;
          await user.update({
            credits: currentCredits + credits
          });
          console.log(`[WEBHOOK] ✅ Créditos adicionados via webhook: ${credits} para usuário ${userId}`);
        }
      }
      return;
    }

    // Se a transação já estiver completa, não faz nada (evita duplicação)
    if (transaction.status === 'completed') {
      console.log(`[WEBHOOK] ℹ️ Transação ${transaction.id} já processada, ignorando webhook`);
      return;
    }

    console.log(`[WEBHOOK] 🔄 Atualizando transação: ${transaction.id}`);

    // Atualiza o status da transação
    await transaction.update({
      status: 'completed',
      metadata: {
        ...transaction.metadata,
        paymentStatus: 'succeeded',
        paymentDate: new Date(),
        processedByWebhook: true
      }
    });

    // Atualiza os créditos do usuário
    const user = await User.findByPk(transaction.userId);
    if (!user) {
      console.error(`[WEBHOOK] ❌ Usuário não encontrado para transação: ${transaction.id}`);
      return;
    }

    // Adiciona os créditos ao usuário com proteção contra duplicação
    const currentCredits = user.credits || 0;
    await user.update({
      credits: currentCredits + transaction.credits
    });

    console.log(`[WEBHOOK] ✅ Pagamento processado com sucesso`);
    console.log(`[WEBHOOK]    Usuário: ${user.id} (${user.email})`);
    console.log(`[WEBHOOK]    Créditos: ${currentCredits} + ${transaction.credits} = ${currentCredits + transaction.credits}`);
    console.log(`[WEBHOOK]    Transação: ${transaction.id}`);

  } catch (error) {
    console.error('[WEBHOOK] ❌ Erro ao processar pagamento bem-sucedido:', error);

    // Log detalhado do erro para debugging
    console.error('[WEBHOOK] PaymentIntent ID:', paymentIntent.id);
    console.error('[WEBHOOK] PaymentIntent Metadata:', paymentIntent.metadata);
    console.error('[WEBHOOK] Erro completo:', error.stack);
  }
}

// Função auxiliar para lidar com pagamentos que falharam
async function handleFailedPayment(paymentIntent) {
  try {
    // Encontra a transação relacionada
    const transaction = await Transaction.findOne({
      where: { paymentIntentId: paymentIntent.id }
    });

    if (!transaction) {
      console.error(`Transação não encontrada para paymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Atualiza o status da transação para falha
    await transaction.update({
      status: 'failed',
      metadata: {
        ...transaction.metadata,
        paymentStatus: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Motivo desconhecido',
        failureDate: new Date()
      }
    });

    console.log(`Transação marcada como falha: ${transaction.id}`);
  } catch (error) {
    console.error('Erro ao processar pagamento que falhou:', error);
  }
}

// Obtém histórico de transações do usuário
// Filtra apenas transações efetivadas (completed), recusadas (failed) ou reembolsadas (refunded)
// Transações pendentes são ocultadas do histórico do usuário
exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        status: {
          [require('sequelize').Op.in]: ['completed', 'failed', 'refunded']
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (error) {
    console.error('Erro ao obter histórico de transações:', error);
    res.status(500).json({ error: 'Erro ao obter histórico de transações' });
  }
};

// Função para verificar e corrigir pagamentos pendentes
exports.verifyPendingPayments = async (req, res) => {
  try {
    console.log('[VERIFY] 🔍 Verificando pagamentos pendentes...');

    // Buscar transações pendentes dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingTransactions = await Transaction.findAll({
      where: {
        status: 'pending',
        createdAt: {
          [require('sequelize').Op.gte]: sevenDaysAgo
        }
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'credits']
      }]
    });

    console.log(`[VERIFY] 📋 Encontradas ${pendingTransactions.length} transações pendentes`);

    const results = {
      checked: 0,
      updated: 0,
      errors: 0,
      details: []
    };

    for (const transaction of pendingTransactions) {
      results.checked++;

      try {
        // Verificar status no Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(transaction.paymentIntentId);

        const detail = {
          transactionId: transaction.id,
          paymentIntentId: transaction.paymentIntentId,
          stripeStatus: paymentIntent.status,
          action: 'none'
        };

        if (paymentIntent.status === 'succeeded' && transaction.status === 'pending') {
          // Pagamento foi bem-sucedido, mas transação ainda está pendente
          detail.action = 'updated';

          await transaction.update({
            status: 'completed',
            metadata: {
              ...transaction.metadata,
              verifiedAt: new Date(),
              verificationSource: 'manual_check'
            }
          });

          // Adicionar créditos se ainda não foram adicionados
          const user = await User.findByPk(transaction.userId);
          if (user) {
            const currentCredits = user.credits || 0;
            await user.update({
              credits: currentCredits + transaction.credits
            });

            detail.creditsAdded = transaction.credits;
            detail.userEmail = user.email;
          }

          results.updated++;
          console.log(`[VERIFY] ✅ Transação ${transaction.id} atualizada para completed`);
        }

        results.details.push(detail);

      } catch (error) {
        results.errors++;
        console.error(`[VERIFY] ❌ Erro ao verificar transação ${transaction.id}:`, error.message);

        results.details.push({
          transactionId: transaction.id,
          error: error.message,
          action: 'error'
        });
      }
    }

    console.log(`[VERIFY] 📊 Verificação concluída: ${results.updated} atualizadas, ${results.errors} erros`);

    res.json({
      success: true,
      message: 'Verificação de pagamentos concluída',
      results: results
    });

  } catch (error) {
    console.error('[VERIFY] ❌ Erro na verificação de pagamentos:', error);
    res.status(500).json({
      error: 'Erro ao verificar pagamentos pendentes',
      details: error.message
    });
  }
};

// Função para obter informações do usuário (créditos, transações recentes)
exports.getUserPaymentInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'credits', 'createdAt']
    });

    const recentTransactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        status: {
          [require('sequelize').Op.in]: ['completed', 'failed', 'refunded']
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'amount', 'credits', 'status', 'paymentMethod', 'createdAt', 'metadata']
    });

    const totalSpent = await Transaction.sum('amount', {
      where: {
        userId: req.user.id,
        status: 'completed'
      }
    }) || 0;

    const totalCreditsEarned = await Transaction.sum('credits', {
      where: {
        userId: req.user.id,
        status: 'completed'
      }
    }) || 0;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits || 0,
        memberSince: user.createdAt
      },
      stats: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalCreditsEarned: totalCreditsEarned,
        totalTransactions: recentTransactions.length
      },
      recentTransactions: recentTransactions
    });

  } catch (error) {
    console.error('[USER_INFO] ❌ Erro ao obter informações do usuário:', error);
    res.status(500).json({
      error: 'Erro ao obter informações do usuário',
      details: error.message
    });
  }
};

// Função para limpeza de transações pendentes antigas (mais de 24 horas)
exports.cleanupOldPendingTransactions = async (req, res) => {
  try {
    console.log('[CLEANUP] 🧹 Iniciando limpeza de transações pendentes antigas...');

    // Buscar transações pendentes de mais de 24 horas
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const oldPendingTransactions = await Transaction.findAll({
      where: {
        status: 'pending',
        createdAt: {
          [require('sequelize').Op.lt]: twentyFourHoursAgo
        }
      }
    });

    console.log(`[CLEANUP] 📋 Encontradas ${oldPendingTransactions.length} transações pendentes antigas`);

    let cleanedCount = 0;
    let failedCount = 0;

    for (const transaction of oldPendingTransactions) {
      try {
        // Marcar como expirada
        await transaction.update({
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            failureReason: 'Transação expirada após 24 horas',
            cleanupDate: new Date(),
            cleanupSource: 'automatic_cleanup'
          }
        });

        cleanedCount++;
        console.log(`[CLEANUP] ✅ Transação ${transaction.id} marcada como expirada`);
      } catch (error) {
        failedCount++;
        console.error(`[CLEANUP] ❌ Erro ao limpar transação ${transaction.id}:`, error.message);
      }
    }

    console.log(`[CLEANUP] 📊 Limpeza concluída: ${cleanedCount} marcadas como expiradas, ${failedCount} erros`);

    res.json({
      success: true,
      message: 'Limpeza de transações pendentes concluída',
      results: {
        found: oldPendingTransactions.length,
        cleaned: cleanedCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('[CLEANUP] ❌ Erro na limpeza de transações:', error);
    res.status(500).json({
      error: 'Erro ao limpar transações pendentes',
      details: error.message
    });
  }
};
