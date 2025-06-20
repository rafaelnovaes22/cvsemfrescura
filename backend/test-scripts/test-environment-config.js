// 🧪 Teste da Configuração de Ambiente - CV Sem Frescura
console.log('🧪 TESTE DA CONFIGURAÇÃO DE AMBIENTE\n');

try {
    const config = require('./config/environment');

    console.log('✅ Configuração carregada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Ambiente
    console.log('🌍 AMBIENTE:');
    console.log(`   Nome: ${config.environment.name}`);
    console.log(`   Local: ${config.environment.isLocal}`);
    console.log(`   Produção: ${config.environment.isProduction}`);
    console.log(`   Railway: ${config.environment.isRailway}`);
    console.log('');

    // Stripe
    console.log('🔑 STRIPE:');
    console.log(`   Ambiente Stripe: ${config.stripe.environment}`);
    console.log(`   Secret Key: ${config.stripe.secretKey ? config.stripe.secretKey.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
    console.log(`   Publishable Key: ${config.stripe.publishableKey ? config.stripe.publishableKey.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
    console.log(`   Webhook Secret: ${config.stripe.webhookSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    console.log('');

    // Database
    console.log('🗄️ DATABASE:');
    console.log(`   Tipo: ${config.database.type}`);
    console.log(`   URL: ${config.database.url}`);
    console.log('');

    // API
    console.log('📡 API:');
    console.log(`   Porta: ${config.api.port}`);
    console.log(`   Node ENV: ${config.api.nodeEnv}`);
    console.log('');

    // CORS
    console.log('🌐 CORS:');
    console.log(`   Origins: ${JSON.stringify(config.cors.origin)}`);
    console.log('');

    // Validações
    console.log('✅ VALIDAÇÕES:');

    const validations = [
        {
            name: 'Chave Secret do Stripe válida',
            test: config.stripe.secretKey && config.stripe.secretKey.startsWith('sk_'),
            details: config.stripe.secretKey ? `${config.stripe.secretKey.substring(0, 10)}...` : 'Não configurada'
        },
        {
            name: 'Chave Publishable do Stripe válida',
            test: config.stripe.publishableKey && config.stripe.publishableKey.startsWith('pk_'),
            details: config.stripe.publishableKey ? `${config.stripe.publishableKey.substring(0, 10)}...` : 'Não configurada'
        },
        {
            name: 'Chaves Stripe do mesmo projeto',
            test: config.stripe.secretKey && config.stripe.publishableKey &&
                config.stripe.secretKey.substring(0, 25) === config.stripe.publishableKey.substring(0, 25),
            details: 'Primeiros 25 caracteres devem ser iguais'
        },
        {
            name: 'Database configurada',
            test: !!config.database.url,
            details: config.database.url || 'Não configurada'
        },
        {
            name: 'JWT Secret configurado',
            test: !!config.api.jwtSecret,
            details: config.api.jwtSecret ? 'Configurado' : 'Não configurado'
        }
    ];

    validations.forEach(validation => {
        const status = validation.test ? '✅' : '❌';
        console.log(`   ${status} ${validation.name}`);
        if (!validation.test) {
            console.log(`      ⚠️ ${validation.details}`);
        }
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Recomendações
    if (config.environment.isLocal) {
        console.log('🏠 MODO LOCAL DETECTADO:');
        console.log('   ✅ Usando chaves de TESTE automaticamente');
        console.log('   💡 Pode testar pagamentos com cartão 4242 4242 4242 4242');
        console.log('   🔗 Teste: http://localhost:8080/payment.html');
    } else {
        console.log('🚀 MODO PRODUÇÃO DETECTADO:');
        console.log('   ⚠️ Usando chaves de PRODUÇÃO');
        console.log('   🔒 Certifique-se que domínio está registrado no Stripe');
        console.log('   🌐 HTTPS obrigatório para chaves de produção');
    }

    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Reinicie o servidor: npm start');
    console.log('   2. Teste a página: http://localhost:8080/payment.html');
    console.log('   3. Verifique logs de inicialização do Stripe');

} catch (error) {
    console.error('❌ ERRO ao carregar configuração:', error.message);
    console.error('💡 Certifique-se que o arquivo config/environment.js existe');
}

console.log('\n🏁 Teste concluído!'); 