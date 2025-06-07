const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./db');
const User = require('./models/user');

async function verificarUsuarioAdmin() {
    try {
        console.log('🔍 VERIFICANDO USUÁRIOS E PERMISSÕES DE ADMIN...');
        console.log('═══════════════════════════════════════════════════');

        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Sincronizar modelo para garantir que a coluna isAdmin existe
        await User.sync({ alter: true });
        console.log('✅ Modelo de usuário sincronizado');

        // Buscar todos os usuários
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'isAdmin', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        console.log('');
        console.log(`📊 TOTAL DE USUÁRIOS: ${users.length}`);
        console.log('');

        if (users.length === 0) {
            console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
            console.log('');
            console.log('💡 SOLUÇÕES:');
            console.log('1. Registre-se primeiro em: http://localhost:3000/analisar.html');
            console.log('2. Ou crie um admin: node create-admin-user.js admin@test.com --create');
            return;
        }

        console.log('👥 LISTA DE USUÁRIOS:');
        console.log('─'.repeat(60));

        let adminCount = 0;
        let lastUser = null;

        users.forEach((user, index) => {
            const adminBadge = user.isAdmin ? '👑 ADMIN' : '👤 USER';
            const date = new Date(user.createdAt).toLocaleDateString('pt-BR');

            console.log(`${index + 1}. ${adminBadge} ${user.email}`);
            console.log(`   📛 Nome: ${user.name}`);
            console.log(`   📅 Criado: ${date}`);
            console.log(`   🔐 Admin: ${user.isAdmin ? 'SIM' : 'NÃO'}`);
            console.log('');

            if (user.isAdmin) adminCount++;
            if (index === 0) lastUser = user; // Usuário mais recente
        });

        console.log('📈 ESTATÍSTICAS:');
        console.log(`   👑 Administradores: ${adminCount}`);
        console.log(`   👤 Usuários normais: ${users.length - adminCount}`);
        console.log('');

        // Se não houver admin, oferecer para promover o último usuário
        if (adminCount === 0) {
            console.log('⚠️ PROBLEMA IDENTIFICADO:');
            console.log('❌ Nenhum usuário tem permissões de administrador!');
            console.log('');

            if (lastUser) {
                console.log('💡 SOLUÇÃO AUTOMÁTICA:');
                console.log(`🔧 Promovendo usuário mais recente a admin: ${lastUser.email}`);

                // Promover o último usuário a admin
                await lastUser.update({ isAdmin: true });

                console.log('✅ Usuário promovido a administrador!');
                console.log('');
                console.log('🎉 PROBLEMA RESOLVIDO!');
                console.log('─'.repeat(40));
                console.log(`👑 ${lastUser.email} agora é administrador`);
                console.log('');
                console.log('🚀 PRÓXIMOS PASSOS:');
                console.log('1. Faça logout se estiver logado');
                console.log('2. Faça login novamente com suas credenciais');
                console.log('3. Acesse: http://localhost:3000/admin.html');
                console.log('4. O painel administrativo deve abrir normalmente');
            }
        } else {
            console.log('✅ SISTEMA OK:');
            console.log(`👑 ${adminCount} administrador(es) encontrado(s)`);
            console.log('');
            console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DE ACESSO:');
            console.log('');
            console.log('Se o painel admin não está abrindo, verifique:');
            console.log('');
            console.log('1. 🔐 AUTENTICAÇÃO:');
            console.log('   • Você está logado com uma conta de administrador?');
            console.log('   • O token JWT ainda é válido?');
            console.log('   • Tente fazer logout e login novamente');
            console.log('');
            console.log('2. 🌐 NAVEGADOR:');
            console.log('   • Limpe cache e cookies');
            console.log('   • Abra em aba anônima/privada');
            console.log('   • Verifique console do navegador (F12)');
            console.log('');
            console.log('3. 🔧 SERVIDOR:');
            console.log('   • Servidor está rodando: http://localhost:3000/health');
            console.log('   • API está respondendo: http://localhost:3000/api/admin/dashboard');
            console.log('');

            const adminUsers = users.filter(u => u.isAdmin);
            console.log('👑 CONTAS DE ADMINISTRADOR:');
            adminUsers.forEach(admin => {
                console.log(`   ✅ ${admin.email} (${admin.name})`);
            });
        }

        console.log('');
        console.log('🔗 LINKS ÚTEIS:');
        console.log('══════════════════════════════════════════════════');
        console.log('🌐 Painel Admin: http://localhost:3000/admin.html');
        console.log('🔐 Login: http://localhost:3000/analisar.html');
        console.log('🏥 Health Check: http://localhost:3000/health');
        console.log('📊 API Dashboard: http://localhost:3000/api/admin/dashboard');

        await sequelize.close();

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        console.log('');
        console.log('🔍 POSSÍVEIS CAUSAS:');
        console.log('• Banco de dados não está acessível');
        console.log('• Modelo User não foi criado corretamente');
        console.log('• Servidor não está rodando');
        console.log('');
        console.log('💡 SOLUÇÕES:');
        console.log('• Execute: cd backend && npm start');
        console.log('• Verifique: node setup-admin.js');

        if (error.stack) {
            console.log('');
            console.log('🐛 DETALHES DO ERRO:');
            console.log(error.stack);
        }
    }
}

console.log('🔧 CV SEM FRESCURA - VERIFICADOR DE USUÁRIOS ADMIN');
console.log('Analisando usuários e permissões...\n');

verificarUsuarioAdmin(); 