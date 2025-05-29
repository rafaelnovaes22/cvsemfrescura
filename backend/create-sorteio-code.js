const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function createSorteioCode() {
    try {
        // Sincronizar banco de dados
        await sequelize.sync();

        // Gerar código único para sorteio
        const sorteioCode = 'SORTEIO' + Math.random().toString(36).substring(2, 8).toUpperCase();

        console.log('🎁 Criando código de presente para sorteio...');
        console.log('📋 Código gerado:', sorteioCode);

        // Verificar se código já existe (improvável, mas validação extra)
        const existingCode = await GiftCode.findOne({ where: { code: sorteioCode } });
        if (existingCode) {
            console.log('⚠️ Código já existe, gerando outro...');
            return createSorteioCode(); // Tentar novamente
        }

        // Criar código de presente único para sorteio
        const giftCode = await GiftCode.create({
            code: sorteioCode,
            description: 'Código de sorteio - uso único',
            maxUses: 1, // APENAS 1 USO
            expiresAt: null, // Não expira (mas só 1 pessoa pode usar)
            isActive: true,
            usedCount: 0,
            createdById: null // Criado pelo sistema
        });

        console.log('✅ Código de sorteio criado com sucesso!');
        console.log('');
        console.log('📋 DETALHES DO CÓDIGO:');
        console.log(`   Código: ${giftCode.code}`);
        console.log(`   Usos permitidos: ${giftCode.maxUses}`);
        console.log(`   Status: ${giftCode.isActive ? 'Ativo' : 'Inativo'}`);
        console.log(`   Expira: ${giftCode.expiresAt || 'Nunca'}`);
        console.log('');
        console.log('🎯 COMO USAR:');
        console.log(`   URL: https://cvsemfrescura.com.br/analisar?giftCode=${giftCode.code}`);
        console.log(`   Ou manual: Digite "${giftCode.code}" na página de análise`);
        console.log('');
        console.log('⚠️ IMPORTANTE:');
        console.log('   - Este código pode ser usado APENAS 1 vez');
        console.log('   - Primeira pessoa que usar ganha 1 análise gratuita');
        console.log('   - Após o uso, código fica indisponível');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar código de sorteio:', error);
        process.exit(1);
    }
}

createSorteioCode(); 