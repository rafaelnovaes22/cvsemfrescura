const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');

async function verificarCodigosProd() {
    try {
        console.log('🔍 VERIFICANDO CÓDIGOS DE PRESENTE EM PRODUÇÃO...');
        console.log('═══════════════════════════════════════════════════');

        // Testar conexão com banco
        console.log('📡 Testando conexão com banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão com banco OK');

        // Sincronizar modelos
        console.log('🔄 Sincronizando modelos...');
        await sequelize.sync();
        console.log('✅ Modelos sincronizados');

        // Buscar todos os códigos
        console.log('🔍 Buscando códigos de presente...');
        const codes = await GiftCode.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: GiftCodeUsage,
                as: 'usages',
                required: false
            }]
        });

        console.log(`📊 Total de códigos encontrados: ${codes.length}`);
        console.log('');

        if (codes.length === 0) {
            console.log('❌ NENHUM CÓDIGO DE PRESENTE ENCONTRADO!');
            console.log('');
            console.log('💡 Para criar códigos de teste, execute:');
            console.log('   node create-test-gift-code.js');
            console.log('');
            console.log('💡 Para criar códigos via painel admin:');
            console.log('   1. Acesse: http://localhost:3000/admin.html');
            console.log('   2. Faça login como administrador');
            console.log('   3. Use o formulário "Criar Códigos em Lote"');
        } else {
            // Estatísticas gerais
            const ativos = codes.filter(c => c.isActive).length;
            const disponiveis = codes.filter(c => c.isActive && c.usedCount < c.maxUses).length;
            const esgotados = codes.filter(c => c.usedCount >= c.maxUses).length;
            const expirados = codes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;

            console.log('📈 ESTATÍSTICAS GERAIS:');
            console.log(`   🟢 Códigos ativos: ${ativos}`);
            console.log(`   🎯 Códigos disponíveis: ${disponiveis}`);
            console.log(`   🔴 Códigos esgotados: ${esgotados}`);
            console.log(`   ⏰ Códigos expirados: ${expirados}`);
            console.log('');

            console.log('🎁 LISTA COMPLETA DE CÓDIGOS:');
            console.log('═══════════════════════════════════');

            codes.forEach((code, index) => {
                const usosRestantes = code.maxUses - code.usedCount;
                const statusIcon = code.isActive ? '🟢' : '🔴';
                const disponibilidade = usosRestantes > 0 ? '✅ DISPONÍVEL' : '❌ ESGOTADO';
                const expiracao = code.expiresAt ?
                    new Date(code.expiresAt).toLocaleDateString('pt-BR') :
                    'Sem expiração';

                const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                const statusFinal = isExpired ? '⏰ EXPIRADO' :
                    (code.isActive ? disponibilidade : '🔴 INATIVO');

                console.log(`\n${index + 1}. ${statusIcon} ${code.code}`);
                console.log(`   📊 Status: ${statusFinal}`);
                console.log(`   🔢 Usos: ${code.usedCount}/${code.maxUses} (restam ${usosRestantes})`);
                console.log(`   📅 Expira: ${expiracao}`);
                console.log(`   📝 Descrição: ${code.description || 'Sem descrição'}`);
                console.log(`   📍 Criado: ${new Date(code.createdAt).toLocaleDateString('pt-BR')}`);

                if (code.usages && code.usages.length > 0) {
                    console.log(`   👥 Últimos usos: ${code.usages.length} registro(s)`);
                }
            });

            // Códigos prontos para uso
            const codigosDisponiveis = codes.filter(c =>
                c.isActive &&
                c.usedCount < c.maxUses &&
                (!c.expiresAt || new Date(c.expiresAt) > new Date())
            );

            if (codigosDisponiveis.length > 0) {
                console.log('\n🚀 CÓDIGOS PRONTOS PARA USO:');
                console.log('═══════════════════════════════');
                codigosDisponiveis.forEach(code => {
                    console.log(`✅ ${code.code} - ${code.maxUses - code.usedCount} uso(s) restante(s)`);
                    console.log(`   🔗 Teste: http://localhost:3000/analisar.html?giftCode=${code.code}`);
                });
            }
        }

        console.log('\n🔧 FERRAMENTAS ADMINISTRATIVAS:');
        console.log('═══════════════════════════════════');
        console.log('🌐 Painel Admin: http://localhost:3000/admin.html');
        console.log('📊 API Dashboard: GET /api/admin/dashboard');
        console.log('📋 API Códigos: GET /api/admin/codes');
        console.log('🎯 Criar lote: POST /api/admin/codes/bulk');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO AO VERIFICAR CÓDIGOS:', error.message);
        console.error('');
        console.error('🔍 POSSÍVEIS CAUSAS:');
        console.error('1. Banco de dados não está acessível');
        console.error('2. Modelos não foram criados (execute: node setup-admin.js)');
        console.error('3. Arquivo .env não configurado corretamente');
        console.error('4. Servidor não está rodando');
        console.error('');
        console.error('💡 SOLUÇÕES:');
        console.error('1. Verifique se o servidor está rodando: npm start');
        console.error('2. Configure o banco: node setup-admin.js');
        console.error('3. Verifique variáveis: node check-env.js');

        if (error.stack) {
            console.error('\n🐛 STACK TRACE:');
            console.error(error.stack);
        }

        process.exit(1);
    }
}

console.log('🎁 CV SEM FRESCURA - VERIFICADOR DE CÓDIGOS DE PRESENTE');
console.log('Aguarde...\n');

verificarCodigosProd(); 