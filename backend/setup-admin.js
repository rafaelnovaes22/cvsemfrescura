const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const GiftCode = require('./models/giftCode');

async function setupAdmin() {
    try {
        console.log('🚀 Configurando painel administrativo...');

        // Conectar e sincronizar
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        console.log('✅ Banco de dados sincronizado!');

        // Verificar códigos existentes
        const existingCodes = await GiftCode.count();
        console.log(`📊 Códigos existentes: ${existingCodes}`);

        // Se não há códigos, criar alguns exemplos
        if (existingCodes === 0) {
            console.log('🔨 Criando códigos de exemplo...');

            const sampleCodes = [
                {
                    code: 'ADMIN123',
                    description: 'Código de teste para administrador',
                    maxUses: 5,
                    isActive: true,
                    usedCount: 0
                },
                {
                    code: 'PROMO2024',
                    description: 'Promoção de Ano Novo 2024',
                    maxUses: 10,
                    isActive: true,
                    usedCount: 2
                },
                {
                    code: 'BLACK50',
                    description: 'Black Friday 50% OFF',
                    maxUses: 100,
                    isActive: false,
                    usedCount: 45,
                    expiresAt: new Date('2024-12-31')
                },
                {
                    code: 'WELCOME10',
                    description: 'Código de boas-vindas',
                    maxUses: 1,
                    isActive: true,
                    usedCount: 1
                }
            ];

            for (const codeData of sampleCodes) {
                await GiftCode.create(codeData);
                console.log(`✅ Criado: ${codeData.code}`);
            }
        }

        console.log('');
        console.log('🎉 PAINEL ADMINISTRATIVO CONFIGURADO!');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('🌐 ACESSO AO PAINEL:');
        console.log('🔗 http://localhost:3000/admin.html');
        console.log('');
        console.log('📋 APIS DISPONÍVEIS:');
        console.log('📊 Dashboard:      GET  /api/admin/dashboard');
        console.log('📝 Listar códigos: GET  /api/admin/codes');
        console.log('🔨 Criar lote:     POST /api/admin/codes/bulk');
        console.log('✏️ Editar código:  PUT  /api/admin/codes/:id');
        console.log('🗑️ Deletar:        DEL  /api/admin/codes/:id');
        console.log('📈 Relatórios:     GET  /api/admin/reports/usage');
        console.log('📥 Exportar CSV:   GET  /api/admin/export/codes');
        console.log('');
        console.log('🔑 AUTENTICAÇÃO:');
        console.log('❗ Todas as rotas administrativas requerem token JWT');
        console.log('💡 Faça login primeiro em: http://localhost:3000/login.html');
        console.log('');
        console.log('🛠️ FUNCIONALIDADES:');
        console.log('✅ Dashboard com estatísticas em tempo real');
        console.log('✅ Criação de códigos em lote');
        console.log('✅ Filtros e busca avançada');
        console.log('✅ Ativação/desativação de códigos');
        console.log('✅ Relatórios de uso por período');
        console.log('✅ Exportação para CSV');
        console.log('✅ Paginação e ordenação');
        console.log('✅ Interface responsiva');
        console.log('');
        console.log('🎯 EXEMPLOS DE USO:');
        console.log('');
        console.log('1️⃣ CRIAR CÓDIGOS EM LOTE:');
        console.log('   • Prefixo: NATAL');
        console.log('   • Quantidade: 50');
        console.log('   • Máximo de usos: 1');
        console.log('   • Resultado: NATAL[RANDOM] (ex: NATALX7K9M2)');
        console.log('');
        console.log('2️⃣ MONITORAR PERFORMANCE:');
        console.log('   • Dashboard mostra códigos ativos');
        console.log('   • Alertas para códigos que expiram');
        console.log('   • Estatísticas de uso diário');
        console.log('');
        console.log('3️⃣ GERAR RELATÓRIOS:');
        console.log('   • Filtrar por período');
        console.log('   • Exportar para análise externa');
        console.log('   • Acompanhar conversão');
        console.log('');
        console.log('🔒 SEGURANÇA:');
        console.log('⚠️  Por padrão, qualquer usuário logado pode acessar');
        console.log('💡 Para produção, implemente verificação de role admin');
        console.log('🔧 Edite backend/routes/admin.js para adicionar verificação');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na configuração:', error);
        process.exit(1);
    }
}

setupAdmin(); 