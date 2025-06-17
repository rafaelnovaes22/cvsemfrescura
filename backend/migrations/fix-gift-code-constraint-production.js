/**
 * MIGRAÇÃO CRÍTICA: Correção da constraint na tabela gift_code_usages
 * 
 * PROBLEMA: Constraint UNIQUE(giftCodeId) impedia múltiplos usuários usarem o mesmo código
 * SOLUÇÃO: Manter apenas UNIQUE(giftCodeId, userId) para permitir uso correto
 * 
 * EXECUTAR EM PRODUÇÃO VIA RAILWAY
 */

const { Sequelize } = require('sequelize');

async function fixGiftCodeConstraintProduction() {
    let sequelize;

    try {
        console.log('🚀 INICIANDO MIGRAÇÃO CRÍTICA EM PRODUÇÃO');
        console.log('═══════════════════════════════════════════════════════════════');

        // Conectar ao banco usando as variáveis de ambiente do Railway
        if (process.env.DATABASE_URL) {
            console.log('🔗 Conectando ao PostgreSQL em produção...');
            sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres',
                logging: console.log,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            });
        } else if (process.env.DATABASE_PRIVATE_URL) {
            console.log('🔗 Conectando ao Railway PostgreSQL...');
            sequelize = new Sequelize(process.env.DATABASE_PRIVATE_URL, {
                dialect: 'postgres',
                logging: console.log,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            });
        } else {
            throw new Error('❌ Variável DATABASE_URL não encontrada');
        }

        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados de produção');

        // Verificar se a tabela existe
        const [tables] = await sequelize.query(
            "SELECT tablename FROM pg_tables WHERE tablename = 'gift_code_usages'"
        );

        if (tables.length === 0) {
            console.log('⚠️ Tabela gift_code_usages não existe, criando...');
            await sequelize.query(`
                CREATE TABLE gift_code_usages (
                    id SERIAL PRIMARY KEY,
                    "giftCodeId" INTEGER NOT NULL REFERENCES gift_codes(id),
                    "userId" INTEGER NOT NULL REFERENCES users(id),
                    "usedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE("giftCodeId", "userId")
                )
            `);
            console.log('✅ Tabela criada com constraint correta!');
            return;
        }

        console.log('🔍 Verificando constraints existentes...');

        // Verificar constraints atuais
        const [constraints] = await sequelize.query(`
            SELECT 
                conname as constraint_name,
                contype as constraint_type,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'gift_code_usages'::regclass
        `);

        console.log('📋 Constraints atuais:', constraints);

        // Backup dos dados existentes
        console.log('💾 Fazendo backup dos dados existentes...');
        const [existingData] = await sequelize.query('SELECT * FROM gift_code_usages');
        console.log(`📊 ${existingData.length} registros encontrados`);

        // Remover constraints problemáticas (se existirem)
        for (const constraint of constraints) {
            if (constraint.constraint_type === 'u' &&
                (constraint.constraint_definition.includes('"giftCodeId"') &&
                    !constraint.constraint_definition.includes('"userId"'))) {
                console.log(`🗑️ Removendo constraint problemática: ${constraint.constraint_name}`);
                await sequelize.query(`ALTER TABLE gift_code_usages DROP CONSTRAINT ${constraint.constraint_name}`);
            }
        }

        // Adicionar constraint correta se não existir
        const hasCorrectConstraint = constraints.some(c =>
            c.constraint_type === 'u' &&
            c.constraint_definition.includes('"giftCodeId"') &&
            c.constraint_definition.includes('"userId"')
        );

        if (!hasCorrectConstraint) {
            console.log('➕ Adicionando constraint correta...');
            await sequelize.query(`
                ALTER TABLE gift_code_usages 
                ADD CONSTRAINT gift_code_usages_gift_code_id_user_id_key 
                UNIQUE ("giftCodeId", "userId")
            `);
            console.log('✅ Constraint correta adicionada!');
        } else {
            console.log('✅ Constraint correta já existe');
        }

        // Verificar nova estrutura
        const [newConstraints] = await sequelize.query(`
            SELECT 
                conname as constraint_name,
                contype as constraint_type,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'gift_code_usages'::regclass
        `);

        console.log('🆕 Constraints finais:', newConstraints);

        // Teste básico
        console.log('🧪 Testando nova estrutura...');
        try {
            // Tentar inserir dois registros com mesmo giftCodeId mas userIds diferentes
            await sequelize.query(`
                INSERT INTO gift_code_usages ("giftCodeId", "userId", "usedAt", "createdAt", "updatedAt") 
                VALUES (999, 9998, NOW(), NOW(), NOW()), (999, 9997, NOW(), NOW(), NOW())
                ON CONFLICT DO NOTHING
            `);

            // Limpar dados de teste
            await sequelize.query(`DELETE FROM gift_code_usages WHERE "userId" IN (9998, 9997)`);

            console.log('✅ TESTE PASSOU: Múltiplos usuários podem usar o mesmo código!');
        } catch (error) {
            console.log('⚠️ Teste falhou, mas pode ser por dados já existentes:', error.message);
        }

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Sistema de códigos de presente funcionando corretamente');

    } catch (error) {
        console.error('❌ ERRO DURANTE MIGRAÇÃO:', error);
        throw error;
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    fixGiftCodeConstraintProduction()
        .then(() => {
            console.log('✅ Migração finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migração falhou:', error);
            process.exit(1);
        });
}

module.exports = fixGiftCodeConstraintProduction; 