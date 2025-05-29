const sequelize = require('./db');
const { User, GiftCode, GiftCodeUsage } = require('./models');

async function testGiftCodeSystem() {
    try {
        console.log('🧪 Testando sistema de Gift Codes...\n');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // Sincronizar modelos
        await sequelize.sync();

        // 1. VERIFICAR SE EXISTEM CÓDIGOS ATIVOS
        console.log('📋 1. Verificando códigos ativos no banco...');
        const activeCodes = await GiftCode.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });

        if (activeCodes.length === 0) {
            console.log('❌ PROBLEMA: Nenhum código de presente ativo encontrado!');
            console.log('   Solução: Execute node create-production-codes.js\n');
        } else {
            console.log(`✅ Encontrados ${activeCodes.length} códigos ativos:`);
            activeCodes.forEach(code => {
                console.log(`   - ${code.code} (usado ${code.usedCount}/${code.maxUses})`);
            });
            console.log('');
        }

        // 2. VERIFICAR ESTRUTURA DA TABELA USERS
        console.log('👤 2. Verificando estrutura da tabela users...');
        try {
            const [results] = await sequelize.query(`
                SELECT column_name, data_type, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'credits'
            `);

            if (results.length === 0) {
                console.log('❌ PROBLEMA: Campo "credits" não existe na tabela users!');
                console.log('   Solução: Execute uma migração para adicionar o campo credits\n');
            } else {
                console.log('✅ Campo "credits" existe na tabela users');
                console.log(`   Tipo: ${results[0].data_type}, Padrão: ${results[0].column_default}\n`);
            }
        } catch (error) {
            console.log('⚠️ Não foi possível verificar estrutura (PostgreSQL não conectado)\n');
        }

        // 3. VERIFICAR SE EXISTEM USUÁRIOS DE TESTE
        console.log('👥 3. Verificando usuários existentes...');
        const userCount = await User.count();
        console.log(`✅ Encontrados ${userCount} usuários no banco\n`);

        // 4. TESTE DE APLICAÇÃO DE CÓDIGO (SIMULADO)
        console.log('🎁 4. Testando lógica de aplicação de código...');

        if (activeCodes.length > 0) {
            const testCode = activeCodes[0];
            console.log(`   Testando com código: ${testCode.code}`);

            // Verificar se código está válido
            const isValid = testCode.isActive &&
                testCode.usedCount < testCode.maxUses &&
                (!testCode.expiresAt || new Date() <= testCode.expiresAt);

            if (isValid) {
                console.log('✅ Código está válido para uso');
                console.log(`   Usos restantes: ${testCode.maxUses - testCode.usedCount}`);
            } else {
                console.log('❌ Código não está válido:');
                if (!testCode.isActive) console.log('   - Código inativo');
                if (testCode.usedCount >= testCode.maxUses) console.log('   - Código esgotado');
                if (testCode.expiresAt && new Date() > testCode.expiresAt) console.log('   - Código expirado');
            }
        }

        console.log('');

        // 5. VERIFICAR ASSOCIAÇÕES ENTRE TABELAS
        console.log('🔗 5. Verificando associações entre tabelas...');
        try {
            const usageCount = await GiftCodeUsage.count();
            console.log(`✅ Tabela gift_code_usages existe com ${usageCount} registros\n`);
        } catch (error) {
            console.log('❌ PROBLEMA: Tabela gift_code_usages não existe ou tem problema');
            console.log(`   Erro: ${error.message}\n`);
        }

        // 6. TESTE DE ENDPOINTS (SUGESTÃO)
        console.log('🌐 6. Para testar endpoints completos:');
        console.log('   curl -X POST http://localhost:3001/api/gift-code/validate \\');
        console.log('        -H "Content-Type: application/json" \\');
        console.log(`        -d \'{"code":"${activeCodes[0]?.code || 'TESTE123'}"}\'\n`);

        // 7. PROBLEMAS COMUNS E SOLUÇÕES
        console.log('🛠️ 7. Checklist de problemas comuns:');
        console.log('   ✅ Códigos existem no banco: ' + (activeCodes.length > 0 ? 'SIM' : 'NÃO'));
        console.log('   ✅ Rotas registradas no server.js: Verificar /api/gift-code');
        console.log('   ✅ Middleware de auth funcionando: Testar endpoints');
        console.log('   ✅ Frontend enviando token: Verificar console do navegador');
        console.log('   ✅ Campo credits na tabela users: Verificar schema');
        console.log('   ✅ Transações do banco funcionando: Testar manualmente\n');

        console.log('✅ Teste concluído! Verifique os itens marcados como ❌ acima.\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
        process.exit(1);
    }
}

testGiftCodeSystem(); 