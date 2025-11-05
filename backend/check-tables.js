const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('🔍 Verificando banco:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco SQLite');
});

// Listar todas as tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
    if (err) {
        console.error('❌ Erro ao listar tabelas:', err.message);
        return;
    }

    console.log('\n📊 TABELAS EXISTENTES NO BANCO:');
    if (rows.length === 0) {
        console.log('❌ Nenhuma tabela encontrada - banco vazio!');
    } else {
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });
    }

    // Verificar esquema de cada tabela
    console.log('\n🔍 ESQUEMA DAS TABELAS:');
    let processed = 0;

    if (rows.length === 0) {
        db.close();
        return;
    }

    rows.forEach((row) => {
        db.all(`PRAGMA table_info(${row.name});`, [], (err, columns) => {
            processed++;

            if (err) {
                console.error(`❌ Erro ao verificar ${row.name}:`, err.message);
            } else {
                console.log(`\n--- Tabela: ${row.name} ---`);
                columns.forEach(col => {
                    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                });

                // Contar registros
                db.get(`SELECT COUNT(*) as count FROM ${row.name};`, [], (err, result) => {
                    if (err) {
                        console.log(`  ❌ Erro ao contar registros: ${err.message}`);
                    } else {
                        console.log(`  📊 Registros: ${result.count}`);
                    }

                    if (processed === rows.length) {
                        db.close((err) => {
                            if (err) {
                                console.error('❌ Erro ao fechar banco:', err.message);
                            } else {
                                console.log('\n✅ Verificação concluída');
                            }
                        });
                    }
                });
            }
        });
    });
});
