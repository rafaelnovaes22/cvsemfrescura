// Debug das configurações do Stripe no Railway
require('dotenv').config();

console.log('🔍 === DEBUG STRIPE RAILWAY ===');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🚂 RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('🔐 ENCRYPTION_KEY presente:', !!process.env.ENCRYPTION_KEY);
console.log('🔐 DISABLE_ENCRYPTION:', process.env.DISABLE_ENCRYPTION);

// Verificar chaves brutas
console.log('\n📊 === CHAVES BRUTAS (do .env) ===');
console.log('🔑 STRIPE_SECRET_KEY existe:', !!process.env.STRIPE_SECRET_KEY);
console.log('🔑 STRIPE_PUBLISHABLE_KEY existe:', !!process.env.STRIPE_PUBLISHABLE_KEY);
console.log('🔑 STRIPE_WEBHOOK_SECRET existe:', !!process.env.STRIPE_WEBHOOK_SECRET);

if (process.env.STRIPE_SECRET_KEY) {
    console.log('🔍 STRIPE_SECRET_KEY tamanho:', process.env.STRIPE_SECRET_KEY.length);
    console.log('🔍 STRIPE_SECRET_KEY começa com:', process.env.STRIPE_SECRET_KEY.substring(0, 10));
    console.log('🔍 É chave válida?', process.env.STRIPE_SECRET_KEY.startsWith('sk_') || process.env.STRIPE_SECRET_KEY.startsWith('rk_'));
}

if (process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('🔍 STRIPE_PUBLISHABLE_KEY tamanho:', process.env.STRIPE_PUBLISHABLE_KEY.length);
    console.log('🔍 STRIPE_PUBLISHABLE_KEY começa com:', process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 10));
    console.log('🔍 É chave válida?', process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_'));
}

// Testar configuração atual
console.log('\n🧪 === TESTE DA CONFIGURAÇÃO ===');
try {
    const config = require('./config/environment');
    console.log('✅ Config carregado com sucesso');
    console.log('🔑 Stripe config:', {
        hasSecretKey: !!config.stripe.secretKey,
        hasPublishableKey: !!config.stripe.publishableKey,
        environment: config.stripe.environment
    });

    if (config.stripe.secretKey) {
        console.log('🔍 Secret key final:', config.stripe.secretKey.substring(0, 10) + '...');
        console.log('🔍 É válida?', config.stripe.secretKey.startsWith('sk_') || config.stripe.secretKey.startsWith('rk_'));
    }

    if (config.stripe.publishableKey) {
        console.log('🔍 Publishable key final:', config.stripe.publishableKey.substring(0, 10) + '...');
        console.log('🔍 É válida?', config.stripe.publishableKey.startsWith('pk_'));
    }

} catch (error) {
    console.error('❌ Erro ao carregar config:', error.message);
}

// Testar inicialização do Stripe
console.log('\n⚡ === TESTE DO STRIPE ===');
try {
    const config = require('./config/environment');

    if (config.stripe.secretKey) {
        const Stripe = require('stripe');
        const stripe = Stripe(config.stripe.secretKey);
        console.log('✅ Stripe inicializado com sucesso');

        // Teste básico
        stripe.customers.list({ limit: 1 })
            .then(() => {
                console.log('✅ Conexão com Stripe OK - chaves funcionando!');
            })
            .catch((error) => {
                console.error('❌ Erro na conexão com Stripe:', error.message);
                if (error.message.includes('Invalid API Key')) {
                    console.error('🔍 A chave do Stripe é inválida ou tem formato incorreto');
                }
            });
    } else {
        console.error('❌ Chave secreta do Stripe não encontrada');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar Stripe:', error.message);
}

console.log('\n✅ Debug concluído!'); 