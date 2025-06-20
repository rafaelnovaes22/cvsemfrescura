const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const User = require('./models/user');

async function applyAdminMigration() {
    try {
        console.log('🔧 Aplicando migração para campo isAdmin...');

        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Usar sync com alter para adicionar campos ausentes
        console.log('🔄 Sincronizando modelo de usuário...');
        await User.sync({ alter: true });

        console.log('✅ Campo isAdmin adicionado/verificado com sucesso!');

        // Atualizar todos os usuários existentes para garantir que isAdmin seja false por padrão
        const [updatedCount] = await User.update(
            { isAdmin: false },
            {
                where: {
                    isAdmin: null
                },
                silent: true
            }
        );

        if (updatedCount > 0) {
            console.log(`🔄 ${updatedCount} usuário(s) atualizado(s) com isAdmin = false`);
        }

        // Verificar usuários atuais
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'isAdmin', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

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
                console.log(`   node backend/create-admin-user.js ${users[0].email}`);
            } else {
                console.log('   node backend/create-admin-user.js admin@empresa.com --create');
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
        console.error('• Verificar variáveis de ambiente (.env)');
        console.error('• Verificar permissões de usuário no banco');
        console.error('• Verificar se modelo User está correto');
        process.exit(1);
    }
}

applyAdminMigration(); 