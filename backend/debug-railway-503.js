#!/usr/bin/env node

// 🔍 Diagnóstico Avançado - Erro 503 Railway
console.log('🔍 === DIAGNÓSTICO AVANÇADO DO ERRO 503 ===');
console.log('📋 Investigando possíveis causas após configurar ENCRYPTION_KEY\n');

// Simular ambiente Railway
process.env.NODE_ENV = 'production';
process.env.RAILWAY_ENVIRONMENT = 'production';

// Teste 1: Verificar formato da ENCRYPTION_KEY
console.log('🔑 === TESTE 1: FORMATO DA ENCRYPTION_KEY ===');
const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_KEY = testKey;

try {
    const crypto = require('crypto');

    // Testar se é hexadecimal válido
    if (!/^[0-9a-fA-F]{64}$/.test(testKey)) {
        console.log('❌ ENCRYPTION_KEY deve ter 64 caracteres hexadecimais');
    } else {
        console.log('✅ Formato da ENCRYPTION_KEY válido');
    }

    // Testar conversão para Buffer
    const buffer = Buffer.from(testKey, 'hex');
    console.log('✅ Conversão para Buffer OK');

} catch (error) {
    console.log('❌ Erro no formato da chave:', error.message);
}

// Teste 2: Módulo de Criptografia
console.log('\n🔐 === TESTE 2: MÓDULO DE CRIPTOGRAFIA ===');
try {
    console.log('🔍 Carregando módulo...');
    const encryption = require('./utils/encryption');
    console.log('✅ Módulo carregado com sucesso');

    // Testar encrypt/decrypt
    const testData = 'test_data_123';
    const encrypted = encryption.encrypt(testData);
    if (encrypted) {
        const decrypted = encryption.decrypt(encrypted);
        if (decrypted === testData) {
            console.log('✅ Criptografia funcionando');
        } else {
            console.log('❌ Erro na descriptografia');
        }
    } else {
        console.log('❌ Erro na criptografia');
    }
} catch (error) {
    console.log('❌ ERRO no módulo:', error.message);
    console.log('Stack:', error.stack);
}

// Teste 3: Configuração de Ambiente
console.log('\n🌍 === TESTE 3: CONFIGURAÇÃO DE AMBIENTE ===');
try {
    console.log('🔍 Carregando configuração...');
    delete require.cache[require.resolve('./config/environment')];
    const config = require('./config/environment');
    console.log('✅ Configuração carregada');
    console.log('🔍 Stripe configurado:', !!config.stripe.secretKey);
} catch (error) {
    console.log('❌ ERRO na configuração:', error.message);
    console.log('Stack:', error.stack);
}

// Teste 4: Dependências
console.log('\n📦 === TESTE 4: DEPENDÊNCIAS ===');
try {
    console.log('🔍 Verificando dependências críticas...');
    require('crypto');
    console.log('✅ crypto');
    require('dotenv');
    console.log('✅ dotenv');
    require('express');
    console.log('✅ express');
    require('stripe');
    console.log('✅ stripe');
} catch (error) {
    console.log('❌ Dependência faltando:', error.message);
}

// Teste 5: Servidor Express
console.log('\n🚀 === TESTE 5: INICIALIZAÇÃO DO SERVIDOR ===');
try {
    console.log('🔍 Testando inicialização do Express...');
    const express = require('express');
    const app = express();
    console.log('✅ Express inicializado');

    // Testar middleware básico
    app.use(express.json());
    console.log('✅ Middleware JSON configurado');

} catch (error) {
    console.log('❌ ERRO no Express:', error.message);
}

// Teste 6: Variáveis de Ambiente Esperadas
console.log('\n📋 === TESTE 6: VARIÁVEIS DE AMBIENTE ===');
const requiredVars = [
    'NODE_ENV',
    'ENCRYPTION_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'DATABASE_URL',
    'JWT_SECRET'
];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: configurada`);
    } else {
        console.log(`⚠️ ${varName}: não configurada`);
    }
});

console.log('\n🔍 === POSSÍVEIS CAUSAS DO ERRO 503 ===');
console.log('1. Formato incorreto da ENCRYPTION_KEY (deve ser 64 chars hex)');
console.log('2. Conflito entre variáveis (DISABLE_ENCRYPTION + ENCRYPTION_KEY)');
console.log('3. Problema nas chaves do Stripe');
console.log('4. Falta de variáveis obrigatórias');
console.log('5. Erro na inicialização do banco de dados');
console.log('6. Timeout na inicialização');

console.log('\n💡 === SOLUÇÕES SUGERIDAS ===');
console.log('1. Verifique se ENCRYPTION_KEY tem exatamente 64 caracteres hexadecimais');
console.log('2. Remova DISABLE_ENCRYPTION se existir');
console.log('3. Verifique logs do Railway: railway logs --follow');
console.log('4. Teste com chaves de desenvolvimento primeiro');
console.log('5. Considere usar rollback temporário se urgente');

console.log('\n✅ Diagnóstico concluído!'); 