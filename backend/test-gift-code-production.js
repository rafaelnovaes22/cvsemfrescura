const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const User = require('./models/user');
const GiftCodeUsage = require('./models/giftCodeUsage');

// Simular ambiente de desenvolvimento para usar SQLite
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'sqlite://dev.sqlite';

async function testGiftCodeFlow() {
    try {
        console.log('🧪 TESTE COMPLETO DO FLUXO DE CÓDIGOS DE PRESENTE');
        console.log('═══════════════════════════════════════════════════');

        // Sincronizar banco
        await sequelize.sync();
        console.log('✅ Banco sincronizado');

        // 1. Verificar códigos existentes
        const codes = await GiftCode.findAll();
        console.log(`📊 Códigos existentes: ${codes.length}`);

        // 2. Criar usuário de teste se não existir
        const [testUser, created] = await User.findOrCreate({
            where: { email: 'teste@gift.com' },
            defaults: {
                name: 'Usuario Teste',
                email: 'teste@gift.com',
                password: 'senha123',
                credits: 0
            }
        });
        console.log(`👤 Usuário teste: ${created ? 'criado' : 'encontrado'} (ID: ${testUser.id})`);

        // 3. Testar validação de código
        if (codes.length > 0) {
            const testCode = codes[0];
            console.log(`\n🔍 TESTANDO VALIDAÇÃO DO CÓDIGO: ${testCode.code}`);

            // Simular requisição de validação
            const validatePayload = { code: testCode.code };
            console.log('📤 Payload de validação:', validatePayload);

            // Verificar se o código é válido usando o controller
            const giftCodeController = require('./controllers/giftCodeController');

            // Mock de request/response para teste
            const mockReq = { body: validatePayload };
            const mockRes = {
                status: (code) => ({
                    json: (data) => {
                        console.log(`📥 Resposta de validação (${code}):`, data);
                        return data;
                    }
                }),
                json: (data) => {
                    console.log('📥 Resposta de validação (200):', data);
                    return data;
                }
            };

            await giftCodeController.validateCode(mockReq, mockRes);

            console.log(`\n🎁 TESTANDO APLICAÇÃO DO CÓDIGO: ${testCode.code}`);

            // Verificar se o usuário já usou este código
            const existingUsage = await GiftCodeUsage.findOne({
                where: {
                    giftCodeId: testCode.id,
                    userId: testUser.id
                }
            });

            if (existingUsage) {
                console.log('⚠️ Usuário já usou este código, removendo uso para teste...');
                await existingUsage.destroy();
                await testCode.update({ usedCount: Math.max(0, testCode.usedCount - 1) });
            }

            // Simular requisição de aplicação
            const applyPayload = { code: testCode.code };
            const mockApplyReq = {
                body: applyPayload,
                user: { id: testUser.id }
            };
            const mockApplyRes = {
                status: (code) => ({
                    json: (data) => {
                        console.log(`📥 Resposta de aplicação (${code}):`, data);
                        return data;
                    }
                })
            };

            await giftCodeController.applyCode(mockApplyReq, mockApplyRes);

            // Verificar créditos do usuário após aplicação
            await testUser.reload();
            console.log(`💰 Créditos do usuário após aplicação: ${testUser.credits}`);

            // Verificar uso do código
            const usage = await GiftCodeUsage.findOne({
                where: {
                    giftCodeId: testCode.id,
                    userId: testUser.id
                }
            });
            console.log(`📝 Uso registrado: ${usage ? 'SIM' : 'NÃO'}`);

            // Verificar contador do código
            await testCode.reload();
            console.log(`📊 Contador de uso do código: ${testCode.usedCount}/${testCode.maxUses}`);

        } else {
            console.log('❌ Nenhum código disponível para teste');
            console.log('💡 Execute: node create-test-gift-code.js primeiro');
        }

        console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        process.exit(1);
    }
}

testGiftCodeFlow(); 