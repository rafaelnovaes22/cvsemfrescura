const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');
const User = require('./models/user');

async function inicializarCodigosProd() {
    try {
        console.log('🚀 INICIALIZANDO CÓDIGOS DE PRESENTE EM PRODUÇÃO...');
        console.log('═══════════════════════════════════════════════════');

        // Testar conexão
        console.log('📡 Testando conexão com banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão com banco OK');

        // Criar todas as tabelas se não existirem
        console.log('🔄 Criando estrutura do banco de dados...');
        await sequelize.sync({ force: false });
        console.log('✅ Estrutura do banco criada');

        // Verificar códigos existentes
        console.log('🔍 Verificando códigos existentes...');
        const existingCodes = await GiftCode.count();
        console.log(`📊 Códigos existentes: ${existingCodes}`);

        if (existingCodes === 0) {
            console.log('🎯 Criando códigos de presente de exemplo...');

            const codigosExemplo = [
                {
                    code: 'WELCOME2024',
                    maxUses: 10,
                    usedCount: 0,
                    isActive: true,
                    description: 'Código de boas-vindas 2024',
                    expiresAt: new Date('2024-12-31T23:59:59.000Z')
                },
                {
                    code: 'TESTE100',
                    maxUses: 100,
                    usedCount: 0,
                    isActive: true,
                    description: 'Código de teste com 100 usos',
                    expiresAt: null
                },
                {
                    code: 'PREMIUM50',
                    maxUses: 50,
                    usedCount: 5,
                    isActive: true,
                    description: 'Código premium com 50 usos',
                    expiresAt: new Date('2025-06-30T23:59:59.000Z')
                },
                {
                    code: 'DEMO10',
                    maxUses: 10,
                    usedCount: 0,
                    isActive: true,
                    description: 'Código de demonstração',
                    expiresAt: new Date('2025-12-31T23:59:59.000Z')
                },
                {
                    code: 'EXPIRED2023',
                    maxUses: 20,
                    usedCount: 15,
                    isActive: false,
                    description: 'Código expirado (exemplo)',
                    expiresAt: new Date('2023-12-31T23:59:59.000Z')
                }
            ];

            for (const codigoData of codigosExemplo) {
                const codigo = await GiftCode.create(codigoData);
                console.log(`✅ Código criado: ${codigo.code} (${codigo.maxUses} usos)`);
            }

            console.log(`🎉 ${codigosExemplo.length} códigos de exemplo criados!`);
        }

        // Listar todos os códigos
        console.log('\n🔍 LISTANDO TODOS OS CÓDIGOS DISPONÍVEIS...');
        const allCodes = await GiftCode.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: GiftCodeUsage,
                as: 'usages',
                required: false
            }]
        });

        console.log('\n🎁 CÓDIGOS DE PRESENTE EM PRODUÇÃO:');
        console.log('═══════════════════════════════════════');

        // Estatísticas
        const ativos = allCodes.filter(c => c.isActive).length;
        const disponiveis = allCodes.filter(c => c.isActive && c.usedCount < c.maxUses).length;
        const esgotados = allCodes.filter(c => c.usedCount >= c.maxUses).length;
        const expirados = allCodes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;

        console.log(`📊 ESTATÍSTICAS GERAIS:`);
        console.log(`   🟢 Total de códigos: ${allCodes.length}`);
        console.log(`   ✅ Ativos: ${ativos}`);
        console.log(`   🎯 Disponíveis: ${disponiveis}`);
        console.log(`   🔴 Esgotados: ${esgotados}`);
        console.log(`   ⏰ Expirados: ${expirados}`);
        console.log('');

        // Lista detalhada
        allCodes.forEach((code, index) => {
            const usosRestantes = code.maxUses - code.usedCount;
            const statusIcon = code.isActive ? '🟢' : '🔴';
            const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
            const isExhausted = code.usedCount >= code.maxUses;

            let status = '✅ DISPONÍVEL';
            if (isExpired) status = '⏰ EXPIRADO';
            else if (isExhausted) status = '❌ ESGOTADO';
            else if (!code.isActive) status = '🔴 INATIVO';

            const expiracao = code.expiresAt ?
                new Date(code.expiresAt).toLocaleDateString('pt-BR') :
                'Sem expiração';

            console.log(`${index + 1}. ${statusIcon} ${code.code}`);
            console.log(`   📊 Status: ${status}`);
            console.log(`   🔢 Usos: ${code.usedCount}/${code.maxUses} (restam ${usosRestantes})`);
            console.log(`   📅 Expira: ${expiracao}`);
            console.log(`   📝 Descrição: ${code.description || 'Sem descrição'}`);
            console.log('');
        });

        // Códigos prontos para uso
        const codigosDisponiveis = allCodes.filter(c =>
            c.isActive &&
            c.usedCount < c.maxUses &&
            (!c.expiresAt || new Date(c.expiresAt) > new Date())
        );

        if (codigosDisponiveis.length > 0) {
            console.log('🚀 CÓDIGOS PRONTOS PARA USO IMEDIATO:');
            console.log('═══════════════════════════════════════');
            codigosDisponiveis.forEach(code => {
                const usosRestantes = code.maxUses - code.usedCount;
                console.log(`✅ ${code.code}`);
                console.log(`   🎯 ${usosRestantes} uso(s) disponível(is)`);
                console.log(`   🔗 Link de teste: http://localhost:3000/analisar.html?giftCode=${code.code}`);
                console.log('');
            });
        } else {
            console.log('❌ NENHUM CÓDIGO DISPONÍVEL PARA USO IMEDIATO');
            console.log('💡 Considere criar novos códigos no painel administrativo');
        }

        console.log('🔧 FERRAMENTAS ADMINISTRATIVAS:');
        console.log('═══════════════════════════════════');
        console.log('🌐 Painel Admin: http://localhost:3000/admin.html');
        console.log('📊 Dashboard API: GET /api/admin/dashboard');
        console.log('📋 Códigos API: GET /api/admin/codes');
        console.log('');
        console.log('💡 PRÓXIMOS PASSOS:');
        console.log('1. Inicie o servidor: npm start');
        console.log('2. Acesse o painel: http://localhost:3000/admin.html');
        console.log('3. Faça login como administrador');
        console.log('4. Gerencie os códigos conforme necessário');

        await sequelize.close();
        console.log('\n✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!');

    } catch (error) {
        console.error('❌ ERRO NA INICIALIZAÇÃO:', error.message);
        console.error('');
        console.error('🔍 Detalhes do erro:');
        console.error(error.stack);
        console.error('');
        console.error('💡 Possíveis soluções:');
        console.error('1. Verificar se o arquivo .env existe e está configurado');
        console.error('2. Verificar se as dependências estão instaladas: npm install');
        console.error('3. Verificar permissões de escrita no diretório');

        process.exit(1);
    }
}

console.log('🎁 CV SEM FRESCURA - INICIALIZADOR DE CÓDIGOS DE PRESENTE');
console.log('Iniciando processo de inicialização...\n');

inicializarCodigosProd(); 