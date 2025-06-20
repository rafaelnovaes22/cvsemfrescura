const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');

async function fixAdminMigration() {
    try {
        console.log('🔧 Corrigindo migração para campo isAdmin...');

        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Verificar se a coluna isAdmin já existe
        const [columns] = await sequelize.query(`
            PRAGMA table_info(users)
        `);

        const hasIsAdmin = columns.some(col => col.name === 'isAdmin');

        if (hasIsAdmin) {
            console.log('✅ Campo isAdmin já existe na tabela users');
        } else {
            console.log('➕ Adicionando campo isAdmin...');

            // Adicionar coluna isAdmin de forma simples
            await sequelize.query(`
                ALTER TABLE users ADD COLUMN isAdmin BOOLEAN DEFAULT 0
            `);

            console.log('✅ Campo isAdmin adicionado com sucesso!');
        }

        // Atualizar todos os usuários para garantir que não sejam admin por padrão
        await sequelize.query(`
            UPDATE users SET isAdmin = 0 WHERE isAdmin IS NULL OR isAdmin = 1
        `);

        // Verificar usuários atuais
        const [users] = await sequelize.query(`
            SELECT id, name, email, isAdmin, createdAt
            FROM users 
            ORDER BY createdAt DESC
        `);

        console.log('');
        console.log('📊 USUÁRIOS ATUAIS:');
        console.log('════════════════════════════════════════════════════════════');

        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado no banco de dados');
        } else {
            users.forEach(user => {
                const adminBadge = user.isAdmin ? '👑 ADMIN' : '👤 USER';
                const date = new Date(user.createdAt).toLocaleDateString();
                console.log(`${adminBadge} | ${user.email} | ${user.name} | ${date}`);
            });
        }

        // Contar admins
        const adminCount = users.filter(u => u.isAdmin).length;
        console.log('');
        console.log(`📈 ESTATÍSTICAS:`);
        console.log(`   Total de usuários: ${users.length}`);
        console.log(`   Administradores: ${adminCount}`);
        console.log(`   Usuários comuns: ${users.length - adminCount}`);

        console.log('');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('');

        if (adminCount === 0) {
            console.log('⚠️  NENHUM ADMINISTRADOR CONFIGURADO!');
            console.log('');
            console.log('📋 PRÓXIMO PASSO OBRIGATÓRIO:');
            console.log('1️⃣ Promover usuário a admin:');
            if (users.length > 0) {
                console.log(`   node create-admin-user.js ${users[0].email}`);
            } else {
                console.log('   node create-admin-user.js admin@empresa.com --create');
            }
        } else {
            console.log('✅ Sistema já possui administrador(es) configurado(s)');
            console.log('');
            console.log('🌐 ACESSAR PAINEL ADMINISTRATIVO:');
            console.log('   https://www.cvsemfrescura.com.br/admin.html');
        }

        console.log('');
        console.log('📖 Para mais informações, consulte: CONFIGURACAO_ADMIN.md');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao aplicar migração:', error);
        console.error('');
        console.error('💡 Possíveis soluções:');
        console.error('• Verificar conexão com banco de dados');
        console.error('• Verificar se a tabela users existe');
        console.error('• Executar: rm -rf backend/database/dev.sqlite e tentar novamente');
        process.exit(1);
    }
}

fixAdminMigration(); 