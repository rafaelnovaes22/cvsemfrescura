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

    if (!paymentIntentId || !transactionId) {
      return res.status(400).json({ error: 'Informações de confirmação incompletas' });
    }

    // Verifica o status do pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Pagamento não foi concluído com sucesso' });
    }

    // Atualiza a transação
    const transaction = await Transaction.findByPk(transactionId);

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
    // Encontra a transação relacionada
    const transaction = await Transaction.findOne({
      where: { paymentIntentId: paymentIntent.id }
    });

    if (!transaction) {
      console.error(`Transação não encontrada para paymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Se a transação já estiver completa, não faz nada
    if (transaction.status === 'completed') {
      return;
    }

    // Atualiza o status da transação
    await transaction.update({
      status: 'completed',
      metadata: {
        ...transaction.metadata,
        paymentStatus: 'succeeded',
        paymentDate: new Date()
      }
    });

    // Atualiza os créditos do usuário
    const user = await User.findByPk(transaction.userId);
    if (!user) {
      console.error(`Usuário não encontrado para transação: ${transaction.id}`);
      return;
    }

    // Adiciona os créditos ao usuário
    const currentCredits = user.credits || 0;
    await user.update({
      credits: currentCredits + transaction.credits
    });

    console.log(`Créditos atualizados para o usuário ${user.id}: ${currentCredits} + ${transaction.credits}`);
  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error);
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
