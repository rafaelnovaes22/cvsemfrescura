const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');
const User = require('./models/user');

// Configurar associações entre modelos
const models = {
    User,
    GiftCode,
    GiftCodeUsage
};

// Configurar as associações
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

async function testAdminEndpoints() {
    try {
        console.log('🔍 Testando endpoints administrativos...');
        console.log('═══════════════════════════════════════');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Sincronizar modelos
        await sequelize.sync();
        console.log('✅ Modelos sincronizados');

        // Testar consulta que estava com problema
        console.log('\n🔍 Testando consulta com associações...');

        const { count, rows } = await GiftCode.findAndCountAll({
            limit: 10,
            offset: 0,
            include: [
                {
                    model: GiftCodeUsage,
                    as: 'usages',
                    required: false,
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email']
                    }]
                }
            ]
        });

        console.log('✅ Consulta executada com sucesso!');
        console.log(`📊 Total de códigos: ${count}`);
        console.log(`📋 Códigos retornados: ${rows.length}`);

        // Mostrar alguns dados
        if (rows.length > 0) {
            console.log('\n📋 Primeiros códigos encontrados:');
            rows.slice(0, 3).forEach(code => {
                console.log(`  - ${code.code}: ${code.usedCount}/${code.maxUses} usos`);
                if (code.usages && code.usages.length > 0) {
                    console.log(`    Usos: ${code.usages.length}`);
                }
            });
        }

        // Testar estatísticas do dashboard
        console.log('\n🔍 Testando estatísticas do dashboard...');

        const stats = await Promise.all([
            // Total de códigos
            GiftCode.count(),

            // Códigos ativos
            GiftCode.count({ where: { isActive: true } }),

            // Total de usos hoje
            GiftCodeUsage.count({
                where: {
                    createdAt: {
                        [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);

        console.log('✅ Estatísticas calculadas com sucesso!');
        console.log(`📊 Total de códigos: ${stats[0]}`);
        console.log(`✅ Códigos ativos: ${stats[1]}`);
        console.log(`📈 Usos hoje: ${stats[2]}`);

        // Testar relatório de uso
        console.log('\n🔍 Testando relatório de uso...');

        const usages = await GiftCodeUsage.findAll({
            limit: 5,
            include: [
                {
                    model: GiftCode,
                    as: 'giftCode',
                    attributes: ['code', 'description']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log('✅ Relatório de uso executado com sucesso!');
        console.log(`📊 Total de usos encontrados: ${usages.length}`);

        if (usages.length > 0) {
            console.log('\n📋 Últimos usos:');
            usages.forEach(usage => {
                const giftCode = usage.giftCode ? usage.giftCode.code : 'N/A';
                const userEmail = usage.user ? usage.user.email : 'N/A';
                console.log(`  - ${giftCode} usado por ${userEmail}`);
            });
        }

        console.log('\n🎉 Todos os testes passaram com sucesso!');
        console.log('✅ As associações estão funcionando corretamente');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro nos testes:', error);
        console.error('Detalhes:', error.message);
        process.exit(1);
    }
}

testAdminEndpoints(); 