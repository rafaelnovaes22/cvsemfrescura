// Primeiro definir uma chave de criptografia válida
process.env.ENCRYPTION_KEY = 'fb5cfabd6377a7e4761a123320d04221618c951f6b243d0c017c8c938f2c1d61';

// Depois simular ambiente Railway 
process.env.RAILWAY_ENVIRONMENT = 'production';

// Criar uma chave de teste simples
const testStripeKey = 'sk_test_1234567890abcdefghijklmnop';

// Agora criptografar
const { encrypt, decrypt } = require('./utils/encryption');

console.log('🧪 Teste de Ambiente Railway');
console.log('===============================');
console.log('🔑 ENCRYPTION_KEY configurada:', !!process.env.ENCRYPTION_KEY);
console.log('🔑 ENCRYPTION_KEY tamanho:', process.env.ENCRYPTION_KEY.length);

// Testar criptografia primeiro
const encryptedKey = encrypt(testStripeKey);
console.log('🔑 Chave original:', testStripeKey);
console.log('🔒 Chave criptografada:', encryptedKey);
console.log('🔒 Tamanho criptografado:', encryptedKey ? encryptedKey.length : 'NULL');

if (!encryptedKey) {
    console.error('❌ Falha na criptografia - parando teste');
    process.exit(1);
}

// Testar descriptografia
const decryptedTest = decrypt(encryptedKey);
console.log('🔓 Teste descriptografia:', decryptedTest === testStripeKey ? 'OK' : 'ERRO');

// Configurar as variáveis de ambiente
process.env.STRIPE_SECRET_KEY = encryptedKey;
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_normal_key_not_encrypted';

console.log('');
console.log('🔄 Carregando configuração...');

// Limpar cache do require para recarregar
delete require.cache[require.resolve('./config/environment')];
const config = require('./config/environment');

console.log('');
console.log('📊 Resultado:');
console.log('✅ Chave descriptografada:', config.stripe.secretKey);
console.log('✅ Chave funciona:', config.stripe.secretKey === testStripeKey);
console.log('✅ Ambiente:', config.environment.name);
console.log('✅ Railway detectado:', config.environment.isRailway); 