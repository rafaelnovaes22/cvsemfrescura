const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const User = require('./models/user');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    try {
        console.log('🔧 Configurando usuário administrador...');

        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        // Perguntar pelo email do usuário para promover a admin
        const email = process.argv[2];

        if (!email) {
            console.log('');
            console.log('📋 USO DO SCRIPT:');
            console.log('════════════════════════════════════════════════════════════');
            console.log('');
            console.log('Para PROMOVER usuário existente a admin:');
            console.log('node backend/create-admin-user.js usuario@email.com');
            console.log('');
            console.log('Para CRIAR novo usuário admin:');
            console.log('node backend/create-admin-user.js admin@empresa.com --create');
            console.log('');
            console.log('📊 USUÁRIOS ATUAIS:');
            console.log('────────────────────────────────────────────────────────────');

            const users = await User.findAll({
                attributes: ['id', 'name', 'email', 'isAdmin', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });

            if (users.length === 0) {
                console.log('❌ Nenhum usuário encontrado no banco de dados');
            } else {
                users.forEach(user => {
                    const adminBadge = user.isAdmin ? '👑 ADMIN' : '👤 USER';
                    console.log(`${adminBadge} | ${user.email} | ${user.name}`);
                });
            }
            console.log('');
            process.exit(0);
        }

        const createNew = process.argv.includes('--create');

        if (createNew) {
            // Criar novo usuário admin
            console.log(`🔨 Criando novo usuário admin: ${email}`);

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                console.log('❌ Usuário já existe! Use sem --create para promover a admin.');
                process.exit(1);
            }

            // Senha padrão (deve ser alterada no primeiro login)
            const defaultPassword = 'Admin123!';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const adminUser = await User.create({
                name: 'Administrador',
                email: email,
                password: hashedPassword,
                isAdmin: true,
                email_verified: true,
                onboarding_completed: true,
                credits: 100 // Admin começa com créditos
            });

            console.log('✅ Usuário admin criado com sucesso!');
            console.log('');
            console.log('🔑 CREDENCIAIS DE ACESSO:');
            console.log('────────────────────────────────────────────────');
            console.log(`📧 Email: ${email}`);
            console.log(`🔒 Senha: ${defaultPassword}`);
            console.log('');
            console.log('⚠️ IMPORTANTE: Altere a senha no primeiro login!');

        } else {
            // Promover usuário existente
            console.log(`🔍 Procurando usuário: ${email}`);

            const user = await User.findOne({ where: { email } });

            if (!user) {
                console.log('❌ Usuário não encontrado!');
                console.log('💡 Use --create para criar um novo usuário admin');
                process.exit(1);
            }

            if (user.isAdmin) {
                console.log('✅ Usuário já é administrador!');
            } else {
                await user.update({ isAdmin: true });
                console.log('✅ Usuário promovido a administrador!');
            }
        }

        console.log('');
        console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('');
        console.log('🌐 ACESSAR PAINEL ADMIN:');
        console.log('🔗 https://www.cvsemfrescura.com.br/admin.html');
        console.log('');
        console.log('🔐 COMO USAR:');
        console.log('1. Faça login com as credenciais do admin');
        console.log('2. Acesse o painel administrativo');
        console.log('3. Gerencie códigos de presente');
        console.log('');
        console.log('📋 FUNCIONALIDADES DISPONÍVEIS:');
        console.log('• Dashboard com estatísticas');
        console.log('• Criar códigos em lote');
        console.log('• Ativar/desativar códigos');
        console.log('• Exportar relatórios');
        console.log('• Filtrar e buscar códigos');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao configurar admin:', error);
        process.exit(1);
    }
}

createAdminUser(); 