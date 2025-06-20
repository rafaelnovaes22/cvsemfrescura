const sequelize = require('./db');
const User = require('./models/user');

async function migrateProduction() {
    try {
        console.log('🚀 INICIANDO MIGRAÇÃO EM PRODUÇÃO...');
        console.log('═══════════════════════════════════════════════════');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Verificar se estamos em produção
        const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
        console.log(`🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);

        console.log('🔧 Verificando estrutura da tabela users...');

        // Para PostgreSQL em produção
        if (process.env.DATABASE_URL) {
            console.log('🐘 Detectado PostgreSQL (Produção)');

            // Verificar se a coluna isAdmin existe
            const [columns] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'isAdmin'
            `);

            if (columns.length === 0) {
                console.log('➕ Adicionando coluna isAdmin...');

                await sequelize.query(`
                    ALTER TABLE users 
                    ADD COLUMN "isAdmin" BOOLEAN DEFAULT false
                `);

                console.log('✅ Coluna isAdmin adicionada!');

                // Atualizar todos os usuários existentes
                await sequelize.query(`
                    UPDATE users 
                    SET "isAdmin" = false 
                    WHERE "isAdmin" IS NULL
                `);

                console.log('✅ Todos os usuários atualizados com isAdmin = false');

            } else {
                console.log('✅ Coluna isAdmin já existe');
            }

        } else {
            // Para SQLite em desenvolvimento
            console.log('🗃️ Detectado SQLite (Desenvolvimento)');

            const [columns] = await sequelize.query(`
                PRAGMA table_info(users)
            `);

            const hasIsAdmin = columns.some(col => col.name === 'isAdmin');

            if (!hasIsAdmin) {
                console.log('➕ Adicionando coluna isAdmin...');

                await sequelize.query(`
                    ALTER TABLE users 
                    ADD COLUMN isAdmin BOOLEAN DEFAULT 0
                `);

                console.log('✅ Coluna isAdmin adicionada!');
            } else {
                console.log('✅ Coluna isAdmin já existe');
            }
        }

        // Sincronizar modelo
        console.log('🔄 Sincronizando modelo User...');
        await User.sync({ alter: false }); // Não forçar alterações

        // Verificar usuários atuais
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'isAdmin', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 10 // Limitar para não sobrecarregar em produção
        });

        console.log('');
        console.log('📊 USUÁRIOS ATUAIS (últimos 10):');
        console.log('─'.repeat(50));

        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado');
        } else {
            users.forEach(user => {
                const adminBadge = user.isAdmin ? '👑 ADMIN' : '👤 USER';
                const date = new Date(user.createdAt).toLocaleDateString('pt-BR');
                console.log(`${adminBadge} | ${user.email} | ${date}`);
            });

            const adminCount = users.filter(u => u.isAdmin).length;
            console.log('');
            console.log(`📈 Administradores encontrados: ${adminCount}`);

            if (adminCount === 0) {
                console.log('');
                console.log('⚠️ AÇÃO NECESSÁRIA:');
                console.log('❌ Nenhum administrador encontrado!');
                console.log('🔧 Promova um usuário a admin com:');
                console.log(`   node promote-user-admin.js usuario@email.com`);
            }
        }

        console.log('');
        console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('🎉 Campo isAdmin está pronto para uso');

        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
        console.error('');
        console.error('💡 POSSÍVEIS SOLUÇÕES:');
        console.error('1. Verificar conexão com banco de dados');
        console.error('2. Verificar permissões de ALTER TABLE');
        console.error('3. Executar em horário de menor tráfego');

        process.exit(1);
    }
}

// Executar migração
console.log('🚀 Iniciando migração para campo isAdmin...');
migrateProduction(); 