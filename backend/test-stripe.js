require('dotenv').config();

async function testStripe() {
    try {
        console.log('🔍 Testando configuração do Stripe...');

        // Verificar se as chaves existem
        const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        const secretKey = process.env.STRIPE_SECRET_KEY;

        console.log('📋 Status das chaves:');
        console.log(`- Publishable Key: ${publishableKey ? '✅ Presente' : '❌ Ausente'}`);
        console.log(`- Secret Key: ${secretKey ? '✅ Presente' : '❌ Ausente'}`);

        if (!secretKey) {
            console.log('❌ Chave secreta não encontrada!');
            return;
        }

        // Tentar conectar com Stripe
        const stripe = require('stripe')(secretKey);

        console.log('\n🔄 Testando conexão com Stripe...');
        const account = await stripe.accounts.retrieve();

        console.log('✅ Conexão com Stripe bem-sucedida!');
        console.log(`📊 Conta: ${account.display_name || account.id}`);
        console.log(`🌍 País: ${account.country}`);
        console.log(`💰 Moeda padrão: ${account.default_currency}`);

    } catch (error) {
        console.error('❌ Erro ao testar Stripe:', error.message);

        if (error.type === 'StripeAuthenticationError') {
            console.log('🔑 Problema de autenticação - verifique as chaves');
        }
    }
}

testStripe(); 