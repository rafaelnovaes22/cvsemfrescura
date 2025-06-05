#!/usr/bin/env node

const { encrypt, maskKey } = require('../utils/encryption');

// 🚂 Script de Migração de Chaves para Railway - CV Sem Frescura
console.log('🚂 Migração de Chaves para Railway');
console.log('=====================================');

// Chaves que devem ser migradas
const KEYS_TO_MIGRATE = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'CLAUDE_API_KEY',
    'JWT_SECRET',
    'SMTP_PASS',
    'DATABASE_URL'
];

/**
 * Verifica se uma chave já está criptografada
 */
function isEncrypted(value) {
    if (!value) return false;

    // Se contém caracteres especiais da criptografia base64 e não parece ser uma chave real
    return !value.match(/^(sk_|pk_|whsec_|rk_)/) && value.length > 50;
}

/**
 * Migra as chaves para formato criptografado
 */
async function migrateKeys() {
    console.log('🔄 Iniciando migração de chaves...\n');

    let migratedCount = 0;
    let alreadyEncrypted = 0;
    let notFound = 0;

    // Verificar se temos ENCRYPTION_KEY
    if (!process.env.ENCRYPTION_KEY) {
        console.error('❌ ENCRYPTION_KEY não encontrada!');
        console.error('💡 Configure a variável ENCRYPTION_KEY no Railway primeiro.');
        console.error('💡 Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        process.exit(1);
    }

    console.log('✅ ENCRYPTION_KEY encontrada\n');

    // Processar cada chave
    for (const keyName of KEYS_TO_MIGRATE) {
        const originalValue = process.env[keyName];

        console.log(`🔍 Processando: ${keyName}`);

        if (!originalValue) {
            console.log(`   ⚠️  Não encontrada\n`);
            notFound++;
            continue;
        }

        if (isEncrypted(originalValue)) {
            console.log(`   ✅ Já está criptografada\n`);
            alreadyEncrypted++;
            continue;
        }

        // Criptografar a chave
        const encrypted = encrypt(originalValue);

        if (encrypted) {
            console.log(`   🔒 Original: ${maskKey(originalValue)}`);
            console.log(`   🔐 Criptografado: ${encrypted.substring(0, 20)}...`);
            console.log(`   📋 Configure no Railway:`);
            console.log(`       ${keyName}=${encrypted}`);
            console.log('');
            migratedCount++;
        } else {
            console.error(`   ❌ Erro ao criptografar\n`);
        }
    }

    // Resumo
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('====================');
    console.log(`✅ Chaves migradas: ${migratedCount}`);
    console.log(`🔒 Já criptografadas: ${alreadyEncrypted}`);
    console.log(`⚠️  Não encontradas: ${notFound}`);
    console.log(`📝 Total processadas: ${migratedCount + alreadyEncrypted + notFound}`);

    if (migratedCount > 0) {
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Copie os valores criptografados acima');
        console.log('2. No Railway Dashboard, substitua as variáveis originais');
        console.log('3. Mantenha backup das chaves originais');
        console.log('4. Teste a aplicação após cada mudança');
        console.log('5. Monitore os logs para verificar funcionamento');
    }

    if (alreadyEncrypted === KEYS_TO_MIGRATE.length) {
        console.log('\n🎉 Todas as chaves já estão criptografadas!');
        console.log('✅ Sistema de segurança está ativo.');
    }
}

/**
 * Verifica o status das chaves sem migrar
 */
function checkStatus() {
    console.log('🔍 STATUS ATUAL DAS CHAVES');
    console.log('==========================\n');

    for (const keyName of KEYS_TO_MIGRATE) {
        const value = process.env[keyName];

        if (!value) {
            console.log(`❌ ${keyName}: Não encontrada`);
        } else if (isEncrypted(value)) {
            console.log(`🔒 ${keyName}: Criptografada (${value.length} chars)`);
        } else {
            console.log(`⚠️  ${keyName}: Texto plano (${maskKey(value)})`);
        }
    }

    console.log(`\n📊 Chave de criptografia: ${process.env.ENCRYPTION_KEY ? '✅ Configurada' : '❌ Não encontrada'}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'não definido'}`);
}

/**
 * Gera uma nova chave de criptografia
 */
function generateKey() {
    const crypto = require('crypto');
    const newKey = crypto.randomBytes(32).toString('hex');

    console.log('🔐 NOVA CHAVE DE CRIPTOGRAFIA GERADA');
    console.log('====================================');
    console.log(`ENCRYPTION_KEY=${newKey}`);
    console.log('\n💡 Configure esta chave no Railway ANTES de executar a migração!');
}

// Processar argumentos da linha de comando
const command = process.argv[2];

switch (command) {
    case 'migrate':
        migrateKeys().catch(console.error);
        break;

    case 'status':
        checkStatus();
        break;

    case 'generate-key':
        generateKey();
        break;

    default:
        console.log(`
🚂 Script de Migração de Chaves para Railway

Comandos disponíveis:

  node migrate-railway-keys.js status
    Mostra o status atual das chaves (criptografadas ou não)

  node migrate-railway-keys.js generate-key  
    Gera uma nova chave de criptografia para usar no Railway

  node migrate-railway-keys.js migrate
    Migra todas as chaves para formato criptografado

Exemplo de uso no Railway:
  1. railway run node scripts/migrate-railway-keys.js status
  2. railway run node scripts/migrate-railway-keys.js migrate
  
Chaves monitoradas:
  ${KEYS_TO_MIGRATE.join(', ')}
`);
        break;
}

module.exports = {
    migrateKeys,
    checkStatus,
    generateKey,
    KEYS_TO_MIGRATE
}; 