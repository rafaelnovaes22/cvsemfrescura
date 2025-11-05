const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
console.log('🔍 Verificando análises no banco:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco REAL');
    
    // Contar análises
    db.get("SELECT COUNT(*) as count FROM AnalysisResults;", [], (err, result) => {
        if (err) {
            console.error('❌ Erro ao contar:', err.message);
        } else {
            console.log(`📊 Total de análises: ${result.count}`);
            
            if (result.count > 0) {
                // Mostrar as análises
                db.all("SELECT id, userId, resumeFileName, createdAt FROM AnalysisResults ORDER BY createdAt DESC;", [], (err, rows) => {
                    if (err) {
                        console.error('❌ Erro ao buscar análises:', err.message);
                    } else {
                        console.log('\n🔍 TODAS AS ANÁLISES:');
                        rows.forEach((row, index) => {
                            console.log(`${index + 1}. ID: ${row.id}, User: ${row.userId}, Arquivo: ${row.resumeFileName || 'sem nome'}, Data: ${row.createdAt}`);
                        });
                        
                        // Verificar uma análise específica do usuário 1
                        db.get("SELECT id, result FROM AnalysisResults WHERE userId = 1 ORDER BY createdAt DESC LIMIT 1;", [], (err, row) => {
                            if (err) {
                                console.error('❌ Erro ao buscar análise do usuário 1:', err.message);
                            } else if (row) {
                                console.log(`\n📋 ANÁLISE DO USUÁRIO 1 (ID: ${row.id}):`);
                                console.log('📄 Tamanho do result:', row.result.length, 'caracteres');
                                console.log('📄 Primeiros 200 chars:', row.result.substring(0, 200));
                                
                                try {
                                    const result = JSON.parse(row.result);
                                    console.log('✅ JSON válido');
                                    console.log('🔑 Chaves encontradas:', Object.keys(result));
                                } catch (e) {
                                    console.error('❌ JSON inválido:', e.message);
                                }
                            } else {
                                console.log('❌ Nenhuma análise encontrada para usuário 1');
                            }
                            
                            db.close();
                        });
                    }
                });
            } else {
                console.log('❌ Nenhuma análise encontrada no banco');
                db.close();
            }
        }
    });
});
