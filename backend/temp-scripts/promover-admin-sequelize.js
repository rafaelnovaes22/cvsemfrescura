require('dotenv').config();
const { sequelize } = require('./config/database');

async function promoverAdmin() {
    try {
        console.log('🔧 Conectando ao banco de dados...');

        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado com sucesso!');

        // Executar query direta
        const email = 'rafaeldenovaes@gmail.com';

        console.log(`🔧 Promovendo ${email} a administrador...`);

        const [results] = await sequelize.query(
            `UPDATE users SET isAdmin = 1 WHERE email = ?`,
            { replacements: [email] }
        );

        console.log(`✅ Query executada! Linhas afetadas: ${results.changes || results.affectedRows || 'N/A'}`);

        // Verificar se funcionou
        console.log('🔍 Verificando status atual...');
        const [users] = await sequelize.query(
            `SELECT email, isAdmin, name FROM users WHERE email = ?`,
            { replacements: [email] }
        );

        if (users && users.length > 0) {
            console.log('✅ Status atual do usuário:', users[0]);
        } else {
            console.log('❌ Usuário não encontrado no banco!');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
        console.log('🔒 Conexão fechada.');
    }
}

promoverAdmin(); 