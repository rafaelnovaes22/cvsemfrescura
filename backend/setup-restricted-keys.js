#!/usr/bin/env node

// 🔐 Setup de Chaves Restritas do Stripe (Mais Seguras)
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('🔐 === CONFIGURAÇÃO DE CHAVES RESTRITAS DO STRIPE ===');
    console.log('📋 Chaves restritas são mais seguras que chaves completas\n');

    console.log('🛡️ === VANTAGENS DAS CHAVES RESTRITAS ===');
    console.log('✅ Acesso limitado apenas às funções necessárias');
    console.log('✅ Menor risco se comprometidas');
    console.log('✅ Recomendadas pelo próprio Stripe');
    console.log('✅ Sem necessidade de criptografia adicional\n');

    console.log('🔧 === COMO CRIAR CHAVES RESTRITAS ===');
    console.log('1. Acesse: https://dashboard.stripe.com/apikeys');
    console.log('2. Clique em "Create restricted key"');
    console.log('3. Configure as permissões:\n');

    console.log('   📋 PERMISSÕES RECOMENDADAS:');
    console.log('   ✅ Payment Intents: Read + Write');
    console.log('   ✅ Customers: Read + Write');
    console.log('   ✅ Charges: Read');
    console.log('   ✅ Disputes: Read');
    console.log('   ✅ Refunds: Write');
    console.log('   ✅ Webhooks: Read\n');

    console.log('   ❌ NÃO NECESSÁRIO:');
    console.log('   ❌ Account settings');
    console.log('   ❌ Connect');
    console.log('   ❌ Terminal');
    console.log('   ❌ Issuing');
    console.log('   ❌ Sigma\n');

    const continueSetup = await askQuestion('Você já criou uma chave restrita? (s/n): ');

    if (continueSetup.toLowerCase() === 's') {
        console.log('\n🚀 === CONFIGURAÇÃO NO RAILWAY ===');
        console.log('📋 Configure estas variáveis no Railway:\n');

        const restrictedKey = await askQuestion('Digite sua chave restrita (rk_live_...): ');
        const publishableKey = await askQuestion('Digite sua chave pública (pk_live_...): ');
        const webhookSecret = await askQuestion('Digite o webhook secret (opcional): ');

        // Validar chaves
        if (!restrictedKey.startsWith('rk_live_') && !restrictedKey.startsWith('rk_test_')) {
            console.log('⚠️ ATENÇÃO: A chave deve começar com rk_live_ ou rk_test_');
        }
        if (!publishableKey.startsWith('pk_live_') && !publishableKey.startsWith('pk_test_')) {
            console.log('⚠️ ATENÇÃO: A chave pública deve começar com pk_live_ ou pk_test_');
        }

        console.log('\n📝 === VARIÁVEIS PARA O RAILWAY ===');
        console.log('NODE_ENV=production');
        console.log(`STRIPE_SECRET_KEY=${restrictedKey}`);
        console.log(`STRIPE_PUBLISHABLE_KEY=${publishableKey}`);
        if (webhookSecret) {
            console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
        }
        console.log('DISABLE_ENCRYPTION=true');

        console.log('\n✅ === VANTAGENS DESTA CONFIGURAÇÃO ===');
        console.log('🔐 Chaves com acesso limitado');
        console.log('🚀 Configuração simples');
        console.log('📊 Visibilidade completa nos logs');
        console.log('🛡️ Segurança adequada para produção');

    } else {
        console.log('\n📋 === GUIA PASSO A PASSO ===');
        console.log('1. Acesse: https://dashboard.stripe.com/apikeys');
        console.log('2. Clique em "Create restricted key"');
        console.log('3. Dê um nome: "CV Sem Frescura - Produção"');
        console.log('4. Configure as permissões listadas acima');
        console.log('5. Clique em "Create key"');
        console.log('6. Copie a chave (rk_live_...)');
        console.log('7. Execute este script novamente\n');
    }

    console.log('🔍 === COMO VERIFICAR SE FUNCIONOU ===');
    console.log('1. Faça deploy no Railway');
    console.log('2. Verifique os logs: railway logs --follow');
    console.log('3. Procure por: "✅ Stripe inicializado com sucesso"');
    console.log('4. Teste um pagamento na aplicação\n');

    console.log('📞 === TROUBLESHOOTING ===');
    console.log('❌ "Invalid API Key" = Chave incorreta ou malformada');
    console.log('❌ "Permission denied" = Permissões insuficientes na chave');
    console.log('✅ "Stripe inicializado" = Tudo funcionando\n');

    console.log('✅ Setup concluído! Esta é uma solução segura e simples.');
    rl.close();
}

main().catch(console.error); 