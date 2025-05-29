// Script para verificar códigos de produção
// node check-production-gift-codes.js

const sequelize = require('./db');
const { User, GiftCode, GiftCodeUsage } = require('./models');

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

async function checkProductionGiftCodes() {
    try {
        console.log('🔍 Verificando códigos de produção...\n');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Sincronizar modelos
        await sequelize.sync();
        console.log('✅ Modelos sincronizados\n');

        // Verificar cada código de produção
        console.log('📋 Status dos códigos de produção:');
        console.log('='.repeat(60));

        let totalAtivos = 0;
        let totalDisponíveis = 0;
        let totalUsados = 0;

        for (const code of PRODUCTION_CODES) {
            const giftCode = await GiftCode.findOne({
                where: { code },
                include: [
                    {
                        model: GiftCodeUsage,
                        as: 'usages',
                        include: [{
                            model: User,
                            as: 'User',
                            attributes: ['email']
                        }]
                    }
                ]
            });

            if (!giftCode) {
                console.log(`❌ ${code} - NÃO EXISTE NO BANCO`);
                continue;
            }

            const isActive = giftCode.isActive;
            const usosRestantes = giftCode.maxUses - giftCode.usedCount;
            const isDisponivel = isActive && usosRestantes > 0;

            let status = '🔴 INATIVO';
            if (isActive && usosRestantes > 0) {
                status = '🟢 DISPONÍVEL';
                totalDisponíveis++;
            } else if (isActive && usosRestantes === 0) {
                status = '🟡 ESGOTADO';
                totalUsados++;
            }

            totalAtivos += isActive ? 1 : 0;

            console.log(`${status} ${code} - Usado: ${giftCode.usedCount}/${giftCode.maxUses}`);

            // Mostrar quem usou (se usado)
            if (giftCode.usages && giftCode.usages.length > 0) {
                giftCode.usages.forEach(usage => {
                    console.log(`    👤 ${usage.User.email} em ${usage.usedAt}`);
                });
            }
        }

        console.log('\n📊 RESUMO:');
        console.log(`   Total de códigos: ${PRODUCTION_CODES.length}`);
        console.log(`   Códigos ativos: ${totalAtivos}`);
        console.log(`   Códigos disponíveis: ${totalDisponíveis}`);
        console.log(`   Códigos usados/esgotados: ${totalUsados}`);
        console.log(`   Códigos não criados: ${PRODUCTION_CODES.length - totalAtivos}\n`);

        // Verificar se há códigos que precisam ser criados
        const codigosNaoCriados = [];
        for (const code of PRODUCTION_CODES) {
            const exists = await GiftCode.findOne({ where: { code } });
            if (!exists) {
                codigosNaoCriados.push(code);
            }
        }

        if (codigosNaoCriados.length > 0) {
            console.log('⚠️ CÓDIGOS QUE PRECISAM SER CRIADOS:');
            codigosNaoCriados.forEach(code => {
                console.log(`   - ${code}`);
            });
            console.log('\n💡 Para criar: node create-production-codes.js\n');
        }

        // Verificar estrutura das tabelas
        console.log('🔧 Verificando estrutura das tabelas...');

        try {
            // Testar se o campo credits existe na tabela users
            const testUser = await User.findOne();
            if (testUser) {
                console.log(`✅ Campo credits existe. Exemplo: ${testUser.email} tem ${testUser.credits} créditos`);
            } else {
                console.log('⚠️ Nenhum usuário encontrado para testar campo credits');
            }
        } catch (error) {
            console.log('❌ Erro ao verificar campo credits:', error.message);
        }

        // Verificar últimos usos
        console.log('\n📜 Últimos 5 usos de códigos:');
        const recentUsages = await GiftCodeUsage.findAll({
            limit: 5,
            order: [['usedAt', 'DESC']],
            include: [
                { model: User, as: 'User', attributes: ['email'] },
                { model: GiftCode, as: 'GiftCode', attributes: ['code'] }
            ]
        });

        if (recentUsages.length === 0) {
            console.log('   Nenhum uso registrado ainda');
        } else {
            recentUsages.forEach(usage => {
                console.log(`   ${usage.GiftCode.code} por ${usage.User.email} em ${usage.usedAt}`);
            });
        }

        console.log('\n✅ Verificação concluída!');

        // Sugestões baseadas no estado atual
        if (totalDisponíveis === 0) {
            console.log('\n⚠️ ATENÇÃO: Nenhum código disponível para uso!');
            console.log('   Considere criar mais códigos ou reativar códigos existentes.');
        } else {
            console.log(`\n🎁 ${totalDisponíveis} código${totalDisponíveis > 1 ? 's' : ''} disponível${totalDisponíveis > 1 ? 'eis' : ''} para uso.`);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

checkProductionGiftCodes(); 