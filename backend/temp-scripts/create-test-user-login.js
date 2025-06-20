const { User } = require('./models');
const { hashPassword } = require('./utils/encryption');

async function createTestUser() {
    try {
        console.log('🔧 Criando usuário de teste para login...');

        // Verificar se usuário já existe
        const existingUser = await User.findOne({ where: { email: 'teste@exemplo.com' } });
        if (existingUser) {
            console.log('✅ Usuário de teste já existe!');
            console.log('📧 Email: teste@exemplo.com');
            console.log('🔑 Senha: 123456');
            console.log('💳 Créditos:', existingUser.credits);
            return;
        }

        // Criar usuário de teste
        const hashedPassword = await hashPassword('123456');
        const user = await User.create({
            name: 'Usuário de Teste',
            email: 'teste@exemplo.com',
            password: hashedPassword,
            credits: 5
        });

        console.log('✅ Usuário de teste criado com sucesso!');
        console.log('📧 Email: teste@exemplo.com');
        console.log('🔑 Senha: 123456');
        console.log('💳 Créditos: 5');

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
    }

    process.exit(0);
}

createTestUser(); 