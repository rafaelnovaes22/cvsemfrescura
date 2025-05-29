// Script para verificar status de código de sorteio
// Usage: node check-sorteio-status.js CODIGO

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');
const User = require('./models/user');

async function checkSorteioStatus(codigo) {
    try {
        if (!codigo) {
            console.log('❌ Uso: node check-sorteio-status.js CODIGO');
            process.exit(1);
        }

        // Sincronizar banco de dados
        await sequelize.sync();

        console.log('🔍 Verificando status do código:', codigo);
        console.log('='.repeat(50));

        // Buscar o código
        const giftCode = await GiftCode.findOne({
            where: { code: codigo },
            include: [
                {
                    model: GiftCodeUsage,
                    as: 'usages',
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'email', 'createdAt']
                        }
                    ]
                }
            ]
        });

        if (!giftCode) {
            console.log('❌ CÓDIGO NÃO ENCONTRADO:', codigo);
            console.log('   Verifique se o código foi criado corretamente no sistema.');
            process.exit(1);
        }

        console.log('📋 INFORMAÇÕES DO CÓDIGO:');
        console.log(`   Código: ${giftCode.code}`);
        console.log(`   Descrição: ${giftCode.description || 'Sem descrição'}`);
        console.log(`   Status: ${giftCode.isActive ? '🟢 Ativo' : '🔴 Inativo'}`);
        console.log(`   Usos realizados: ${giftCode.usedCount}`);
        console.log(`   Máximo de usos: ${giftCode.maxUses}`);
        console.log(`   Expira em: ${giftCode.expiresAt || '♾️ Nunca'}`);
        console.log(`   Criado em: ${giftCode.createdAt}`);
        console.log('');

        // Status do sorteio
        const isAvailable = giftCode.isActive &&
            giftCode.usedCount < giftCode.maxUses &&
            (!giftCode.expiresAt || new Date() <= giftCode.expiresAt);

        console.log('🎲 STATUS DO SORTEIO:');
        if (isAvailable) {
            console.log('   🎁 DISPONÍVEL - Código ainda pode ser usado!');
            console.log(`   ⏳ Restam ${giftCode.maxUses - giftCode.usedCount} uso(s)`);
        } else {
            if (giftCode.usedCount >= giftCode.maxUses) {
                console.log('   ✅ SORTEIO FINALIZADO - Código foi usado!');
            } else if (!giftCode.isActive) {
                console.log('   ⏸️ INATIVO - Código foi desativado');
            } else if (giftCode.expiresAt && new Date() > giftCode.expiresAt) {
                console.log('   ⏰ EXPIRADO - Código passou da validade');
            }
        }
        console.log('');

        // Histórico de uso
        if (giftCode.usages && giftCode.usages.length > 0) {
            console.log('🏆 GANHADOR(ES) DO SORTEIO:');
            giftCode.usages.forEach((usage, index) => {
                console.log(`   ${index + 1}. ${usage.User.name} (${usage.User.email})`);
                console.log(`      📅 Usado em: ${usage.usedAt}`);
                console.log(`      👤 Cadastrado em: ${usage.User.createdAt}`);
                console.log('');
            });
        } else {
            console.log('📝 HISTÓRICO:');
            console.log('   Nenhum uso registrado ainda.');
            console.log('');
        }

        // URLs para compartilhamento
        console.log('🔗 LINKS PARA COMPARTILHAMENTO:');
        console.log(`   Produção: https://cvsemfrescura.com.br/analisar?giftCode=${codigo}`);
        console.log(`   Local: http://localhost:3000/analisar?giftCode=${codigo}`);
        console.log('');

        // Estatísticas
        const totalCodes = await GiftCode.count();
        const totalUsages = await GiftCodeUsage.count();

        console.log('📊 ESTATÍSTICAS GERAIS:');
        console.log(`   Total de códigos criados: ${totalCodes}`);
        console.log(`   Total de usos registrados: ${totalUsages}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao verificar código:', error);
        process.exit(1);
    }
}

// Pegar código dos argumentos da linha de comando
const codigo = process.argv[2];
checkSorteioStatus(codigo); 