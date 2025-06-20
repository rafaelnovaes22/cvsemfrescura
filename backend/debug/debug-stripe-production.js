require('dotenv').config();

console.log('🔍 DIAGNÓSTICO COMPLETO DAS CHAVES STRIPE PRODUÇÃO');
console.log('═'.repeat(60));

// 1. Verificar variáveis de ambiente
console.log('📋 1. VARIÁVEIS DE AMBIENTE:');
const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
console.log(`Publishable Key: ${publishableKey ? publishableKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
console.log(`Secret Key válida: ${secretKey ? secretKey.startsWith('sk_live_') : false}`);
console.log(`Publishable Key válida: ${publishableKey ? publishableKey.startsWith('pk_live_') : false}`);
console.log('');

// 2. Verificar se as chaves pertencem ao mesmo projeto
console.log('🔗 2. COMPATIBILIDADE DAS CHAVES:');
if (secretKey && publishableKey) {
    // Extrair o identificador do projeto (primeiros caracteres após o prefixo)
    const secretProject = secretKey.replace('sk_live_', '').substring(0, 15);
    const publishableProject = publishableKey.replace('pk_live_', '').substring(0, 15);

    console.log(`Secret project ID: ${secretProject}`);
    console.log(`Publishable project ID: ${publishableProject}`);
    console.log(`Chaves do mesmo projeto: ${secretProject === publishableProject}`);

    if (secretProject !== publishableProject) {
        console.log('❌ PROBLEMA: As chaves não pertencem ao mesmo projeto Stripe!');
        console.log('💡 Verifique se ambas as chaves são da mesma conta Stripe');
    }
} else {
    console.log('❌ Não é possível verificar - chaves ausentes');
}
console.log('');

// 3. Testar inicialização do Stripe
console.log('⚡ 3. TESTE DE INICIALIZAÇÃO:');
try {
    if (!secretKey || !secretKey.startsWith('sk_live_')) {
        throw new Error('Chave secreta inválida');
    }

    const Stripe = require('stripe');
    const stripe = Stripe(secretKey);
    console.log('✅ Stripe inicializado com sucesso');

    // 4. Testar criação de PaymentIntent
    console.log('');
    console.log('💳 4. TESTE DE PAYMENTINTENT:');

    stripe.paymentIntents.create({
        amount: 3997, // R$ 39,97 em centavos
        currency: 'brl',
        payment_method_types: ['card'],
        metadata: {
            test: 'diagnostic'
        }
    }).then(paymentIntent => {
        console.log('✅ PaymentIntent criado com sucesso');
        console.log(`   ID: ${paymentIntent.id}`);
        console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 30)}...`);
        console.log(`   Status: ${paymentIntent.status}`);
        console.log('');

        // 5. Verificar se o client_secret é compatível com a chave pública
        console.log('🔍 5. ANÁLISE DE COMPATIBILIDADE:');
        const clientSecretProject = paymentIntent.client_secret.split('_')[1];
        const publishableProject = publishableKey.replace('pk_live_', '').substring(0, 15);

        console.log(`Client Secret project: ${clientSecretProject}`);
        console.log(`Publishable Key project: ${publishableProject}`);
        console.log(`Compatível: ${clientSecretProject === publishableProject}`);

        if (clientSecretProject !== publishableProject) {
            console.log('❌ PROBLEMA ENCONTRADO: Client Secret não é compatível com a Publishable Key!');
            console.log('💡 Isso explica o erro 400 no frontend');
        } else {
            console.log('✅ Chaves são compatíveis - problema pode ser em outro lugar');
        }

    }).catch(error => {
        console.log('❌ Erro ao criar PaymentIntent:', error.message);

        if (error.type === 'StripeAuthenticationError') {
            console.log('🔑 Problema de autenticação - chave secreta inválida ou desativada');
        } else if (error.type === 'StripePermissionError') {
            console.log('🚫 Problema de permissão - conta pode estar restrita');
        } else if (error.code === 'account_inactive') {
            console.log('⏸️ Conta Stripe inativa ou suspensa');
        }
    });

} catch (error) {
    console.log('❌ Erro na inicialização:', error.message);
}

console.log('');
console.log('═'.repeat(60));
console.log('💡 PRÓXIMOS PASSOS:');
console.log('1. Verifique se ambas as chaves são da mesma conta Stripe');
console.log('2. Confirme se a conta Stripe está ativa e sem restrições');
console.log('3. Teste com chaves de desenvolvimento primeiro (sk_test_ e pk_test_)');
console.log('4. Verifique no Dashboard do Stripe se há problemas na conta'); 