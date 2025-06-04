require('dotenv').config();
const sequelize = require('./db');
const User = require('./models/user');

async function fixCredits() {
    try {
        console.log('🔧 Iniciando correção de créditos...');
        console.log('📊 DATABASE_URL:', process.env.DATABASE_URL);
        console.log('🌍 NODE_ENV:', process.env.NODE_ENV);

        // Conectar ao banco de dados
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Listar usuários atuais
        const usersBefore = await User.findAll({
            attributes: ['id', 'email', 'credits']
        });

        console.log('👥 Usuários antes da correção:');
        usersBefore.forEach(user => {
            console.log(`   ID: ${user.id}, Email: ${user.email}, Créditos: ${user.credits}`);
        });

        // Atualizar todos os usuários que têm 1 crédito para 0
        const [affectedRows] = await sequelize.query(
            'UPDATE users SET credits = 0 WHERE credits = 1'
        );

        console.log(`📊 ${affectedRows} usuários tiveram seus créditos corrigidos para 0`);

        // Verificar resultado
        const usersAfter = await User.findAll({
            attributes: ['id', 'email', 'credits']
        });

        console.log('👥 Usuários após a correção:');
        usersAfter.forEach(user => {
            console.log(`   ID: ${user.id}, Email: ${user.email}, Créditos: ${user.credits}`);
        });

        console.log('✅ Correção de créditos concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao corrigir créditos:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Executar o script
fixCredits(); 