const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function createTestGiftCode() {
    try {
        // Sincronizar banco de dados
        await sequelize.sync();

        // Criar código de teste
        const giftCode = await GiftCode.create({
            code: 'TESTE123',
            maxUses: 10,
            expiresAt: null, // Não expira
            isActive: true,
            usedCount: 0
        });

        console.log('✅ Código de presente criado com sucesso!');
        console.log('📋 Código:', giftCode.code);
        console.log('🔢 Máximo de usos:', giftCode.maxUses);
        console.log('📅 Expira em:', giftCode.expiresAt || 'Nunca');

        // Criar mais alguns códigos para teste
        const codes = ['RHSUPER2025', 'GRATIS123', 'WELCOME'];

        for (const code of codes) {
            try {
                await GiftCode.create({
                    code: code,
                    maxUses: 5,
                    expiresAt: null,
                    isActive: true,
                    usedCount: 0
                });
                console.log(`✅ Código ${code} criado!`);
            } catch (error) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    console.log(`⚠️ Código ${code} já existe`);
                } else {
                    console.error(`❌ Erro ao criar código ${code}:`, error.message);
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar código de presente:', error);
        process.exit(1);
    }
}

createTestGiftCode(); 