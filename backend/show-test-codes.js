// Script para mostrar códigos de presente disponíveis para teste
// Baseado nos códigos definidos nos arquivos de teste

console.log('🎁 CÓDIGOS DE PRESENTE PARA TESTE');
console.log('════════════════════════════════════════════════');

const testCodes = [
    {
        code: 'TESTE123',
        maxUses: 10,
        description: 'Código principal de teste',
        status: 'ATIVO'
    },
    {
        code: 'RHSUPER2025',
        maxUses: 5,
        description: 'Código de presente RH Super Sincero',
        status: 'ATIVO'
    },
    {
        code: 'GRATIS123',
        maxUses: 5,
        description: 'Código promocional gratuito',
        status: 'ATIVO'
    },
    {
        code: 'WELCOME',
        maxUses: 5,
        description: 'Código de boas-vindas',
        status: 'ATIVO'
    }
];

testCodes.forEach((code, index) => {
    console.log(`\n📌 ${index + 1}. Código: ${code.code}`);
    console.log(`   Status: ✅ ${code.status}`);
    console.log(`   Máximo de usos: ${code.maxUses}`);
    console.log(`   Descrição: ${code.description}`);
});

console.log('\n🔗 LINKS DIRETOS PARA TESTE:');
console.log('═══════════════════════════════════════');
testCodes.forEach(code => {
    console.log(`🌐 http://localhost:3000/app.html?giftCode=${code.code}`);
});

console.log('\n📋 COMO TESTAR:');
console.log('═══════════════');
console.log('1️⃣ Acesse qualquer link acima');
console.log('2️⃣ Faça cadastro/login quando solicitado');
console.log('3️⃣ O código será aplicado automaticamente');
console.log('4️⃣ Você receberá 1 crédito para análise');

console.log('\n🎯 TESTE NA LANDING PAGE:');
console.log('═════════════════════════════');
console.log('🌐 http://localhost:3000/landing.html');
console.log('👆 Clique em "🎓 Código de Presente"');
console.log('📝 Digite qualquer código acima');
console.log('🚀 Será redirecionado para análise');

console.log('\n✅ SISTEMA PRONTO PARA TESTE!'); 