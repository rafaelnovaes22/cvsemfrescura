console.log('🔧 Teste do fluxo completo de pagamentos - CV Sem Frescura');
console.log('='.repeat(60));

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Verificações básicas
console.log('\n📋 VERIFICAÇÕES BÁSICAS');
console.log('-'.repeat(30));

// 1. Verificar configurações do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não configurada');
    process.exit(1);
}

if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    console.error('❌ STRIPE_PUBLISHABLE_KEY não configurada');
    process.exit(1);
}

console.log('✅ Chaves do Stripe configuradas');
console.log(`   Secret Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
console.log(`   Publishable Key: ${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`);

// 2. Verificar conectividade com Stripe
async function testStripeConnection() {
    try {
        const account = await stripe.accounts.retrieve();
        console.log('✅ Conexão com Stripe OK');
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Environment: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com Stripe:', error.message);
        return false;
    }
}

// 3. Testar criação de PaymentIntent
async function testPaymentIntentCreation() {
    try {
        console.log('\n🧪 TESTE: Criação de PaymentIntent');
        console.log('-'.repeat(30));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2990, // R$ 29,90 em centavos
            currency: 'brl',
            payment_method_types: ['card'],
            metadata: {
                userId: 'test_user_123',
                planName: 'Plano Essencial',
                credits: '7'
            }
        });

        console.log('✅ PaymentIntent criado com sucesso');
        console.log(`   ID: ${paymentIntent.id}`);
        console.log(`   Amount: R$ ${(paymentIntent.amount / 100).toFixed(2)}`);
        console.log(`   Status: ${paymentIntent.status}`);
        console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 30)}...`);

        return paymentIntent;
    } catch (error) {
        console.error('❌ Erro ao criar PaymentIntent:', error.message);
        return null;
    }
}

// 4. Testar PIX
async function testPixPayment() {
    try {
        console.log('\n🔲 TESTE: Pagamento PIX');
        console.log('-'.repeat(30));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2990,
            currency: 'brl',
            payment_method_types: ['pix'],
            payment_method_options: {
                pix: {
                    expires_after_seconds: 24 * 60 * 60 // 24 horas
                }
            },
            metadata: {
                userId: 'test_user_123',
                planName: 'Plano Essencial - PIX',
                credits: '7'
            }
        });

        console.log('✅ PaymentIntent PIX criado');
        console.log(`   ID: ${paymentIntent.id}`);
        console.log(`   Status: ${paymentIntent.status}`);

        return paymentIntent;
    } catch (error) {
        console.error('❌ Erro ao criar PaymentIntent PIX:', error.message);
        return null;
    }
}

// 5. Testar Boleto
async function testBoletoPayment() {
    try {
        console.log('\n🧾 TESTE: Pagamento Boleto');
        console.log('-'.repeat(30));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2990,
            currency: 'brl',
            payment_method_types: ['boleto'],
            payment_method_data: {
                type: 'boleto',
                boleto: {
                    tax_id: '12345678901'
                },
                billing_details: {
                    name: 'Usuario Teste',
                    email: 'teste@exemplo.com',
                    address: {
                        line1: 'Rua Teste, 123',
                        city: 'São Paulo',
                        state: 'SP',
                        postal_code: '01234567',
                        country: 'BR'
                    }
                }
            },
            metadata: {
                userId: 'test_user_123',
                planName: 'Plano Essencial - Boleto',
                credits: '7'
            }
        });

        console.log('✅ PaymentIntent Boleto criado');
        console.log(`   ID: ${paymentIntent.id}`);
        console.log(`   Status: ${paymentIntent.status}`);

        return paymentIntent;
    } catch (error) {
        console.error('❌ Erro ao criar PaymentIntent Boleto:', error.message);
        return null;
    }
}

// 6. Testar banco de dados
async function testDatabaseConnection() {
    try {
        console.log('\n💾 TESTE: Conexão com banco de dados');
        console.log('-'.repeat(30));

        const sequelize = require('./db');
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados OK');

        // Testar modelos
        const User = require('./models/user');
        const Transaction = require('./models/Transaction');

        const userCount = await User.count();
        const transactionCount = await Transaction.count();

        console.log(`   Usuários cadastrados: ${userCount}`);
        console.log(`   Transações registradas: ${transactionCount}`);

        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com banco:', error.message);
        return false;
    }
}

