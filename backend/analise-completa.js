const sequelize = require('./db');

async function analiseCompleta() {
    try {
        console.log('🔍 ANÁLISE DETALHADA DO PROBLEMA DE CHAVE ESTRANGEIRA\n');
        console.log('=' * 60);

        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida\n');

        // PASSO 1: Verificar todas as constraints da tabela transactions
        console.log('📋 PASSO 1: Analisando constraints da tabela transactions');
        console.log('-'.repeat(50));

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
        AND kcu.column_name = 'userId'
    `);

        console.log(`Encontradas ${constraints.length} constraints para userId:`);
        constraints.forEach((constraint, index) => {
            console.log(`  ${index + 1}. ${constraint.constraint_name}:`);
            console.log(`     ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });

        // PASSO 2: Analisar dados nas tabelas de usuários
        console.log('\n👥 PASSO 2: Analisando dados nas tabelas de usuários');
        console.log('-'.repeat(50));

        const [usersData] = await sequelize.query(`
      SELECT 
        'Users' as tabela, 
        id, 
        name, 
        email,
        email_verified,
        credits,
        "createdAt"
      FROM "Users" 
      ORDER BY id
    `);

        const [usersLowerData] = await sequelize.query(`
      SELECT 
        'users' as tabela, 
        id, 
        name, 
        email,
        email_verified,
        credits,
        "createdAt"
      FROM "users" 
      ORDER BY id
    `);

        console.log('Tabela "Users" (maiúscula):');
        if (usersData.length === 0) {
            console.log('  ⚠️ Vazia');
        } else {
            usersData.forEach(user => {
                console.log(`  - ID: ${user.id} | Nome: ${user.name} | Email: ${user.email} | Créditos: ${user.credits}`);
            });
        }

        console.log('\nTabela "users" (minúscula):');
        if (usersLowerData.length === 0) {
            console.log('  ⚠️ Vazia');
        } else {
            usersLowerData.forEach(user => {
                console.log(`  - ID: ${user.id} | Nome: ${user.name} | Email: ${user.email} | Créditos: ${user.credits}`);
            });
        }

        // PASSO 3: Verificar transações existentes
        console.log('\n💳 PASSO 3: Analisando transações existentes');
        console.log('-'.repeat(50));

        const [transactions] = await sequelize.query(`
      SELECT id, "userId", amount, credits, status, "createdAt"
      FROM transactions 
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

        if (transactions.length === 0) {
            console.log('  ⚠️ Nenhuma transação encontrada');
        } else {
            console.log(`Encontradas ${transactions.length} transações (últimas 10):`);
            transactions.forEach(trans => {
                console.log(`  - ID: ${trans.id} | UserID: ${trans.userId} | Valor: R$ ${trans.amount} | Status: ${trans.status}`);
            });

            // Verificar se os userIds das transações existem nas tabelas
            console.log('\n🔍 Verificando se os userIds das transações existem:');
            for (const trans of transactions) {
                const userInUsers = usersData.find(u => u.id === trans.userId);
                const userInUsersLower = usersLowerData.find(u => u.id === trans.userId);

                console.log(`  - Transação ${trans.id} (userId: ${trans.userId}):`);
                console.log(`    • Existe em "Users": ${userInUsers ? '✅' : '❌'}`);
                console.log(`    • Existe em "users": ${userInUsersLower ? '✅' : '❌'}`);
            }
        }

        // PASSO 4: Identificar qual tabela o modelo User está usando
        console.log('\n🎯 PASSO 4: Verificando configuração do modelo User');
        console.log('-'.repeat(50));

        const User = require('./models/user');
        console.log(`Modelo User usa tableName: "${User.tableName}"`);
        console.log(`Modelo User usa schema: "${User.schema || 'public'}"`);

        // PASSO 5: Verificar o modelo Transaction
        console.log('\n🏦 PASSO 5: Verificando configuração do modelo Transaction');
        console.log('-'.repeat(50));

        const Transaction = require('./models/Transaction');
        console.log(`Modelo Transaction usa tableName: "${Transaction.tableName}"`);

        const userIdField = Transaction.rawAttributes.userId;
        if (userIdField && userIdField.references) {
            console.log(`Campo userId referencia: "${userIdField.references.model}.${userIdField.references.key}"`);
        }

        // PASSO 6: Testar qual constraint está ativa
        console.log('\n🧪 PASSO 6: Testando constraints');
        console.log('-'.repeat(50));

        // Tentar inserir uma transação com um userId que existe apenas em uma tabela
        const testUserId = usersLowerData[0]?.id || usersData[0]?.id;

        if (testUserId) {
            console.log(`Testando inserção com userId: ${testUserId}`);

            try {
                const testTransaction = await sequelize.query(`
          INSERT INTO transactions (id, "userId", amount, credits, status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${testUserId}, 10.00, 1, 'pending', NOW(), NOW())
          RETURNING id, "userId"
        `);

                console.log('✅ Inserção de teste bem-sucedida');

                // Remover a transação de teste
                await sequelize.query(`DELETE FROM transactions WHERE id = '${testTransaction[0][0].id}'`);
                console.log('🧹 Transação de teste removida');

            } catch (error) {
                console.log('❌ Erro na inserção de teste:');
                console.log(`   ${error.message}`);

                if (error.message.includes('transactions_userId_fkey')) {
                    console.log('   🔍 A constraint "transactions_userId_fkey" (maiúscula) está causando o problema');
                } else if (error.message.includes('transactions_userid_fkey')) {
                    console.log('   🔍 A constraint "transactions_userid_fkey" (minúscula) está causando o problema');
                }
            }
        }

        console.log('\n📊 DIAGNÓSTICO FINAL:');
        console.log('=' * 30);

        if (constraints.length > 1) {
            console.log('❌ PROBLEMA IDENTIFICADO: Múltiplas constraints de FK para userId');
            console.log('   Isso pode causar conflitos no PostgreSQL');
        }

        if (usersData.length > 0 && usersLowerData.length > 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: Duas tabelas de usuários com dados');
            console.log('   Isso causa inconsistência nas referencias');
        }

        const correctConstraint = constraints.find(c => c.foreign_table_name === 'users');
        const wrongConstraint = constraints.find(c => c.foreign_table_name === 'Users');

        if (correctConstraint && wrongConstraint) {
            console.log('\n🔧 AÇÃO RECOMENDADA:');
            console.log(`   1. Remover constraint incorreta: ${wrongConstraint.constraint_name}`);
            console.log(`   2. Manter constraint correta: ${correctConstraint.constraint_name}`);
            console.log('   3. Migrar dados da tabela "Users" para "users" se necessário');
            console.log('   4. Remover tabela "Users" duplicada');
        }

    } catch (error) {
        console.error('❌ Erro durante análise:', error.message);
    } finally {
        await sequelize.close();
    }
}

analiseCompleta(); 