require('dotenv').config();

async function testCrypto() {
    console.log('🔐 Testando sistema de criptografia...\n');

    try {
        const { encrypt, decrypt, maskKey } = require('./utils/encryption');

        // Teste 1: Criptografia/Descriptografia básica
        console.log('🧪 Teste 1: Criptografia básica');
        const testText = 'sk_test_1234567890abcdefghijklmnop';
        console.log('📝 Texto original:', maskKey(testText));

        const encrypted = encrypt(testText);
        console.log('🔒 Texto criptografado:', encrypted ? 'OK (tamanho: ' + encrypted.length + ')' : 'ERRO');

        const decrypted = decrypt(encrypted);
        console.log('🔓 Texto descriptografado:', maskKey(decrypted));
        console.log('✅ Sucesso:', testText === decrypted ? 'SIM' : 'NÃO');

        // Teste 2: Verificar ENCRYPTION_KEY
        console.log('\n🧪 Teste 2: ENCRYPTION_KEY');
        const encKey = process.env.ENCRYPTION_KEY;
        console.log('🔑 ENCRYPTION_KEY presente:', !!encKey);
        console.log('🔑 ENCRYPTION_KEY tamanho:', encKey ? encKey.length : 0);
        console.log('🔑 ENCRYPTION_KEY válida:', encKey && encKey.length === 64);

        // Teste 3: Testar com chave Stripe real (se existir)
        console.log('\n🧪 Teste 3: Chave Stripe do ambiente');
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
            console.log('💳 Chave Stripe presente:', !!stripeKey);
            console.log('💳 Chave Stripe mascarada:', maskKey(stripeKey));
            console.log('💳 Parece criptografada:', !stripeKey.startsWith('sk_') && stripeKey.length > 50);

            if (!stripeKey.startsWith('sk_') && stripeKey.length > 50) {
                console.log('🔓 Tentando descriptografar chave Stripe...');
                try {
                    const decryptedStripe = decrypt(stripeKey);
                    console.log('✅ Descriptografia bem-sucedida:', !!decryptedStripe);
                    console.log('💳 Chave descriptografada válida:', decryptedStripe?.startsWith('sk_'));
                    console.log('💳 Chave descriptografada mascarada:', maskKey(decryptedStripe));
                } catch (error) {
                    console.log('❌ Erro na descriptografia:', error.message);
                }
            }
        } else {
            console.log('💳 Nenhuma chave Stripe encontrada');
        }

    } catch (error) {
        console.error('❌ Erro no teste de criptografia:', error.message);
        console.error('📋 Stack:', error.stack);
    }
}

testCrypto(); 