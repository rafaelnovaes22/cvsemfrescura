const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
console.log('🔍 Verificando banco REAL:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco SQLite REAL');
});

// Listar todas as tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
    if (err) {
        console.error('❌ Erro ao listar tabelas:', err.message);
        return;
    }

    console.log('\n📊 TABELAS EXISTENTES NO BANCO REAL:');
    if (rows.length === 0) {
        console.log('❌ Nenhuma tabela encontrada');
    } else {
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });
    }

    // Verificar especificamente AnalysisResults
    const analysisTableExists = rows.find(row => row.name === 'AnalysisResults');
    if (analysisTableExists) {
        console.log('\n🎉 TABELA AnalysisResults ENCONTRADA!');

        // Contar registros
        db.get("SELECT COUNT(*) as count FROM AnalysisResults;", [], (err, result) => {
            if (err) {
                console.error('❌ Erro ao contar análises:', err.message);
            } else {
                console.log(`📊 Total de análises na tabela: ${result.count}`);

                if (result.count > 0) {
                    // Mostrar algumas análises
                    db.all("SELECT id, userId, resumeFileName, createdAt FROM AnalysisResults ORDER BY createdAt DESC LIMIT 5;", [], (err, analyses) => {
                        if (err) {
                            console.error('❌ Erro ao buscar análises:', err.message);
                        } else {
                            console.log('\n🔍 ÚLTIMAS ANÁLISES ENCONTRADAS:');
                            analyses.forEach((analysis, index) => {
                                console.log(`${index + 1}. ID: ${analysis.id}, User: ${analysis.userId}, Arquivo: ${analysis.resumeFileName}, Data: ${analysis.createdAt}`);
                            });

                            // Verificar uma análise específica
                            db.get("SELECT result FROM AnalysisResults WHERE userId = 1 ORDER BY createdAt DESC LIMIT 1;", [], (err, row) => {
                                if (err) {
                                    console.error('❌ Erro ao buscar análise:', err.message);
                                } else if (row) {
                                    try {
                                        const result = JSON.parse(row.result);
                                        console.log('\n📋 CONTEÚDO DA ANÁLISE MAIS RECENTE:');
                                        console.log('✅ Campos encontrados:', Object.keys(result));
                                        console.log('✅ Tem conclusão:', !!result.conclusion);
                                        console.log('✅ Tem resumo:', !!result.resumo);
                                        console.log('✅ Tem experiência:', !!result.experiencia_profissional);
                                        if (result.conclusion) {
                                            console.log('📝 Conclusão (100 chars):', result.conclusion.substring(0, 100) + '...');
                                        }
                                    } catch (e) {
                                        console.error('❌ Erro ao fazer parse:', e.message);
                                    }
                                }

                                db.close();
                            });
                        }
                    });
                } else {
                    db.close();
                }
            }
        });
    } else {
        console.log('\n❌ Tabela AnalysisResults NÃO encontrada!');
        db.close();
    }
});
