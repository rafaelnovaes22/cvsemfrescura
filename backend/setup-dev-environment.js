// 🔧 Script de Configuração do Ambiente de Desenvolvimento
const fs = require('fs');
const path = require('path');

console.log('🚀 CONFIGURAÇÃO DO AMBIENTE DE DESENVOLVIMENTO\n');

const envPath = path.join(__dirname, '.env');
const examplePath = path.join(__dirname, 'env.local.example');

// Verificar se já existe arquivo .env
if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env já existe');

    // Verificar se contém as chaves do Stripe
    const envContent = fs.readFileSync(envPath, 'utf8');

    const hasStripeSecret = envContent.includes('STRIPE_SECRET_KEY=sk_');
    const hasStripePublishable = envContent.includes('STRIPE_PUBLISHABLE_KEY=pk_');

    if (hasStripeSecret && hasStripePublishable) {
        console.log('✅ Chaves do Stripe encontradas no .env');
        console.log('🎯 Ambiente já configurado!\n');

        console.log('📋 PRÓXIMOS PASSOS:');
        console.log('1. Reinicie o servidor: npm start');
        console.log('2. Teste: http://localhost:8080/payment.html');
        console.log('3. Use cartão teste: 4242 4242 4242 4242');
    } else {
        console.log('⚠️ Chaves do Stripe não encontradas no .env');
        console.log('💡 Configure STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY');
        console.log('🔗 Obtenha em: https://dashboard.stripe.com/test/apikeys');
    }
} else {
    console.log('❌ Arquivo .env não encontrado');

    if (fs.existsSync(examplePath)) {
        console.log('📝 Criando .env a partir do exemplo...');

        try {
            fs.copyFileSync(examplePath, envPath);
            console.log('✅ Arquivo .env criado com sucesso!');
            console.log('');
            console.log('🔧 CONFIGURAÇÃO NECESSÁRIA:');
            console.log('1. Abra o arquivo .env');
            console.log('2. Configure STRIPE_SECRET_KEY (sk_test_...)');
            console.log('3. Configure STRIPE_PUBLISHABLE_KEY (pk_test_...)');
            console.log('4. Configure OPENAI_API_KEY (sk-...)');
            console.log('');
            console.log('🔗 Obtenha chaves Stripe: https://dashboard.stripe.com/test/apikeys');
            console.log('🔗 Obtenha chave OpenAI: https://platform.openai.com/api-keys');
        } catch (error) {
            console.error('❌ Erro ao criar .env:', error.message);
        }
    } else {
        console.log('❌ Arquivo de exemplo não encontrado');
    }
}

// Testar configuração atual
console.log('\n' + '='.repeat(60));
console.log('🧪 TESTANDO CONFIGURAÇÃO ATUAL');
console.log('='.repeat(60));

try {
    require('dotenv').config();

    const checks = [
        {
            name: 'STRIPE_SECRET_KEY',
            value: process.env.STRIPE_SECRET_KEY,
            required: true,
            test: (val) => val && val.startsWith('sk_')
        },
        {
            name: 'STRIPE_PUBLISHABLE_KEY',
            value: process.env.STRIPE_PUBLISHABLE_KEY,
            required: true,
            test: (val) => val && val.startsWith('pk_')
        },
        {
            name: 'STRIPE_WEBHOOK_SECRET',
            value: process.env.STRIPE_WEBHOOK_SECRET,
            required: false,
            test: (val) => !val || val.startsWith('whsec_')
        },
        {
            name: 'OPENAI_API_KEY',
            value: process.env.OPENAI_API_KEY,
            required: true,
            test: (val) => val && val.startsWith('sk-')
        },
        {
            name: 'JWT_SECRET',
            value: process.env.JWT_SECRET,
            required: true,
            test: (val) => val && val.length >= 32
        }
    ];

    let allGood = true;

    checks.forEach(check => {
        const configured = !!check.value;
        const valid = check.test(check.value);
        const status = configured && valid ? '✅' : (check.required ? '❌' : '⚠️');

        console.log(`${status} ${check.name}: ${configured ? 'Configurada' : 'Não configurada'}`);

        if (configured && !valid) {
            console.log(`   ⚠️ Formato inválido`);
            allGood = false;
        }

        if (!configured && check.required) {
            allGood = false;
        }
    });

    console.log('\n' + '='.repeat(60));

    if (allGood) {
        console.log('🎉 CONFIGURAÇÃO COMPLETA!');
        console.log('');
        console.log('📋 COMANDOS PARA TESTAR:');
        console.log('1. npm start');
        console.log('2. Abrir: http://localhost:8080/payment.html');
        console.log('3. Usar cartão: 4242 4242 4242 4242');
    } else {
        console.log('⚠️ CONFIGURAÇÃO INCOMPLETA');
        console.log('');
        console.log('📋 O QUE FAZER:');
        console.log('1. Edite o arquivo .env');
        console.log('2. Configure as variáveis marcadas com ❌');
        console.log('3. Execute novamente: node setup-dev-environment.js');
    }

} catch (error) {
    console.error('❌ Erro ao testar configuração:', error.message);
}

console.log('\n🏁 Configuração concluída!'); 