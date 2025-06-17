const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const User = require('./models/user');
const GiftCodeUsage = require('./models/giftCodeUsage');

async function debugGiftCodeProduction() {
    try {
        console.log('🔍 DIAGNÓSTICO DE CÓDIGOS DE PRESENTE EM PRODUÇÃO');
        console.log('══════════════════════════════════════════════════');

        // 1. Testar conexão com banco
        console.log('\n1️⃣ TESTANDO CONEXÃO COM BANCO...');
        await sequelize.authenticate();
        console.log('✅ Conexão com banco OK');

        // 2. Verificar se as tabelas existem
        console.log('\n2️⃣ VERIFICANDO ESTRUTURA DO BANCO...');
        const [giftCodes] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='gift_codes';");
        const [users] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
        const [giftCodeUsages] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='gift_code_usages';");

        console.log(`📋 Tabela gift_codes: ${giftCodes.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log(`👤 Tabela users: ${users.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log(`📝 Tabela gift_code_usages: ${giftCodeUsages.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

        // 3. Listar códigos de presente disponíveis
        console.log('\n3️⃣ CÓDIGOS DE PRESENTE DISPONÍVEIS...');
        const codes = await GiftCode.findAll({
            attributes: ['id', 'code', 'maxUses', 'usedCount', 'isActive', 'expiresAt']
        });

        if (codes.length === 0) {
            console.log('❌ PROBLEMA: Nenhum código de presente encontrado!');
            console.log('💡 SOLUÇÃO: Execute o script de criação de códigos:');
            console.log('   node backend/create-test-gift-code.js');
            return;
        }

        codes.forEach(code => {
            const remainingUses = code.maxUses - code.usedCount;
            const status = code.isActive ? '✅ ATIVO' : '❌ INATIVO';
            const expires = code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Nunca';

            console.log(`\n📌 Código: ${code.code} (ID: ${code.id})`);
            console.log(`   Status: ${status}`);
            console.log(`   Usos: ${code.usedCount}/${code.maxUses} (restam ${remainingUses})`);
            console.log(`   Expira: ${expires}`);

            if (!code.isActive) {
                console.log('⚠️ PROBLEMA: Código inativo!');
            }
            if (remainingUses <= 0) {
                console.log('⚠️ PROBLEMA: Código esgotado!');
            }
        });

        // 4. Testar validação de um código específico
        if (codes.length > 0) {
            const testCode = codes.find(c => c.isActive && (c.maxUses - c.usedCount) > 0);

            if (testCode) {
                console.log(`\n4️⃣ TESTANDO VALIDAÇÃO DO CÓDIGO: ${testCode.code}`);

                // Importar controller
                const giftCodeController = require('./controllers/giftCodeController');

                // Mock request/response
                const mockReq = { body: { code: testCode.code } };
                let mockResponse = null;

                const mockRes = {
                    json: (data) => {
                        mockResponse = { status: 200, data };
                        console.log('✅ Validação bem-sucedida:', data);
                    },
                    status: (code) => ({
                        json: (data) => {
                            mockResponse = { status: code, data };
                            console.log(`❌ Erro na validação (${code}):`, data);
                        }
                    })
                };

                await giftCodeController.validateCode(mockReq, mockRes);

                if (mockResponse?.status === 200 && mockResponse?.data?.valid) {
                    console.log('✅ API de validação funcionando corretamente');
                } else {
                    console.log('❌ PROBLEMA: API de validação retornou erro');
                    console.log('   Resposta:', mockResponse);
                }
            } else {
                console.log('❌ PROBLEMA: Nenhum código ativo e disponível para teste!');
            }
        }

        // 5. Verificar usuários de teste
        console.log('\n5️⃣ VERIFICANDO USUÁRIOS...');
        const userCount = await User.count();
        console.log(`👥 Total de usuários: ${userCount}`);

        if (userCount === 0) {
            console.log('⚠️ AVISO: Nenhum usuário encontrado (normal em ambiente limpo)');
        }

        // 6. Verificar usos de códigos
        console.log('\n6️⃣ VERIFICANDO HISTÓRICO DE USOS...');
        const usageCount = await GiftCodeUsage.count();
        console.log(`📊 Total de usos registrados: ${usageCount}`);

        if (usageCount > 0) {
            const recentUsages = await GiftCodeUsage.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: GiftCode, attributes: ['code'] },
                    { model: User, attributes: ['email'] }
                ]
            });

            console.log('\n🕒 USOS RECENTES:');
            recentUsages.forEach(usage => {
                const date = new Date(usage.createdAt).toLocaleString();
                console.log(`   ${date} - Código: ${usage.GiftCode?.code} - Usuário: ${usage.User?.email}`);
            });
        }

        console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Se não há códigos ativos, execute: node backend/create-test-gift-code.js');
        console.log('2. Teste a aplicação frontend: http://localhost:3000/analisar.html?giftCode=TESTE123');
        console.log('3. Verifique logs do browser para erros JavaScript');

        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO NO DIAGNÓSTICO:', error);
        console.error('\n🔧 POSSÍVEIS CAUSAS:');
        console.error('1. Banco de dados não conectado');
        console.error('2. Tabelas não criadas (execute: npm run migrate)');
        console.error('3. Problema de configuração de ambiente');
        console.error('4. Servidor não está rodando');
        process.exit(1);
    }
}

debugGiftCodeProduction(); 