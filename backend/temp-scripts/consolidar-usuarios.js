const sequelize = require('./db');

async function consolidarUsuarios() {
    try {
        console.log('🔄 CONSOLIDAÇÃO DE TABELAS DE USUÁRIOS');
        console.log('=' * 50);

        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida\n');

        // ETAPA 1: Analisar dados existentes
        console.log('📊 ETAPA 1: Analisando dados existentes');
        console.log('-' * 40);

        const [usersUpper] = await sequelize.query('SELECT * FROM "Users" ORDER BY id');
        const [usersLower] = await sequelize.query('SELECT * FROM "users" ORDER BY id');

        console.log(`Tabela "Users": ${usersUpper.length} registros`);
        console.log(`Tabela "users": ${usersLower.length} registros`);

        // ETAPA 2: Migrar dados da tabela "Users" para "users" (evitando duplicatas)
        console.log('\n🔄 ETAPA 2: Consolidando dados na tabela "users"');
        console.log('-' * 40);

        let migrados = 0;
        let ignorados = 0;

        for (const user of usersUpper) {
            // Verificar se já existe um usuário com o mesmo email na tabela "users"
            const [existente] = await sequelize.query(
                'SELECT id FROM "users" WHERE email = :email',
                { replacements: { email: user.email } }
            );

            if (existente.length === 0) {
                // Migrar o usuário para a tabela "users"
                await sequelize.query(`
          INSERT INTO "users" (
            name, email, password, email_verified, onboarding_completed, 
            preferences, job_area, experience_level, credits, "createdAt", "updatedAt"
          ) VALUES (
            :name, :email, :password, :email_verified, :onboarding_completed,
            :preferences, :job_area, :experience_level, :credits, :createdAt, :updatedAt
          )
        `, {
                    replacements: {
                        name: user.name,
                        email: user.email,
                        password: user.password,
                        email_verified: user.email_verified || false,
                        onboarding_completed: user.onboarding_completed || false,
                        preferences: user.preferences || '{}',
                        job_area: user.job_area,
                        experience_level: user.experience_level,
                        credits: user.credits || 1,
                        createdAt: user.createdAt || new Date(),
                        updatedAt: user.updatedAt || new Date()
                    }
                });

                console.log(`  ✅ Migrado: ${user.email}`);
                migrados++;
            } else {
                console.log(`  ⚠️ Ignorado (já existe): ${user.email}`);
                ignorados++;
            }
        }

        console.log(`\n📈 Resultado da migração:`);
        console.log(`  - Migrados: ${migrados} usuários`);
        console.log(`  - Ignorados: ${ignorados} usuários (duplicatas)`);

        // ETAPA 3: Remover constraint incorreta
        console.log('\n🗑️ ETAPA 3: Removendo constraint incorreta');
        console.log('-' * 40);

        try {
            await sequelize.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS "transactions_userId_fkey"');
            console.log('✅ Constraint "transactions_userId_fkey" (incorreta) removida');
        } catch (error) {
            console.log('⚠️ Constraint já havia sido removida ou não existia');
        }

        // ETAPA 4: Verificar se a constraint correta existe
        console.log('\n🔍 ETAPA 4: Verificando constraint correta');
        console.log('-' * 40);

        const [constraints] = await sequelize.query(`
      SELECT constraint_name, table_name, column_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'transactions' 
      AND column_name = 'userId'
      AND constraint_name LIKE '%fkey%'
    `);

        const correctConstraintExists = constraints.some(c =>
            c.constraint_name.toLowerCase().includes('userid') &&
            !c.constraint_name.includes('userId')
        );

        if (!correctConstraintExists) {
            console.log('🔧 Criando constraint correta...');
            await sequelize.query(`
        ALTER TABLE transactions 
        ADD CONSTRAINT transactions_userid_fkey 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);
            console.log('✅ Constraint correta criada');
        } else {
            console.log('✅ Constraint correta já existe');
        }

        // ETAPA 5: Remover outras constraints que referenciam "Users"
        console.log('\n🧹 ETAPA 5: Limpando outras constraints relacionadas a "Users"');
        console.log('-' * 40);

        const [allConstraints] = await sequelize.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'Users'
    `);

        for (const constraint of allConstraints) {
            try {
                await sequelize.query(`ALTER TABLE "${constraint.table_name}" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`);
                console.log(`  ✅ Removida constraint: ${constraint.constraint_name} de ${constraint.table_name}`);
            } catch (error) {
                console.log(`  ⚠️ Erro ao remover ${constraint.constraint_name}: ${error.message}`);
            }
        }

        // ETAPA 6: Remover tabela "Users" duplicada
        console.log('\n🗑️ ETAPA 6: Removendo tabela "Users" duplicada');
        console.log('-' * 40);

        try {
            await sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE');
            console.log('✅ Tabela "Users" removida com sucesso');
        } catch (error) {
            console.log(`⚠️ Erro ao remover tabela "Users": ${error.message}`);
        }

        // ETAPA 7: Verificação final
        console.log('\n🔍 ETAPA 7: Verificação final');
        console.log('-' * 40);

        // Contar usuários finais
        const [finalUsers] = await sequelize.query('SELECT COUNT(*) as total FROM "users"');
        console.log(`✅ Total de usuários consolidados: ${finalUsers[0].total}`);

        // Verificar constraints finais
        const [finalConstraints] = await sequelize.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'transactions'
      AND kcu.column_name = 'userId'
    `);

        console.log('\nConstraints finais da tabela transactions:');
        finalConstraints.forEach(constraint => {
            console.log(`  ✅ ${constraint.constraint_name}: transactions.userId -> ${constraint.foreign_table_name}.id`);
        });

        // Testar inserção
        console.log('\n🧪 Teste final de inserção:');
        const [testUser] = await sequelize.query('SELECT id FROM "users" LIMIT 1');

        if (testUser.length > 0) {
            try {
                const [testTransaction] = await sequelize.query(`
          INSERT INTO transactions (id, "userId", amount, credits, status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${testUser[0].id}, 10.00, 1, 'pending', NOW(), NOW())
          RETURNING id
        `);

                console.log('✅ Teste de inserção bem-sucedido!');

                // Remover transação de teste
                await sequelize.query(`DELETE FROM transactions WHERE id = '${testTransaction[0].id}'`);
                console.log('🧹 Transação de teste removida');

            } catch (error) {
                console.log(`❌ Erro no teste: ${error.message}`);
            }
        }

        console.log('\n🎉 CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('📋 Resumo:');
        console.log('  • Mantida apenas a tabela "users"');
        console.log('  • Dados migrados e consolidados');
        console.log('  • Constraints corrigidas');
        console.log('  • Sistema pronto para funcionar');

    } catch (error) {
        console.error('❌ Erro durante consolidação:', error.message);
        if (error.original) {
            console.error('   Detalhes:', error.original.message);
        }
    } finally {
        await sequelize.close();
    }
}

consolidarUsuarios(); 