require('dotenv').config();
console.log('🧪 Testando conexão do banco de dados...\n');

const sequelize = require('./db');

async function testConnection() {
  try {
    console.log('🔄 Aguardando inicialização...');
    const db = await sequelize;
    
    console.log('✅ Banco conectado com sucesso!');
    console.log('📊 Dialeto:', db.getDialect().toUpperCase());
    console.log('📁 Storage:', db.config?.storage || 'N/A');
    console.log('🔗 Host:', db.config?.host || 'N/A');
    console.log('🔢 Port:', db.config?.port || 'N/A');
    
    // Testar sincronização
    console.log('\n🔄 Testando sincronização...');
    await db.sync({ alter: true });
    console.log('✅ Sincronização bem-sucedida!');
    
    // Fechar conexão
    await db.close();
    console.log('🔒 Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes:', error);
    process.exit(1);
  }
}

testConnection(); 