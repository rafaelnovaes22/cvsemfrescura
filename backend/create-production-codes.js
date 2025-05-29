const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

const PRODUCTION_CODES = [
    'GIFTDL6608',
    'GIFTIT6ISO',
    'GIFT8Y20CT',
    'GIFT28TTW1',
    'GIFTSVWDFO',
    'GIFTFW98FA',
    'GIFTBCGGLV',
    'GIFTL026ZO',
    'GIFT02NTXG',
    'GIFTPYSD9P',
    'GIFTJA0EH0'
];

async function createProductionCodes() {
    try {
        console.log('🚀 Criando 11 códigos de presente em produção...');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Sincronizar modelos (criar tabelas se não existirem)
        await sequelize.sync();
        console.log('✅ Tabelas sincronizadas');

        let created = 0;
        let existing = 0;

        for (const code of PRODUCTION_CODES) {
            try {
                // Verificar se código já existe
                const existingCode = await GiftCode.findOne({ where: { code } });

                if (existingCode) {
                    console.log(`⚠️ Código ${code} já existe`);
                    existing++;
                    continue;
                }

                // Criar novo código
                await GiftCode.create({
                    code: code,
                    maxUses: 1,
                    usedCount: 0,
                    isActive: true,
                    expiresAt: null, // Sem expiração
                    createdById: 1 // Admin
                });

                console.log(`✅ Código ${code} criado com sucesso`);
                created++;

            } catch (error) {
                console.error(`❌ Erro ao criar código ${code}:`, error.message);
            }
        }

        console.log(`\n🎉 RESUMO:`);
        console.log(`✅ Códigos criados: ${created}`);
        console.log(`⚠️ Códigos já existentes: ${existing}`);
        console.log(`📊 Total de códigos ativos: ${created + existing}`);

        // Verificar total final
        const totalCodes = await GiftCode.count({ where: { isActive: true } });
        console.log(`🔍 Verificação final: ${totalCodes} códigos ativos no banco`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro geral:', error);
        process.exit(1);
    }
}

createProductionCodes(); 