const sequelize = require('./db');

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Verificando estrutura do banco de dados...\n');

        // Verificar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida!\n');

        // Listar todas as tabelas
        console.log('📋 Tabelas no banco:');
        const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        tables.forEach(table => {
            console.log(`  - ${table.table_name}`);
        });

        // Verificar tabelas de usuários especificamente
        console.log('\n👥 Tabelas relacionadas a usuários:');
        const [userTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%user%') 
      ORDER BY table_name
    `);

        userTables.forEach(table => {
            console.log(`  - ${table.table_name}`);
        });

        // Verificar constraints da tabela transactions
        console.log('\n🔗 Constraints de chave estrangeira da tabela transactions:');
        const [constraints] = await sequelize.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'transactions'
    `);

        if (constraints.length === 0) {
            console.log('  ⚠️ Nenhuma constraint de chave estrangeira encontrada!');
        } else {
            constraints.forEach(constraint => {
                console.log(`  - ${constraint.constraint_name}: ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
            });
        }

        // Verificar estrutura da tabela transactions
        console.log('\n🏗️ Estrutura da tabela transactions:');
        const [transactionColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);

        if (transactionColumns.length === 0) {
            console.log('  ⚠️ Tabela transactions não encontrada!');
        } else {
            transactionColumns.forEach(column => {
                console.log(`  - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        }

        // Verificar estrutura das tabelas de usuários
        console.log('\n👤 Estrutura das tabelas de usuários:');
        const [userColumns] = await sequelize.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name ILIKE '%user%'
      ORDER BY table_name, ordinal_position
    `);

        if (userColumns.length === 0) {
            console.log('  ⚠️ Nenhuma tabela de usuários encontrada!');
        } else {
            let currentTable = '';
            userColumns.forEach(column => {
                if (column.table_name !== currentTable) {
                    currentTable = column.table_name;
                    console.log(`\n  📋 ${currentTable}:`);
                }
                console.log(`    - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        }

        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar estrutura do banco:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkDatabaseStructure(); 