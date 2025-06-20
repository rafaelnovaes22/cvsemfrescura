#!/usr/bin/env node

// 🔐 Re-criptografar Chaves com Sistema Seguro
const readline = require('readline');
const crypto = require('crypto');
const { encrypt } = require('./utils/encryption');

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
    console.log('🔐 === RE-CRIPTOGRAFIA SEGURA DE CHAVES ===');
    console.log('📋 Este script vai criptografar suas chaves com AES-256-GCM\n');

    // Verificar ENCRYPTION_KEY
    let encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
        console.log('🔑 ENCRYPTION_KEY não encontrada.');
        const generateNew = await askQuestion('Gerar nova chave? (s/n): ');

        if (generateNew.toLowerCase() === 's') {
            encryptionKey = crypto.randomBytes(32).toString('hex');
            process.env.ENCRYPTION_KEY = encryptionKey;
            console.log('\n✅ Nova ENCRYPTION_KEY gerada!');
            console.log('⚠️ GUARDE COM SEGURANÇA:');
            console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);
        } else {
            console.log('❌ Processo cancelado');
            rl.close();
            return;
        }
    } else {
        console.log('✅ ENCRYPTION_KEY encontrada\n');
    }

    // Coletar chaves
    console.log('📋 Digite suas chaves do Stripe:\n');

    const stripeSecretKey = await askQuestion('STRIPE_SECRET_KEY (sk_live_...): ');
    if (!stripeSecretKey.startsWith('sk_') && !stripeSecretKey.startsWith('rk_')) {
        console.log('⚠️ Aviso: Chave não parece ser válida');
    }

    const stripePublishableKey = await askQuestion('STRIPE_PUBLISHABLE_KEY (pk_live_...): ');
    if (!stripePublishableKey.startsWith('pk_')) {
        console.log('⚠️ Aviso: Chave não parece ser válida');
    }

    const stripeWebhookSecret = await askQuestion('STRIPE_WEBHOOK_SECRET (opcional, Enter para pular): ');

    // Criptografar
    console.log('\n🔐 Criptografando chaves...');

    const encryptedSecret = encrypt(stripeSecretKey);
    const encryptedPublishable = encrypt(stripePublishableKey);
    const encryptedWebhook = stripeWebhookSecret ? encrypt(stripeWebhookSecret) : null;

    if (!encryptedSecret || !encryptedPublishable) {
        console.log('❌ Erro na criptografia');
        rl.close();
        return;
    }

    // Mostrar resultados
    console.log('\n✅ === CHAVES CRIPTOGRAFADAS COM SUCESSO ===');
    console.log('\n📋 Configure estas variáveis no Railway:\n');
    console.log('NODE_ENV=production');
    console.log(`ENCRYPTION_KEY=${encryptionKey}`);
    console.log(`STRIPE_SECRET_KEY=${encryptedSecret}`);
    console.log(`STRIPE_PUBLISHABLE_KEY=${encryptedPublishable}`);
    if (encryptedWebhook) {
        console.log(`STRIPE_WEBHOOK_SECRET=${encryptedWebhook}`);
    }
    console.log('\n⚠️ IMPORTANTE: REMOVA esta variável se existir:');
    console.log('DISABLE_ENCRYPTION (delete)');

    console.log('\n🛡️ Segurança implementada:');
    console.log('✅ AES-256-GCM com autenticação');
    console.log('✅ Tags de verificação de integridade');
    console.log('✅ Proteção contra tampering');
    console.log('✅ Compatibilidade com dados antigos');

    console.log('\n📝 Próximos passos:');
    console.log('1. Copie as variáveis acima');
    console.log('2. Configure no Railway');
    console.log('3. Deploy automático ocorrerá');
    console.log('4. Teste um pagamento');

    rl.close();
}

main().catch(console.error); 