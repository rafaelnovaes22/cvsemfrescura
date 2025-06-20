// Debug ULTRA DETALHADO do Stripe - CV Sem Frescura
require('dotenv').config();

console.log('=== DEBUG ULTRA DETALHADO STRIPE ===');
console.log('');

const secretKey = process.env.STRIPE_SECRET_KEY;

console.log('🔍 ANÁLISE DA STRIPE_SECRET_KEY:');
console.log('');

if (secretKey) {
    console.log('✅ Variável EXISTS');
    console.log('📏 Length:', secretKey.length);
    console.log('🔤 Tipo:', typeof secretKey);
    console.log('');

    console.log('🔍 PRIMEIROS 30 CARACTERES:');
    console.log('Raw:', JSON.stringify(secretKey.substring(0, 30)));
    console.log('Display:', secretKey.substring(0, 30));
    console.log('');

    console.log('🔍 ANÁLISE CHAR POR CHAR (primeiros 10):');
    for (let i = 0; i < Math.min(10, secretKey.length); i++) {
        const char = secretKey[i];
        const code = char.charCodeAt(0);
        console.log(`[${i}] "${char}" (ASCII: ${code})`);
    }
    console.log('');

    console.log('🧹 TESTE DE LIMPEZA:');
    const trimmed = secretKey.trim();
    console.log('Original length:', secretKey.length);
    console.log('Trimmed length:', trimmed.length);
    console.log('Starts with sk_ (original):', secretKey.startsWith('sk_'));
    console.log('Starts with sk_ (trimmed):', trimmed.startsWith('sk_'));
    console.log('');

    console.log('🔍 COMPARAÇÃO COM PADRÃO:');
    const expectedStart = 'sk_';
    const actualStart = secretKey.substring(0, 3);
    console.log('Expected:', JSON.stringify(expectedStart));
    console.log('Actual:', JSON.stringify(actualStart));
    console.log('Match?', actualStart === expectedStart);
    console.log('');

    console.log('🧪 TESTE DE REGEX:');
    const stripePattern = /^sk_(test_|live_)[a-zA-Z0-9]+$/;
    console.log('Matches Stripe pattern:', stripePattern.test(secretKey));
    console.log('Matches Stripe pattern (trimmed):', stripePattern.test(trimmed));

} else {
    console.log('❌ Variável NÃO EXISTS ou é NULL/UNDEFINED');
}

console.log('');
console.log('🌍 OUTRAS VARIÁVEIS:');
console.log('STRIPE_PUBLISHABLE_KEY exists:', !!process.env.STRIPE_PUBLISHABLE_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

console.log('');
console.log('=== FIM DEBUG ULTRA DETALHADO ==='); 