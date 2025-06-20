const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function testValidation() {
    try {
        console.log('🔍 Testando validação de códigos...');

        // Conectar ao banco
        await sequelize.authenticate();
        await sequelize.sync();

        // Buscar o código TESTE123
        const code = 'TESTE123';
        const giftCode = await GiftCode.findOne({ where: { code } });

        if (!giftCode) {
            console.log('❌ Código não encontrado:', code);
            return;
        }

        console.log('📋 Código encontrado:');
        console.log('  - Código:', giftCode.code);
        console.log('  - Ativo:', giftCode.isActive);
        console.log('  - Usado:', giftCode.usedCount);
        console.log('  - Máximo:', giftCode.maxUses);
        console.log('  - Expira em:', giftCode.expiresAt);

        // Verificações
        console.log('\n🔍 Verificações:');
        console.log('  - Código existe:', giftCode ? '✅' : '❌');
        console.log('  - Está ativo:', giftCode.isActive ? '✅' : '❌');
        console.log('  - Não esgotado:', (giftCode.usedCount < giftCode.maxUses) ? '✅' : '❌');
        console.log('  - Não expirado:', (!giftCode.expiresAt || new Date() <= giftCode.expiresAt) ? '✅' : '❌');

        // Simular validação
        const isValid = giftCode &&
            giftCode.isActive &&
            giftCode.usedCount < giftCode.maxUses &&
            (!giftCode.expiresAt || new Date() <= giftCode.expiresAt);

        console.log('\n🎯 Resultado:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

testValidation(); 