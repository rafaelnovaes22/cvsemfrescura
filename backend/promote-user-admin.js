const sequelize = require('./db');
const User = require('./models/user');

async function promoteUserToAdmin() {
    try {
        const email = process.argv[2];
        
        if (!email) {
            console.log('❌ Email é obrigatório!');
            console.log('');
            console.log('💡 USO CORRETO:');
            console.log('   node promote-user-admin.js usuario@email.com');
            process.exit(1);
        }
        
        console.log('👑 PROMOVENDO USUÁRIO A ADMINISTRADOR...');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📧 Email alvo: ${email}`);
        
        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');
        
        // Verificar se estamos em produção
        const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
        console.log(`🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
        
        // Buscar o usuário
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.log(`❌ Usuário ${email} não encontrado!`);
            console.log('');
            console.log('💡 POSSÍVEIS SOLUÇÕES:');
            console.log('1. Verificar se o email está correto');
            console.log('2. Usuário precisa se registrar primeiro no sistema');
            console.log('3. Listar usuários: node list-users.js');
            process.exit(1);
        }
        
        console.log('✅ Usuário encontrado!');
        console.log(`📛 Nome: ${user.name}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👑 É Admin atual: ${user.isAdmin ? 'SIM' : 'NÃO'}`);
        
        if (user.isAdmin) {
            console.log('⚠️ Usuário já é administrador!');
            console.log('✅ Nenhuma ação necessária.');
            process.exit(0);
        }
        
        // Promover a admin
        await user.update({ isAdmin: true });
        
        console.log('');
        console.log('🎉 USUÁRIO PROMOVIDO COM SUCESSO!');
        console.log('─'.repeat(40));
        console.log(`👑 ${user.name} agora é ADMINISTRADOR`);
        console.log('✅ Permissões administrativas ativadas');
        
        // Verificar outros admins
        const adminCount = await User.count({ where: { isAdmin: true } });
        console.log('');
        console.log(`📊 Total de administradores: ${adminCount}`);
        
        console.log('');
        console.log('🔧 PRÓXIMOS PASSOS:');
        console.log('1. Usuário deve fazer logout e login novamente');
        console.log('2. Acessar painel admin: /admin.html');
        console.log('3. Token JWT será atualizado no próximo login');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ ERRO AO PROMOVER USUÁRIO:', error.message);
        console.error('');
        console.error('💡 POSSÍVEIS SOLUÇÕES:');
        console.error('1. Verificar conexão com banco de dados');
        console.error('2. Verificar se a coluna isAdmin existe');
        console.error('3. Executar migração: node migrate-production.js');
        
        process.exit(1);
    }
}

// Executar promoção
promoteUserToAdmin(); 