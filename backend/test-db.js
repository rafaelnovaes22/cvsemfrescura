const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function testDB() {
    try {
        console.log('🔍 Testando conexão com banco...');
        console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✅' : 'Não configurada ❌');

        // Testar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida!');

        // Sincronizar tabelas
        await sequelize.sync();
        console.log('✅ Tabelas sincronizadas!');

        // Verificar códigos existentes
        const codes = await GiftCode.findAll();
        console.log(`📊 Códigos encontrados: ${codes.length}`);

        codes.forEach(code => {
            console.log(`  - ${code.code} (${code.usedCount}/${code.maxUses} usos)`);
        });

        // Se não há códigos, criar alguns
        if (codes.length === 0) {
            console.log('🔨 Criando códigos de teste...');

            const testCodes = [
                { code: 'TESTE123', maxUses: 10 },
                { code: 'RHSUPER2025', maxUses: 5 },
                { code: 'GRATIS123', maxUses: 5 },
                { code: 'WELCOME', maxUses: 5 }
            ];

            for (const testCode of testCodes) {
                const newCode = await GiftCode.create({
                    code: testCode.code,
                    maxUses: testCode.maxUses,
                    expiresAt: null,
                    isActive: true,
                    usedCount: 0
                });
                console.log(`✅ Criado: ${newCode.code}`);
            }
        }

        console.log('🎉 Teste concluído com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('Detalhes:', error);
        process.exit(1);
    }
}

testDB(); 