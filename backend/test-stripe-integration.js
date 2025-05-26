#!/usr/bin/env node

/**
 * Script de Teste - Integração Completa com Stripe
 * 
 * Este script testa toda a integração do sistema de pagamentos:
 * 1. Verifica se as chaves do Stripe estão configuradas
 * 2. Testa conexão com a API do Stripe
 * 3. Cria PaymentIntents de teste
 * 4. Verifica funcionalidade de Boleto
 */

require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Cores para output no terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`)
};

async function testStripeIntegration() {
    console.log('\n🧪 TESTE DE INTEGRAÇÃO STRIPE - CV SEM FRESCURA\n');

    // 1. Verificar Chaves
    log.info('Verificando configuração das chaves...');

    if (!process.env.STRIPE_SECRET_KEY) {
        log.error('STRIPE_SECRET_KEY não configurada no .env');
        return false;
    }

    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
        log.warning('STRIPE_PUBLISHABLE_KEY não configurada no .env');
    }

    log.success('Chave secreta do Stripe encontrada');
    log.info(`Chave: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);

    // 2. Testar Conexão com Stripe
    try {
        log.info('Testando conexão com a API do Stripe...');
        const account = await stripe.accounts.retrieve();
        log.success(`Conectado com sucesso! Conta: ${account.id}`);
        log.info(`País: ${account.country}, Moeda padrão: ${account.default_currency}`);
    } catch (error) {
        log.error(`Falha na conexão: ${error.message}`);
        return false;
    }

    // 3. Testar PaymentIntent - Cartão
    try {
        log.info('Testando criação de PaymentIntent para cartão...');
        const cardPayment = await stripe.paymentIntents.create({
            amount: 2000, // R$ 20,00
            currency: 'brl',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                test: 'true',
                method: 'card'
            }
        });
        log.success(`PaymentIntent criado para cartão: ${cardPayment.id}`);
    } catch (error) {
        log.error(`Erro ao criar PaymentIntent para cartão: ${error.message}`);
    }



    // 4. Testar PaymentIntent - Boleto
    try {
        log.info('Testando criação de PaymentIntent para Boleto...');
        const boletoPayment = await stripe.paymentIntents.create({
            amount: 2000, // R$ 20,00
            currency: 'brl',
            payment_method_types: ['boleto'],
            payment_method_data: {
                type: 'boleto',
                boleto: {
                    tax_id: '12345678909', // CPF de teste
                },
                billing_details: {
                    name: 'Teste CV Sem Frescura',
                    email: 'teste@cvsemfrescura.com',
                    address: {
                        line1: 'Rua de Teste, 123',
                        city: 'São Paulo',
                        state: 'SP',
                        postal_code: '01000000',
                        country: 'BR'
                    }
                }
            },
            metadata: {
                test: 'true',
                method: 'boleto'
            }
        });
        log.success(`PaymentIntent criado para Boleto: ${boletoPayment.id}`);

        if (boletoPayment.next_action?.boleto_display_details) {
            log.info('✨ Detalhes do boleto disponíveis');
        } else {
            log.warning('Detalhes do boleto não foram gerados automaticamente');
        }
    } catch (error) {
        log.error(`Erro ao criar PaymentIntent para Boleto: ${error.message}`);
    }

    // 5. Verificar Webhook
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        log.success('Webhook secret configurado');
    } else {
        log.warning('STRIPE_WEBHOOK_SECRET não configurado (necessário para produção)');
    }

    console.log('\n🎉 TESTE CONCLUÍDO!\n');

    // Instruções finais
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Configurar frontend com a chave pública');
    console.log('2. 🚀 Iniciar o backend: cd backend && npm run dev');
    console.log('3. 🌐 Iniciar o frontend: cd frontend && python -m http.server 8000');
    console.log('4. 🧪 Testar pagamentos em: http://localhost:8000');
    console.log('5. 📱 Usar cartões de teste do Stripe para validação\n');

    return true;
}

// Cartões de teste do Stripe
function showTestCards() {
    console.log('💳 CARTÕES DE TESTE STRIPE:\n');
    console.log('✅ Sucesso: 4242 4242 4242 4242');
    console.log('❌ Falha: 4000 0000 0000 0002');
    console.log('🔍 Requer SCA: 4000 0025 0000 3155');

    console.log('🧾 Boleto: Disponível automaticamente\n');
    console.log('📅 Qualquer data futura, qualquer CVV\n');
}

// Executar teste
if (require.main === module) {
    testStripeIntegration().then(() => {
        showTestCards();
    }).catch(error => {
        log.error(`Erro no teste: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testStripeIntegration }; 