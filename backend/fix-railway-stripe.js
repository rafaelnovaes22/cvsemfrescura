#!/usr/bin/env node

// 🚀 Script para corrigir configurações do Stripe no Railway
// Este script ajuda a resolver problemas com chaves em texto plano

console.log('🔧 === CORREÇÃO STRIPE RAILWAY ===');
console.log('📋 Este script oferece soluções para o problema das chaves do Stripe\n');

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
    console.log('❓ Qual é a situação atual das suas chaves no Railway?');
    console.log('1. As chaves estão em texto plano (sk_live_..., pk_live_...)');
    console.log('2. As chaves estão criptografadas');
    console.log('3. Não sei/quero verificar');

    const choice = await askQuestion('\n👉 Digite o número da opção (1-3): ');

    switch (choice) {
        case '1':
            await handlePlainTextKeys();
            break;
        case '2':
            await handleEncryptedKeys();
            break;
        case '3':
            await checkCurrentState();
            break;
        default:
            console.log('❌ Opção inválida');
            break;
    }

    rl.close();
}

async function handlePlainTextKeys() {
    console.log('\n✅ === SOLUÇÃO PARA CHAVES EM TEXTO PLANO ===');
    console.log('📋 Se as chaves estão em texto plano no Railway, você tem duas opções:\n');

    console.log('🎯 OPÇÃO 1: Desabilitar criptografia (mais rápido)');
    console.log('   - Adicione a variável: DISABLE_ENCRYPTION=true');
    console.log('   - Isso fará o sistema usar as chaves diretamente\n');

    console.log('🎯 OPÇÃO 2: Criptografar as chaves');
    console.log('   - Use o script de criptografia para proteger as chaves');
    console.log('   - Mantenha DISABLE_ENCRYPTION=false ou remova ela\n');

    const solution = await askQuestion('👉 Qual opção prefere? (1 ou 2): ');

    if (solution === '1') {
        console.log('\n🔧 === CONFIGURAÇÃO RAILWAY ===');
        console.log('1. Acesse o Railway Dashboard');
        console.log('2. Vá para o seu projeto');
        console.log('3. Clique em "Variables"');
        console.log('4. Adicione: DISABLE_ENCRYPTION=true');
        console.log('5. Clique em "Deploy"');
        console.log('\n✅ Pronto! O sistema usará as chaves diretamente.');
    } else if (solution === '2') {
        console.log('\n🔐 === PROCESSO DE CRIPTOGRAFIA ===');
        console.log('1. Execute: node encrypt-keys.js');
        console.log('2. Siga as instruções para criptografar suas chaves');
        console.log('3. Atualize as variáveis no Railway com as chaves criptografadas');
        console.log('4. Certifique-se que DISABLE_ENCRYPTION não está definida');
    }
}

async function handleEncryptedKeys() {
    console.log('\n🔐 === CHAVES CRIPTOGRAFADAS ===');
    console.log('📋 Se as chaves estão criptografadas, verifique:\n');

    console.log('✅ Variáveis necessárias no Railway:');
    console.log('   - ENCRYPTION_KEY (sua chave de criptografia)');
    console.log('   - STRIPE_SECRET_KEY (criptografada)');
    console.log('   - STRIPE_PUBLISHABLE_KEY (criptografada)');
    console.log('   - DISABLE_ENCRYPTION não deve estar definida como true\n');

    console.log('🔍 Para verificar se está funcionando:');
    console.log('   - Olhe os logs do Railway');
    console.log('   - Procure por mensagens de descriptografia');
    console.log('   - Deve aparecer "✅ Chave descriptografada com sucesso"');
}

async function checkCurrentState() {
    console.log('\n🔍 === VERIFICAÇÃO DO ESTADO ATUAL ===');
    console.log('📋 Para verificar o estado das suas chaves:\n');

    console.log('1. Execute este script de debug:');
    console.log('   node debug-stripe-railway.js\n');

    console.log('2. Verifique os logs do Railway:');
    console.log('   - Procure por mensagens do Stripe');
    console.log('   - Veja se aparecem erros de "Invalid API Key"');
    console.log('   - Observe se a descriptografia está funcionando\n');

    console.log('3. Baseado no resultado, escolha a solução adequada');
}

// Executar o script
main().catch(console.error); 