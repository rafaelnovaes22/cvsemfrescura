const { encrypt } = require('./utils/encryption');

// Define a chave de criptografia
process.env.ENCRYPTION_KEY = 'fb5cfabd6377a7e4761a123320d04221618c951f6b243d0c017c8c938f2c1d61';

// Pega a chave dos argumentos
const key = process.argv[2];

if (!key) {
    console.log('❌ Uso: node encrypt-single.js "sua_chave_aqui"');
    console.log('📋 Exemplo: node encrypt-single.js "sk_live_123456789"');
    process.exit(1);
}

// Criptografa e exibe
const encrypted = encrypt(key);

if (encrypted) {
    console.log('🔐 Chave criptografada:');
    console.log(encrypted);
    console.log('');
    console.log('📋 Para configurar no Railway:');
    console.log(`   ${process.argv[3] || 'NOME_DA_VARIAVEL'}=${encrypted}`);
} else {
    console.log('❌ Erro ao criptografar a chave');
} 