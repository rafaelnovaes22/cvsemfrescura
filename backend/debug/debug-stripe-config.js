// Debug da configuração do Stripe - CV Sem Frescura
require('dotenv').config();

console.log('=== DEBUG STRIPE CONFIGURATION ===');
console.log('');

console.log('🌍 AMBIENTE:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('');

console.log('🔑 VARIÁVEIS STRIPE:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ?
    `${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ?
    `${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ?
    `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('');

console.log('✅ VALIDAÇÕES:');
const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

console.log('Secret Key existe?', !!secretKey);
console.log('Secret Key começa com sk_?', secretKey ? secretKey.startsWith('sk_') : false);
console.log('Publishable Key existe?', !!publishableKey);
console.log('Publishable Key começa com pk_?', publishableKey ? publishableKey.startsWith('pk_') : false);
console.log('');

console.log('🏗️ CARREGANDO CONFIGURAÇÃO...');
try {
    const config = require('./config/environment');
    console.log('✅ Config carregado com sucesso');
    console.log('Stripe config:', {
        secretKey: config.stripe.secretKey ? `${config.stripe.secretKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
        publishableKey: config.stripe.publishableKey ? `${config.stripe.publishableKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
        environment: config.stripe.environment
    });
} catch (err) {
    console.log('❌ Erro ao carregar config:', err.message);
}

console.log('');
console.log('🧪 TESTANDO STRIPE...');
try {
    if (secretKey && secretKey.startsWith('sk_')) {
        const Stripe = require('stripe');
        const stripe = Stripe(secretKey);
        console.log('✅ Stripe inicializado com sucesso');

        // Teste básico
        stripe.accounts.retrieve().then(() => {
            console.log('✅ Conexão com Stripe OK');
        }).catch(err => {
            console.log('⚠️ Erro na conexão com Stripe:', err.message);
        });
    } else {
        console.log('❌ Não foi possível inicializar o Stripe - chave inválida');
    }
} catch (err) {
    console.log('❌ Erro ao testar Stripe:', err.message);
}

console.log('');
console.log('=== FIM DEBUG ==='); 