#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { encrypt, decrypt, maskKey } = require('../utils/encryption');

// 🔐 Script de Criptografia de Variáveis de Ambiente - CV Sem Frescura
console.log('🔐 Iniciando criptografia de variáveis de ambiente...');

// Variáveis sensíveis que devem ser criptografadas
const SENSITIVE_VARS = [
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
 * Criptografa um arquivo .env
 * @param {string} inputFile - Arquivo de entrada
 * @param {string} outputFile - Arquivo de saída criptografado
 */
function encryptEnvFile(inputFile, outputFile) {
    console.log(`📄 Processando: ${inputFile}`);

    if (!fs.existsSync(inputFile)) {
        console.log(`⚠️ Arquivo não encontrado: ${inputFile}`);
        return;
    }

    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n');
    const encryptedLines = [];

    let encryptedCount = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Pular comentários e linhas vazias
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            encryptedLines.push(line);
            continue;
        }

        // Verificar se é uma variável de ambiente
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (!match) {
            encryptedLines.push(line);
            continue;
        }

        const [, varName, varValue] = match;

        // Verificar se é uma variável sensível
        if (SENSITIVE_VARS.includes(varName.trim())) {
            if (varValue && varValue.trim()) {
                const encrypted = encrypt(varValue.trim());
                if (encrypted) {
                    encryptedLines.push(`${varName}=${encrypted}`);
                    console.log(`🔒 ${varName}: ${maskKey(varValue.trim())} → [CRIPTOGRAFADO]`);
                    encryptedCount++;
                } else {
                    console.error(`❌ Erro ao criptografar ${varName}`);
                    encryptedLines.push(line);
                }
            } else {
                encryptedLines.push(line);
            }
        } else {
            encryptedLines.push(line);
        }
    }

    // Salvar arquivo criptografado
    fs.writeFileSync(outputFile, encryptedLines.join('\n'));
    console.log(`✅ Arquivo criptografado salvo: ${outputFile}`);
    console.log(`🔢 Variáveis criptografadas: ${encryptedCount}`);
}

/**
 * Descriptografa um arquivo .env
 * @param {string} inputFile - Arquivo criptografado
 * @param {string} outputFile - Arquivo de saída descriptografado
 */
function decryptEnvFile(inputFile, outputFile) {
    console.log(`📄 Descriptografando: ${inputFile}`);

    if (!fs.existsSync(inputFile)) {
        console.log(`⚠️ Arquivo não encontrado: ${inputFile}`);
        return;
    }

    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n');
    const decryptedLines = [];

    let decryptedCount = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Pular comentários e linhas vazias
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            decryptedLines.push(line);
            continue;
        }

        // Verificar se é uma variável de ambiente
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (!match) {
            decryptedLines.push(line);
            continue;
        }

        const [, varName, varValue] = match;

        // Verificar se é uma variável sensível
        if (SENSITIVE_VARS.includes(varName.trim())) {
            if (varValue && varValue.trim()) {
                const decrypted = decrypt(varValue.trim());
                if (decrypted) {
                    decryptedLines.push(`${varName}=${decrypted}`);
                    console.log(`🔓 ${varName}: [CRIPTOGRAFADO] → ${maskKey(decrypted)}`);
                    decryptedCount++;
                } else {
                    console.error(`❌ Erro ao descriptografar ${varName}`);
                    decryptedLines.push(line);
                }
            } else {
                decryptedLines.push(line);
            }
        } else {
            decryptedLines.push(line);
        }
    }

    // Salvar arquivo descriptografado
    fs.writeFileSync(outputFile, decryptedLines.join('\n'));
    console.log(`✅ Arquivo descriptografado salvo: ${outputFile}`);
    console.log(`🔢 Variáveis descriptografadas: ${decryptedCount}`);
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];
const inputFile = args[1];
const outputFile = args[2];

if (!command || !inputFile) {
    console.log(`
🔐 Script de Criptografia de Variáveis de Ambiente

Uso:
  node encrypt-env.js encrypt <arquivo-entrada> [arquivo-saida]
  node encrypt-env.js decrypt <arquivo-entrada> [arquivo-saida]

Exemplos:
  node encrypt-env.js encrypt .env .env.encrypted
  node encrypt-env.js decrypt .env.encrypted .env

Variáveis que serão criptografadas:
  ${SENSITIVE_VARS.join(', ')}
`);
    process.exit(1);
}

const defaultOutputFile = command === 'encrypt'
    ? inputFile + '.encrypted'
    : inputFile.replace('.encrypted', '');

const finalOutputFile = outputFile || defaultOutputFile;

try {
    if (command === 'encrypt') {
        encryptEnvFile(inputFile, finalOutputFile);
    } else if (command === 'decrypt') {
        decryptEnvFile(inputFile, finalOutputFile);
    } else {
        console.error('❌ Comando inválido. Use "encrypt" ou "decrypt"');
        process.exit(1);
    }

    console.log('✅ Operação concluída com sucesso!');

    if (command === 'encrypt') {
        console.log(`
💡 Próximos passos:
1. Verifique o arquivo criptografado: ${finalOutputFile}
2. Configure a variável ENCRYPTION_KEY no ambiente de produção
3. Use o arquivo criptografado no deploy
4. Mantenha o arquivo original seguro e fora do controle de versão
`);
    }

} catch (error) {
    console.error('❌ Erro durante a operação:', error.message);
    process.exit(1);
} 