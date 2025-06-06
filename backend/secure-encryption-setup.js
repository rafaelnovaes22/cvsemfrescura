#!/usr/bin/env node

// 🔐 Setup Seguro de Criptografia para Railway
const crypto = require('crypto');
const readline = require('readline');
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

function generateSecureKey() {
    return crypto.randomBytes(32).toString('hex');
}

function maskKey(key) {
    if (!key || key.length < 8) return '[CHAVE_INVÁLIDA]';
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    const middle = '*'.repeat(Math.max(0, key.length - 8));
    return `${start}${middle}${end}`;
}

async function main() {
    console.log('🔐 === CONFIGURAÇÃO SEGURA DE CRIPTOGRAFIA ===');
    console.log('📋 Este script vai configurar criptografia segura para suas chaves\n');

    // Passo 1: Gerar/Verificar ENCRYPTION_KEY
    console.log('🔑 === PASSO 1: CHAVE DE CRIPTOGRAFIA ===');
    const hasEncryptionKey = await askQuestion('Você já tem uma ENCRYPTION_KEY? (s/n): ');

    let encryptionKey;
    if (hasEncryptionKey.toLowerCase() === 's') {
        encryptionKey = await askQuestion('Digite sua ENCRYPTION_KEY atual (64 chars): ');
        if (encryptionKey.length !== 64) {
            console.log('❌ ENCRYPTION_KEY deve ter exatamente 64 caracteres');
            console.log('🔄 Gerando nova chave segura...');
            encryptionKey = generateSecureKey();
        }
    } else {
        console.log('🔄 Gerando nova ENCRYPTION_KEY segura...');
        encryptionKey = generateSecureKey();
    }

    console.log('✅ ENCRYPTION_KEY configurada:', maskKey(encryptionKey));

    // Definir a chave temporariamente para este processo
    process.env.ENCRYPTION_KEY = encryptionKey;

    // Passo 2: Coletar chaves do Stripe
    console.log('\n💳 === PASSO 2: CHAVES DO STRIPE ===');
    console.log('⚠️ IMPORTANTE: Use suas chaves de PRODUÇÃO (sk_live_, pk_live_)\n');

    const stripeSecretKey = await askQuestion('Digite sua STRIPE_SECRET_KEY (sk_live_...): ');
    const stripePublishableKey = await askQuestion('Digite sua STRIPE_PUBLISHABLE_KEY (pk_live_...): ');
    const stripeWebhookSecret = await askQuestion('Digite sua STRIPE_WEBHOOK_SECRET (opcional): ');

    // Validar chaves
    if (!stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('sk_test_')) {
        console.log('⚠️ ATENÇÃO: Secret key não parece válida');
    }
    if (!stripePublishableKey.startsWith('pk_live_') && !stripePublishableKey.startsWith('pk_test_')) {
        console.log('⚠️ ATENÇÃO: Publishable key não parece válida');
    }

    // Passo 3: Criptografar chaves
    console.log('\n🔐 === PASSO 3: CRIPTOGRAFANDO CHAVES ===');

    const encryptedSecretKey = encrypt(stripeSecretKey);
    const encryptedPublishableKey = encrypt(stripePublishableKey);
    const encryptedWebhookSecret = stripeWebhookSecret ? encrypt(stripeWebhookSecret) : null;

    if (!encryptedSecretKey || !encryptedPublishableKey) {
        console.error('❌ Erro na criptografia. Verifique as chaves.');
        rl.close();
        return;
    }

    console.log('✅ Chaves criptografadas com sucesso!');

    // Passo 4: Instruções para Railway
    console.log('\n🚀 === PASSO 4: CONFIGURAÇÃO NO RAILWAY ===');
    console.log('📋 Configure estas variáveis no Railway Dashboard:\n');

    console.log('1. Acesse: https://railway.app/dashboard');
    console.log('2. Vá para seu projeto > Variables');
    console.log('3. Adicione/Atualize estas variáveis:\n');

    console.log('ENCRYPTION_KEY=');
    console.log(encryptionKey);
    console.log('\nSTRIPE_SECRET_KEY=');
    console.log(encryptedSecretKey);
    console.log('\nSTRIPE_PUBLISHABLE_KEY=');
    console.log(encryptedPublishableKey);
    if (encryptedWebhookSecret) {
        console.log('\nSTRIPE_WEBHOOK_SECRET=');
        console.log(encryptedWebhookSecret);
    }

    console.log('\n🚫 IMPORTANTE: REMOVA esta variável se existir:');
    console.log('DISABLE_ENCRYPTION (delete/remove)');

    console.log('\n✅ OUTRAS VARIÁVEIS NECESSÁRIAS:');
    console.log('NODE_ENV=production');
    console.log('DATABASE_URL=sua_url_do_banco');
    console.log('JWT_SECRET=seu_jwt_secret\n');

    // Passo 5: Backup e Segurança
    console.log('💾 === PASSO 5: BACKUP E SEGURANÇA ===');
    console.log('⚠️ GUARDE COM SEGURANÇA:');
    console.log('1. Sua ENCRYPTION_KEY:', maskKey(encryptionKey));
    console.log('2. Suas chaves originais do Stripe');
    console.log('3. Teste tudo antes de descartar backups\n');

    console.log('🔐 DICAS DE SEGURANÇA:');
    console.log('- Nunca compartilhe a ENCRYPTION_KEY');
    console.log('- Use gerenciador de senhas');
    console.log('- Mantenha backup das chaves originais');
    console.log('- Teste pagamentos após configurar\n');

    // Salvar em arquivo seguro (opcional)
    const saveToFile = await askQuestion('Salvar configuração em arquivo local? (s/n): ');
    if (saveToFile.toLowerCase() === 's') {
        const fs = require('fs');
        const configData = {
            encryption_key: encryptionKey,
            encrypted_keys: {
                secret: encryptedSecretKey,
                publishable: encryptedPublishableKey,
                webhook: encryptedWebhookSecret
            },
            created_at: new Date().toISOString()
        };

        fs.writeFileSync('stripe-config-backup.json', JSON.stringify(configData, null, 2));
        console.log('✅ Configuração salva em: stripe-config-backup.json');
        console.log('⚠️ NÃO commite este arquivo no Git!');
    }

    console.log('\n🎯 === PRÓXIMOS PASSOS ===');
    console.log('1. Configure as variáveis no Railway');
    console.log('2. Faça deploy');
    console.log('3. Teste um pagamento');
    console.log('4. Verifique os logs: railway logs --follow');
    console.log('\n✅ Configuração segura concluída!');

    rl.close();
}

main().catch(console.error); 