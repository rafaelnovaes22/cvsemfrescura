const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO DE PROBLEMAS DE CÓDIGOS DE PRESENTE NO FRONTEND');
console.log('═══════════════════════════════════════════════════════════');

// 1. Verificar se há problemas de sintaxe no arquivo analisar.html
const analisarPath = path.join(__dirname, '../frontend/analisar.html');

if (!fs.existsSync(analisarPath)) {
    console.error('❌ Arquivo analisar.html não encontrado!');
    process.exit(1);
}

const content = fs.readFileSync(analisarPath, 'utf8');

console.log('\n1️⃣ VERIFICANDO PROBLEMAS CONHECIDOS...');

// Problema 1: Verificar se há .then() sem fechamento adequado
const problemPatterns = [
    {
        name: 'Promise .then() sem fechamento',
        pattern: /\.then\([^}]*}\s*\)\s*\.catch/g,
        description: 'Verifica se há promises com fechamento inadequado'
    },
    {
        name: 'Função applyGiftCodeAfterAuth',
        pattern: /function applyGiftCodeAfterAuth\(code\)/g,
        description: 'Verifica se a função existe'
    },
    {
        name: 'Endpoint /api/gift-code/apply',
        pattern: /\/api\/gift-code\/apply/g,
        description: 'Verifica se o endpoint está sendo chamado'
    },
    {
        name: 'authSuccess() sendo chamada',
        pattern: /window\.authSuccess\(\)/g,
        description: 'Verifica se authSuccess está sendo chamada após login'
    },
    {
        name: 'Error handling em promises',
        pattern: /\.catch\(error\s*=>/g,
        description: 'Verifica se há tratamento de erro adequado'
    }
];

let foundIssues = false;

problemPatterns.forEach(({ name, pattern, description }) => {
    const matches = content.match(pattern);
    const count = matches ? matches.length : 0;

    console.log(`\n📋 ${name}:`);
    console.log(`   ${description}`);
    console.log(`   Ocorrências encontradas: ${count}`);

    if (count === 0 && (name.includes('applyGiftCodeAfterAuth') || name.includes('authSuccess'))) {
        console.log(`   ⚠️ PROBLEMA: ${name} não encontrada!`);
        foundIssues = true;
    }
});

// Problema 2: Verificar se há JavaScript com syntax errors comuns
console.log('\n2️⃣ VERIFICANDO SYNTAX ERRORS COMUNS...');

const syntaxChecks = [
    {
        name: 'Parênteses desbalanceados',
        test: () => {
            const opens = (content.match(/\(/g) || []).length;
            const closes = (content.match(/\)/g) || []).length;
            return opens === closes;
        }
    },
    {
        name: 'Chaves desbalanceadas',
        test: () => {
            const opens = (content.match(/\{/g) || []).length;
            const closes = (content.match(/\}/g) || []).length;
            return opens === closes;
        }
    },
    {
        name: 'Aspas não fechadas (single quotes)',
        test: () => {
            const matches = content.match(/'/g) || [];
            return matches.length % 2 === 0;
        }
    }
];

syntaxChecks.forEach(({ name, test }) => {
    const isValid = test();
    console.log(`📝 ${name}: ${isValid ? '✅ OK' : '❌ PROBLEMA'}`);
    if (!isValid) foundIssues = true;
});

// Problema 3: Verificar se há logs específicos de produção
console.log('\n3️⃣ VERIFICANDO LOGS DE PRODUÇÃO...');

const productionChecks = [
    'console.log.*gift',
    'console.error.*gift',
    'auth\\.loginUser',
    'applyGiftCodeAfterAuth'
];

productionChecks.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    console.log(`🔍 ${pattern}: ${count} ocorrências`);
});

// 4. Criar backup e sugerir correções
console.log('\n4️⃣ CRIANDO BACKUP E SUGERINDO CORREÇÕES...');

const backupPath = analisarPath + '.backup.' + Date.now();
fs.copyFileSync(analisarPath, backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

console.log('\n💡 DIAGNÓSTICO ESPECÍFICO PARA PRODUÇÃO:');
console.log('');
console.log('🚨 PROBLEMAS MAIS COMUNS EM PRODUÇÃO:');
console.log('');
console.log('1. 🔗 URLs da API:');
console.log('   - Verificar se as URLs são relativas (/api/gift-code/apply)');
console.log('   - Não usar localhost em produção');
console.log('');
console.log('2. 🔐 Headers de autenticação:');
console.log('   - Bearer token deve estar correto');
console.log('   - Verificar se auth.getToken() retorna valor válido');
console.log('');
console.log('3. ⏱️ Timing issues:');
console.log('   - authSuccess() deve ser chamada APÓS aplicação do código');
console.log('   - Verificar se promises estão sendo awaited corretamente');
console.log('');
console.log('4. 🏁 CORS e Network:');
console.log('   - Verificar se servidor aceita requisições do domínio');
console.log('   - Headers CORS configurados corretamente');

if (foundIssues) {
    console.log('\n❌ PROBLEMAS IDENTIFICADOS! Revise o código acima.');
} else {
    console.log('\n✅ Nenhum problema óbvio identificado no frontend.');
    console.log('   O problema pode estar no backend ou na configuração.');
}

console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Execute: node backend/debug-gift-code-production.js');
console.log('2. Verifique logs do browser (F12 -> Console)');
console.log('3. Teste manualmente: curl -X POST https://seudominio.com/api/gift-code/validate');
console.log('4. Verifique se o servidor está retornando 200 para as APIs');

process.exit(foundIssues ? 1 : 0); 