#!/usr/bin/env node

// 🔧 Correção Específica da Configuração Railway
console.log('🔧 === CORREÇÃO CONFIGURAÇÃO RAILWAY ===');
console.log('📋 Baseado no diagnóstico, vou gerar a configuração correta\n');

const crypto = require('crypto');
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
    console.log('🔍 PROBLEMA IDENTIFICADO:');
    console.log('- Suas chaves do Stripe estão em TEXTO PLANO no Railway');
    console.log('- Mas o sistema está tentando descriptografá-las');
    console.log('- Isso causa conflito e pode gerar erro 503\n');

    console.log('📋 SOLUÇÕES DISPONÍVEIS:\n');
    console.log('1. Manter chaves em texto plano (mais simples)');
    console.log('2. Criptografar todas as chaves (mais seguro)');
    console.log('3. Rollback temporário\n');

    const choice = await askQuestion('Qual solução prefere? (1/2/3): ');

    if (choice === '1') {
        console.log('\n✅ === SOLUÇÃO 1: CHAVES EM TEXTO PLANO ===');
        console.log('📋 Configure estas variáveis no Railway:\n');
        console.log('NODE_ENV=production');
        console.log('DISABLE_ENCRYPTION=true');
        console.log('STRIPE_SECRET_KEY=sk_live_sua_chave_aqui');
        console.log('STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_aqui');
        console.log('STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui');
        console.log('\n⚠️ REMOVA estas se existirem:');
        console.log('ENCRYPTION_KEY (delete)');
        console.log('\n✅ Isso resolverá o erro 503 imediatamente!');

    } else if (choice === '2') {
        console.log('\n🔐 === SOLUÇÃO 2: CRIPTOGRAFIA COMPLETA ===');

        // Gerar nova ENCRYPTION_KEY
        const encryptionKey = crypto.randomBytes(32).toString('hex');
        process.env.ENCRYPTION_KEY = encryptionKey;

        console.log('🔑 Nova ENCRYPTION_KEY gerada:', encryptionKey);
        console.log('\n📋 Digite suas chaves do Stripe:');

        const secretKey = await askQuestion('STRIPE_SECRET_KEY (sk_live_...): ');
        const publishableKey = await askQuestion('STRIPE_PUBLISHABLE_KEY (pk_live_...): ');
        const webhookSecret = await askQuestion('STRIPE_WEBHOOK_SECRET (whsec_...): ');

        // Carregar módulo de criptografia
        const { encrypt } = require('./utils/encryption');

        console.log('\n🔐 Criptografando...');
        const encryptedSecret = encrypt(secretKey);
        const encryptedPublishable = encrypt(publishableKey);
        const encryptedWebhook = webhookSecret ? encrypt(webhookSecret) : null;

        console.log('\n✅ === CONFIGURAÇÃO PARA O RAILWAY ===');
        console.log('NODE_ENV=production');
        console.log(`ENCRYPTION_KEY=${encryptionKey}`);
        console.log(`STRIPE_SECRET_KEY=${encryptedSecret}`);
        console.log(`STRIPE_PUBLISHABLE_KEY=${encryptedPublishable}`);
        if (encryptedWebhook) {
            console.log(`STRIPE_WEBHOOK_SECRET=${encryptedWebhook}`);
        }
        console.log('\n⚠️ REMOVA esta se existir:');
        console.log('DISABLE_ENCRYPTION (delete)');

    } else if (choice === '3') {
        console.log('\n🔄 === SOLUÇÃO 3: ROLLBACK TEMPORÁRIO ===');
        console.log('Execute estes comandos:');
        console.log('1. copy utils\\encryption.backup.js utils\\encryption.js');
        console.log('2. git add . && git commit -m "hotfix: rollback criptografia"');
        console.log('3. git push');
        console.log('\n✅ Isso restaurará o funcionamento anterior');

    } else {
        console.log('❌ Opção inválida');
    }

    console.log('\n📞 === VERIFICAÇÃO ===');
    console.log('Após aplicar a solução:');
    console.log('1. Aguarde o deploy do Railway (1-2 minutos)');
    console.log('2. Teste um pagamento');
    console.log('3. Verifique os logs: railway logs --follow');
    console.log('\n⚡ O erro 503 deve desaparecer!');

    rl.close();
}

main().catch(console.error); 