const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');

async function promoteToAdmin() {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('📋 USO DO SCRIPT:');
            console.log('node promote-admin-simple.js usuario@email.com');
            process.exit(0);
        }

        console.log('🔧 Promovendo usuário a administrador...');

        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Verificar se o usuário existe
        const [users] = await sequelize.query(`
            SELECT id, name, email, isAdmin 
            FROM users 
            WHERE email = ?
        `, {
            replacements: [email]
        });

        if (users.length === 0) {
            console.log('❌ Usuário não encontrado!');
            console.log(`💡 Email procurado: ${email}`);

            // Mostrar usuários disponíveis
            const [allUsers] = await sequelize.query(`
                SELECT email, name FROM users ORDER BY createdAt DESC
            `);

            console.log('');
            console.log('👥 USUÁRIOS DISPONÍVEIS:');
            allUsers.forEach(user => {
                console.log(`   📧 ${user.email} (${user.name})`);
            });

            process.exit(1);
        }

        const user = users[0];

        if (user.isAdmin) {
            console.log(`✅ Usuário ${email} já é administrador!`);
        } else {
            // Promover a admin
            await sequelize.query(`
                UPDATE users SET isAdmin = 1 WHERE email = ?
            `, {
                replacements: [email]
            });

            console.log(`✅ Usuário ${email} promovido a administrador!`);
        }

        // Verificar resultado
        const [updatedUser] = await sequelize.query(`
            SELECT name, email, isAdmin FROM users WHERE email = ?
        `, {
            replacements: [email]
        });

        console.log('');
        console.log('📊 INFORMAÇÕES DO USUÁRIO:');
        console.log('════════════════════════════════════════════════════════════');
        console.log(`👤 Nome: ${updatedUser[0].name}`);
        console.log(`📧 Email: ${updatedUser[0].email}`);
        console.log(`👑 Admin: ${updatedUser[0].isAdmin ? 'SIM' : 'NÃO'}`);

        console.log('');
        console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('');
        console.log('🌐 ACESSAR PAINEL ADMINISTRATIVO:');
        console.log('   https://www.cvsemfrescura.com.br/admin.html');
        console.log('');
        console.log('🔐 COMO USAR:');
        console.log('1. Faça login com suas credenciais');
        console.log('2. Acesse o painel administrativo');
        console.log('3. Gerencie códigos de presente');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        process.exit(1);
    }
}

promoteToAdmin(); 