// Integração real com Stripe para produção
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verificar se a chave do Stripe está configurada
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERRO: STRIPE_SECRET_KEY não configurada. Configure a variável de ambiente.');
  process.exit(1);
}

console.log('[STRIPE] ✅ Integração configurada com Stripe');
console.log('[STRIPE] 🔑 Chave:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');

const Transaction = require('../models/Transaction');
const User = require('../models/user');

// Cria uma intenção de pagamento no Stripe
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, planName, credits, paymentMethod } = req.body;

    if (!amount || !planName || !credits || !paymentMethod) {
      return res.status(400).json({ error: 'Informações de pagamento incompletas' });
    }

    // Converte o valor para centavos (Stripe trabalha com centavos)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    console.log(`[PAYMENT] 🎯 Criando pagamento: ${paymentMethod} - R$ ${amount} - ${credits} créditos`);

    // Opções básicas para o PaymentIntent
    const paymentIntentOptions = {
      amount: amountInCents,
      currency: 'brl',
      metadata: {
        userId: req.user.id,
        planName,
        credits: credits.toString()
      }
    };

    // Configura opções específicas baseadas no método de pagamento
    if (paymentMethod === 'card') {
      // Para cartão de crédito
      paymentIntentOptions.automatic_payment_methods = {
        enabled: true,
      };
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
          email: req.body.email || req.user.email,
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
    } else if (paymentMethod === 'pix') {
      // Para PIX
      paymentIntentOptions.payment_method_types = ['pix'];

      // Expiração do PIX (24 horas)
      const expiresInSeconds = 24 * 60 * 60;

      paymentIntentOptions.payment_method_options = {
        pix: {
          expires_after_seconds: expiresInSeconds
        }
      };

      // Dados do PIX
      if (req.body.taxId) {
        paymentIntentOptions.payment_method_data = {
          type: 'pix',
          billing_details: {
            name: req.body.name || 'Nome do Pagador',
            email: req.body.email || req.user.email,
          }
        };
      }

      console.log('[PAYMENT] 🔲 Configurando pagamento por PIX');
    } else {
      return res.status(400).json({ error: 'Método de pagamento não suportado' });
    }

    // Cria o PaymentIntent com as opções configuradas
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
    console.log('[PAYMENT] ✅ PaymentIntent criado:', paymentIntent.id);

    // Gera um ID de transação
    const transactionId = 'tr_' + Math.random().toString(36).substring(2, 15);

    // Resposta base
    const response = {
      clientSecret: paymentIntent.client_secret,
      transactionId: transactionId
    };

    // Adiciona dados específicos para PIX e Boleto
    if (paymentMethod === 'pix') {
      // Para PIX, vamos criar os dados do QR Code
      response.pixData = {
        qr_code: paymentIntent.next_action?.pix_display_qr_code?.data || 'PIX_CODE_PLACEHOLDER',
        qr_code_url: paymentIntent.next_action?.pix_display_qr_code?.image_url_png || null,
        expires_at: paymentIntent.next_action?.pix_display_qr_code?.expires_at || null
      };
      console.log('[PAYMENT] 🔲 Dados PIX adicionados à resposta');
    } else if (paymentMethod === 'boleto') {
      // Para Boleto, vamos criar os dados do boleto
      response.boletoData = {
        code: paymentIntent.next_action?.boleto_display_details?.number || 'BOLETO_CODE_PLACEHOLDER',
        pdf_url: paymentIntent.next_action?.boleto_display_details?.pdf || null,
        expires_at: paymentIntent.next_action?.boleto_display_details?.expires_at || null
      };
      console.log('[PAYMENT] 🧾 Dados do boleto adicionados à resposta');
    }

    try {
      // Tenta criar o registro da transação no banco
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

    } catch (dbError) {
      console.warn('[PAYMENT] ⚠️ Aviso: Não foi possível salvar a transação no banco de dados. Continuando com ID simulado.', dbError.message);

      // Se não conseguir criar no banco, adiciona os créditos diretamente (apenas para desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
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
    const { paymentIntentId, transactionId } = req.body;

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

    // Buscar transação pelo paymentIntentId se transactionId não foi fornecido
    let transaction = null;

    if (transactionId) {
      transaction = await Transaction.findByPk(transactionId);
    } else {
      transaction = await Transaction.findOne({
        where: { paymentIntentId: paymentIntentId }
      });
    }

    if (!transaction) {
      console.warn(`[PAYMENT] ⚠️ Transação não encontrada para PaymentIntent: ${paymentIntentId}`);

      // Criar transação se não existir (fallback para garantir que os créditos sejam adicionados)
      const userId = paymentIntent.metadata.userId;
      const credits = parseInt(paymentIntent.metadata.credits);
      const planName = paymentIntent.metadata.planName;

      if (userId && credits) {
        transaction = await Transaction.create({
          userId: userId,
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
        return res.status(404).json({ error: 'Transação não encontrada e dados insuficientes para criar' });
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

    // Retorna o sucesso e os créditos atualizados
    res.json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      credits: currentCredits + transaction.credits
    });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
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

      // Criar transação baseada nos metadados do PaymentIntent (fallback)
      const userId = paymentIntent.metadata.userId;
      const credits = parseInt(paymentIntent.metadata.credits);
      const planName = paymentIntent.metadata.planName;

      if (userId && credits) {
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
exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
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
      where: { userId: req.user.id },
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