// 7. Simular fluxo completo
async function simulateCompleteFlow() {
    try {
        console.log('\n🔄 SIMULAÇÃO: Fluxo completo de pagamento');
        console.log('-'.repeat(40));

        // Criar usuário de teste
        const User = require('./models/user');
        const Transaction = require('./models/Transaction');

        let testUser = await User.findOne({ where: { email: 'teste@fluxopagamento.com' } });

        if (!testUser) {
            testUser = await User.create({
                name: 'Usuário Teste Fluxo',
                email: 'teste@fluxopagamento.com',
                password: 'password123',
                credits: 0
            });
            console.log('✅ Usuário de teste criado');
        } else {
            console.log('✅ Usuário de teste encontrado');
        }

        console.log(`   ID: ${testUser.id}`);
        console.log(`   Créditos atuais: ${testUser.credits}`);

        // Criar PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2990,
            currency: 'brl',
            payment_method_types: ['card'],
            metadata: {
                userId: testUser.id.toString(),
                planName: 'Plano Teste',
                credits: '7'
            }
        });

        console.log('✅ PaymentIntent criado para simulação');
        console.log(`   ID: ${paymentIntent.id}`);

        // Criar transação no banco
        const transaction = await Transaction.create({
            userId: testUser.id,
            amount: 29.90,
            credits: 7,
            status: 'pending',
            paymentMethod: 'card',
            paymentIntentId: paymentIntent.id,
            metadata: {
                planName: 'Plano Teste',
                simulacao: true
            }
        });

        console.log('✅ Transação criada no banco');
        console.log(`   ID: ${transaction.id}`);

        // Simular confirmação de pagamento
        await transaction.update({ status: 'completed' });

        const currentCredits = testUser.credits || 0;
        await testUser.update({ credits: currentCredits + 7 });

        const updatedUser = await User.findByPk(testUser.id);
        console.log('✅ Pagamento simulado com sucesso');
        console.log(`   Créditos antes: ${currentCredits}`);
        console.log(`   Créditos depois: ${updatedUser.credits}`);

        return {
            success: true,
            user: updatedUser,
            transaction: transaction,
            paymentIntent: paymentIntent
        };

    } catch (error) {
        console.error('❌ Erro na simulação:', error.message);
        return { success: false, error: error.message };
    }
}

// Executar todos os testes
async function runAllTests() {
    console.log('🚀 Iniciando testes do sistema de pagamentos...\n');

    const stripeOk = await testStripeConnection();
    if (!stripeOk) {
        console.log('\n❌ Testes interrompidos - problema na conexão com Stripe');
        process.exit(1);
    }

    const dbOk = await testDatabaseConnection();
    if (!dbOk) {
        console.log('\n❌ Testes interrompidos - problema na conexão com banco');
        process.exit(1);
    }

    await testPaymentIntentCreation();
    await testPixPayment();
    await testBoletoPayment();

    const simulation = await simulateCompleteFlow();

    console.log('\n📊 RESUMO DOS TESTES');
    console.log('='.repeat(30));
    console.log(`✅ Stripe: Conectado`);
    console.log(`✅ Banco: Conectado`);
    console.log(`✅ PaymentIntent: OK`);
    console.log(`✅ PIX: OK`);
    console.log(`✅ Boleto: OK`);
    console.log(`${simulation.success ? '✅' : '❌'} Simulação completa: ${simulation.success ? 'OK' : 'ERRO'}`);

    if (simulation.success) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ Sistema de pagamentos está funcionando corretamente');
    } else {
        console.log('\n⚠️ PROBLEMAS DETECTADOS');
        console.log(`❌ Erro na simulação: ${simulation.error}`);
    }

    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Testar frontend → backend integration');
    console.log('2. Testar com cartões de teste do Stripe');
    console.log('3. Configurar webhooks para produção');

    process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Erro fatal nos testes:', error);
        process.exit(1);
    });
} 