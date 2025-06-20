// Verificação final de códigos de presente
console.log('='.repeat(50));
console.log('🎁 VERIFICAÇÃO DE CÓDIGOS DE PRESENTE');
console.log('='.repeat(50));

try {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');

    const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
    console.log('📁 Banco:', dbPath);

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.log('❌ ERRO:', err.message);
            process.exit(1);
        }

        console.log('✅ Conectado ao banco');

        // Verificar se a tabela existe
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='gift_codes'", (err, row) => {
            if (err) {
                console.log('❌ Erro ao verificar tabela:', err.message);
                db.close();
                return;
            }

            if (!row) {
                console.log('❌ Tabela gift_codes não existe');
                console.log('💡 Execute: node create-test-gift-code.js');
                db.close();
                return;
            }

            console.log('✅ Tabela gift_codes encontrada');

            // Buscar códigos
            db.all("SELECT * FROM gift_codes ORDER BY createdAt DESC", (err, rows) => {
                if (err) {
                    console.log('❌ Erro na consulta:', err.message);
                } else {
                    console.log('📊 Total de códigos:', rows.length);
                    console.log('');

                    if (rows.length === 0) {
                        console.log('❌ NENHUM CÓDIGO ENCONTRADO!');
                        console.log('');
                        console.log('💡 Para criar códigos:');
                        console.log('   node create-test-gift-code.js');
                        console.log('   http://localhost:3000/admin.html');
                    } else {
                        console.log('🎁 CÓDIGOS DISPONÍVEIS:');
                        console.log('-'.repeat(40));

                        let disponiveis = 0;

                        rows.forEach((row, i) => {
                            const restantes = row.maxUses - row.usedCount;
                            const ativo = row.isActive ? '✅' : '❌';
                            const disponivel = restantes > 0 && row.isActive;

                            if (disponivel) disponiveis++;

                            console.log(`${i + 1}. ${ativo} ${row.code}`);
                            console.log(`   Usos: ${row.usedCount}/${row.maxUses} (${restantes} restantes)`);
                            console.log(`   Status: ${row.isActive ? 'ATIVO' : 'INATIVO'}`);
                            console.log(`   Descrição: ${row.description || 'N/A'}`);

                            if (row.expiresAt) {
                                const expira = new Date(row.expiresAt).toLocaleDateString();
                                console.log(`   Expira: ${expira}`);
                            }

                            if (disponivel) {
                                console.log(`   🔗 http://localhost:3000/analisar.html?giftCode=${row.code}`);
                            }

                            console.log('');
                        });

                        console.log('📈 RESUMO:');
                        console.log(`   Total: ${rows.length}`);
                        console.log(`   Disponíveis: ${disponiveis}`);
                        console.log(`   Ativos: ${rows.filter(r => r.isActive).length}`);
                    }
                }

                db.close();
                console.log('✅ Consulta finalizada');
            });
        });
    });

} catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
    console.log('💡 Execute: npm install sqlite3');
} 