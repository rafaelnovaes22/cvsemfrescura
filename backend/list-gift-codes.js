const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function listGiftCodes() {
    try {
        await sequelize.sync();
        const codes = await GiftCode.findAll({
            attributes: ['code', 'maxUses', 'usedCount', 'isActive', 'expiresAt'],
            order: [['code', 'ASC']]
        });

        console.log('🎁 CÓDIGOS DE PRESENTE DISPONÍVEIS:');
        console.log('═══════════════════════════════════════');

        if (codes.length === 0) {
            console.log('❌ Nenhum código encontrado no banco de dados');
            console.log('💡 Execute: node backend/create-test-gift-code.js para criar códigos de teste');
        } else {
            codes.forEach(code => {
                const remainingUses = code.maxUses - code.usedCount;
                const status = code.isActive ? '✅ ATIVO' : '❌ INATIVO';
                const expires = code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Nunca';

                console.log('');
                console.log(`📌 Código: ${code.code}`);
                console.log(`   Status: ${status}`);
                console.log(`   Usos restantes: ${remainingUses}/${code.maxUses}`);
                console.log(`   Expira em: ${expires}`);
            });
        }

        console.log('\n🔗 LINKS DE TESTE:');
        console.log('═══════════════════');
        codes.forEach(code => {
            if (code.isActive && (code.maxUses - code.usedCount) > 0) {
                console.log(`🌐 http://localhost:3000/app.html?giftCode=${code.code}`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao listar códigos:', error);
        console.error('💡 Certifique-se de que o servidor está rodando e o banco foi criado');
        process.exit(1);
    }
}

listGiftCodes(); 