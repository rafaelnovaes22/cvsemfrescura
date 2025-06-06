#!/usr/bin/env node

// 🔒 Script de Migração para Criptografia Segura
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Carregar versões antigas e novas
const oldEncryption = require('./utils/encryption');
const newEncryption = require('./utils/encryption-secure');

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
    console.log('🔒 === MIGRAÇÃO PARA CRIPTOGRAFIA SEGURA ===');
    console.log('📋 Este script vai migrar suas chaves para o novo sistema seguro\n');

    console.log('⚠️ AVISO: Este processo vai:');
    console.log('1. Descriptografar chaves com o sistema antigo');
    console.log('2. Re-criptografar com o sistema seguro (AES-256-GCM)');
    console.log('3. Atualizar o código para usar o novo módulo\n');

    const confirm = await askQuestion('Deseja continuar? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
        console.log('❌ Migração cancelada');
        rl.close();
        return;
    }

    // Passo 1: Verificar ENCRYPTION_KEY
    console.log('\n🔑 === PASSO 1: VERIFICAÇÃO DA CHAVE ===');

    if (!process.env.ENCRYPTION_KEY) {
        console.log('❌ ENCRYPTION_KEY não encontrada');
        console.log('Configure a variável de ambiente e tente novamente');
        rl.close();
        return;
    }

    console.log('✅ ENCRYPTION_KEY encontrada');
    console.log('🔍 Verificando novo módulo...');

    if (!newEncryption.isConfigured()) {
        console.log('❌ Novo módulo não está configurado corretamente');
        rl.close();
        return;
    }

    console.log('✅ Novo módulo configurado corretamente');

    // Passo 2: Teste de compatibilidade
    console.log('\n🧪 === PASSO 2: TESTE DE COMPATIBILIDADE ===');

    const testString = 'sk_test_1234567890';
    console.log('🔍 Testando criptografia...');

    try {
        const encrypted = newEncryption.encrypt(testString);
        const decrypted = newEncryption.decrypt(encrypted);

        if (decrypted === testString) {
            console.log('✅ Novo sistema funcionando corretamente');
        } else {
            console.log('❌ Erro no novo sistema de criptografia');
            rl.close();
            return;
        }
    } catch (error) {
        console.log('❌ Erro ao testar novo sistema:', error.message);
        rl.close();
        return;
    }

    // Passo 3: Backup do módulo antigo
    console.log('\n💾 === PASSO 3: BACKUP ===');

    const backupPath = path.join(__dirname, 'utils', 'encryption.old.js');
    const currentPath = path.join(__dirname, 'utils', 'encryption.js');
    const securePath = path.join(__dirname, 'utils', 'encryption-secure.js');

    try {
        fs.copyFileSync(currentPath, backupPath);
        console.log('✅ Backup criado em:', backupPath);
    } catch (error) {
        console.log('❌ Erro ao criar backup:', error.message);
        rl.close();
        return;
    }

    // Passo 4: Substituir módulo
    console.log('\n🔄 === PASSO 4: ATUALIZAÇÃO DO MÓDULO ===');

    try {
        // Copiar versão segura sobre a atual
        fs.copyFileSync(securePath, currentPath);
        console.log('✅ Módulo atualizado com sucesso');
    } catch (error) {
        console.log('❌ Erro ao atualizar módulo:', error.message);
        console.log('🔄 Restaurando backup...');
        fs.copyFileSync(backupPath, currentPath);
        rl.close();
        return;
    }

    // Passo 5: Re-criptografar chaves
    console.log('\n🔐 === PASSO 5: RE-CRIPTOGRAFIA DE CHAVES ===');
    console.log('⚠️ IMPORTANTE: Você precisará atualizar as chaves no Railway\n');

    const recryptKeys = await askQuestion('Deseja re-criptografar suas chaves agora? (s/n): ');

    if (recryptKeys.toLowerCase() === 's') {
        console.log('\n📋 Digite suas chaves para re-criptografar:\n');

        const stripeSecretKey = await askQuestion('STRIPE_SECRET_KEY (sk_live_...): ');
        const stripePublishableKey = await askQuestion('STRIPE_PUBLISHABLE_KEY (pk_live_...): ');
        const stripeWebhookSecret = await askQuestion('STRIPE_WEBHOOK_SECRET (opcional): ');

        console.log('\n🔐 Re-criptografando com novo sistema...');

        const encryptedSecret = newEncryption.encrypt(stripeSecretKey);
        const encryptedPublishable = newEncryption.encrypt(stripePublishableKey);
        const encryptedWebhook = stripeWebhookSecret ? newEncryption.encrypt(stripeWebhookSecret) : null;

        console.log('\n✅ === NOVAS CHAVES CRIPTOGRAFADAS ===');
        console.log('Configure estas no Railway:\n');

        console.log('STRIPE_SECRET_KEY=');
        console.log(encryptedSecret);
        console.log('\nSTRIPE_PUBLISHABLE_KEY=');
        console.log(encryptedPublishable);
        if (encryptedWebhook) {
            console.log('\nSTRIPE_WEBHOOK_SECRET=');
            console.log(encryptedWebhook);
        }
    }

    // Passo 6: Instruções finais
    console.log('\n✅ === MIGRAÇÃO CONCLUÍDA ===');
    console.log('📋 Próximos passos:');
    console.log('1. Atualize as chaves criptografadas no Railway');
    console.log('2. Faça deploy da aplicação');
    console.log('3. Teste um pagamento');
    console.log('4. Se tudo funcionar, delete encryption-secure.js e encryption.old.js');

    console.log('\n🛡️ Melhorias de segurança aplicadas:');
    console.log('✅ AES-256-GCM com autenticação');
    console.log('✅ Sem fallback inseguro');
    console.log('✅ Validação rigorosa de chaves');
    console.log('✅ Logs seguros em produção');

    console.log('\n⚠️ Se algo der errado:');
    console.log('1. Restaure: cp utils/encryption.old.js utils/encryption.js');
    console.log('2. Use as chaves antigas no Railway');

    rl.close();
}

main().catch(console.error); 