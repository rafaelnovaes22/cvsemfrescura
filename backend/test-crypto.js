const { encrypt, decrypt } = require('./utils/encryption');

// Define a chave de criptografia
process.env.ENCRYPTION_KEY = 'fb5cfabd6377a7e4761a123320d04221618c951f6b243d0c017c8c938f2c1d61';

// Testa com chave similar ao Stripe
const testKey = 'sk_test_51234567890abcdefghijklmnopqrstuvwxyz';

console.log('🔍 Testando sistema de criptografia...');
console.log('==========================================');
console.log('Original:', testKey);
console.log('Tamanho original:', testKey.length);

const encrypted = encrypt(testKey);
console.log('Criptografado:', encrypted);
console.log('Tamanho criptografado:', encrypted ? encrypted.length : 'NULL');

if (encrypted) {
    const decrypted = decrypt(encrypted);
    console.log('Descriptografado:', decrypted);
    console.log('Tamanho descriptografado:', decrypted ? decrypted.length : 'NULL');

    const isEqual = testKey === decrypted;
    console.log('==========================================');
    console.log('✅ Teste passou:', isEqual);

    if (!isEqual) {
        console.log('❌ ERRO: Chaves não são iguais!');
        console.log('Diferença encontrada:');
        for (let i = 0; i < Math.max(testKey.length, decrypted?.length || 0); i++) {
            if (testKey[i] !== decrypted?.[i]) {
                console.log(`   Posição ${i}: "${testKey[i]}" vs "${decrypted?.[i]}"`);
                break;
            }
        }
    }
} else {
    console.log('❌ ERRO: Falha na criptografia!');
} 