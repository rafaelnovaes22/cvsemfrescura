// Script para testar manualmente o sistema de gift codes
// node test-gift-code-manual.js

const sequelize = require('./db');
const { User, GiftCode, GiftCodeUsage } = require('./models');

async function testGiftCodeManual() {
    try {
        console.log('🧪 Teste manual do sistema de Gift Codes\n');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Sincronizar modelos
        await sequelize.sync();
        console.log('✅ Modelos sincronizados\n');

        // 1. Criar um código de teste se não existir
        const testCode = 'TEST-MANUAL-123';
        let giftCode = await GiftCode.findOne({ where: { code: testCode } });

        if (!giftCode) {
            console.log('📝 Criando código de teste...');
            giftCode = await GiftCode.create({
                code: testCode,
                maxUses: 5,
                usedCount: 0,
                isActive: true,
                expiresAt: null
            });
            console.log('✅ Código criado:', testCode);
        } else {
            console.log('✅ Código já existe:', testCode);
        }

        // 2. Buscar ou criar um usuário de teste
        let testUser = await User.findOne({ where: { email: 'test@example.com' } });

        if (!testUser) {
            console.log('👤 Criando usuário de teste...');
            testUser = await User.create({
                name: 'Usuário Teste',
                email: 'test@example.com',
                password: 'hashedpassword123',
                credits: 0
            });
            console.log('✅ Usuário criado');
        } else {
            console.log('✅ Usuário já existe');
        }

        console.log('\n📊 Estado inicial:');
        console.log(`   Usuário: ${testUser.email} - Créditos: ${testUser.credits}`);
        console.log(`   Código: ${giftCode.code} - Usado: ${giftCode.usedCount}/${giftCode.maxUses}\n`);

        // 3. Verificar se o usuário já usou este código
        const existingUsage = await GiftCodeUsage.findOne({
            where: {
                giftCodeId: giftCode.id,
                userId: testUser.id
            }
        });

        if (existingUsage) {
            console.log('⚠️ Usuário já usou este código. Limpando para teste...');
            await existingUsage.destroy();
            // Decrementar contador se necessário
            if (giftCode.usedCount > 0) {
                await giftCode.update({ usedCount: giftCode.usedCount - 1 });
            }
        }

        // 4. TESTAR APLICAÇÃO DO CÓDIGO
        console.log('🎁 Aplicando código de presente...');

        const transaction = await sequelize.transaction();

        try {
            // Registrar uso
            const usage = await GiftCodeUsage.create({
                giftCodeId: giftCode.id,
                userId: testUser.id
            }, { transaction });

            console.log('✅ Uso registrado com ID:', usage.id);

            // Incrementar contador do código
            await giftCode.update(
                { usedCount: giftCode.usedCount + 1 },
                { transaction }
            );

            console.log('✅ Contador do código incrementado');

            // Incrementar créditos do usuário
            const newCredits = testUser.credits + 1;
            await testUser.update(
                { credits: newCredits },
                { transaction }
            );

            console.log('✅ Créditos do usuário incrementados');

            // Confirmar transação
            await transaction.commit();
            console.log('✅ Transação confirmada\n');

            // Verificar resultado final
            await testUser.reload();
            await giftCode.reload();

            console.log('🎉 RESULTADO FINAL:');
            console.log(`   Usuário: ${testUser.email} - Créditos: ${testUser.credits}`);
            console.log(`   Código: ${giftCode.code} - Usado: ${giftCode.usedCount}/${giftCode.maxUses}`);
            console.log(`   ✅ Teste bem-sucedido!\n`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Erro na transação:', error);
            throw error;
        }

        // 5. Verificar histórico de uso
        const allUsages = await GiftCodeUsage.findAll({
            where: { giftCodeId: giftCode.id },
            include: [{
                model: User,
                as: 'User',
                attributes: ['email', 'credits']
            }]
        });

        console.log('📜 Histórico de uso do código:');
        allUsages.forEach((usage, index) => {
            console.log(`   ${index + 1}. ${usage.User.email} - Usado em: ${usage.usedAt}`);
        });

        console.log('\n✅ Teste concluído com sucesso!');
        console.log('💡 Se este teste funciona mas o frontend não, o problema é:');
        console.log('   1. Autenticação/token inválido');
        console.log('   2. Middleware não passando user.id');
        console.log('   3. Código não sendo enviado corretamente');
        console.log('   4. Resposta não chegando ao frontend\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testGiftCodeManual(); 