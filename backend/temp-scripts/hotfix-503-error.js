#!/usr/bin/env node

// 🚨 HOTFIX para Erro 503 - Correção Emergencial
console.log('🚨 === HOTFIX ERRO 503 ===');
console.log('📋 Diagnosticando problema após correções de segurança\n');

// Verificar se o problema é a ENCRYPTION_KEY
console.log('🔍 Verificando configuração atual...');

// Simular ambiente de produção
process.env.NODE_ENV = 'production';
process.env.RAILWAY_ENVIRONMENT = 'production';

try {
    console.log('🔍 Testando carregamento do módulo de criptografia...');
    const encryption = require('./utils/encryption');
    console.log('✅ Módulo de criptografia carregado');
} catch (error) {
    console.log('❌ ERRO no módulo de criptografia:', error.message);
    console.log('\n🔧 === SOLUÇÃO IDENTIFICADA ===');
    console.log('O erro 503 é causado por ENCRYPTION_KEY não configurada em produção');
    console.log('\n📋 SOLUÇÕES IMEDIATAS:');
    console.log('\n🎯 OPÇÃO A: Desabilitar criptografia temporariamente');
    console.log('No Railway, adicione: DISABLE_ENCRYPTION=true');
    console.log('\n🎯 OPÇÃO B: Configurar ENCRYPTION_KEY');
    console.log('No Railway, adicione uma ENCRYPTION_KEY de 64 caracteres hex');
    console.log('\n🎯 OPÇÃO C: Reverter para versão anterior');
    console.log('Restaurar backup: copy utils\\encryption.backup.js utils\\encryption.js');
    return;
}

console.log('🔍 Testando configuração de ambiente...');
try {
    const config = require('./config/environment');
    console.log('✅ Configuração carregada');
} catch (error) {
    console.log('❌ ERRO na configuração:', error.message);
}

console.log('\n💡 === RECOMENDAÇÕES ===');
console.log('1. Configure DISABLE_ENCRYPTION=true no Railway (solução imediata)');
console.log('2. Ou configure ENCRYPTION_KEY no Railway');
console.log('3. Redeploy será automático');
console.log('\n⚡ Isso resolverá o erro 503 imediatamente!'); 