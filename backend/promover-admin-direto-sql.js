const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
const adminEmail = 'rafaeldenovaes@gmail.com';

console.log('🔧 PROMOVENDO USUÁRIO A ADMIN - EXECUÇÃO DIRETA');
console.log('═══════════════════════════════════════════════');
console.log(`📧 Email: ${adminEmail}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }

    console.log('✅ Conectado ao banco');

    // Primeiro verificar se o usuário existe
    db.get("SELECT id, name, email, isAdmin FROM users WHERE email = ?", [adminEmail], (err, user) => {
        if (err) {
            console.error('❌ Erro na consulta:', err.message);
            db.close();
            process.exit(1);
        }

        if (!user) {
            console.log(`❌ Usuário ${adminEmail} não encontrado!`);
            console.log('💡 Usuário precisa se registrar primeiro');
            db.close();
            process.exit(1);
        }

        console.log(`✅ Usuário encontrado: ${user.name}`);
        console.log(`📊 Status admin atual: ${user.isAdmin ? 'SIM' : 'NÃO'}`);

        // Verificar se coluna isAdmin existe
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.error('❌ Erro ao verificar colunas:', err.message);
                db.close();
                process.exit(1);
            }

            const hasIsAdmin = columns.some(col => col.name === 'isAdmin');

            if (!hasIsAdmin) {
                console.log('🔧 Adicionando coluna isAdmin...');
                db.run("ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0", (err) => {
                    if (err) {
                        console.log('❌ Erro ao adicionar coluna:', err.message);
                        db.close();
                        process.exit(1);
                    }
                    console.log('✅ Coluna isAdmin adicionada');
                    promoverUsuario();
                });
            } else {
                promoverUsuario();
            }
        });

        function promoverUsuario() {
            console.log('🔧 Promovendo usuário a administrador...');

            db.run("UPDATE users SET isAdmin = 1 WHERE email = ?", [adminEmail], function (err) {
                if (err) {
                    console.error('❌ Erro ao promover:', err.message);
                    db.close();
                    process.exit(1);
                }

                if (this.changes === 0) {
                    console.log('❌ Nenhuma linha foi atualizada');
                    db.close();
                    process.exit(1);
                }

                console.log('✅ Usuário promovido com sucesso!');

                // Verificar resultado
                db.get("SELECT id, name, email, isAdmin FROM users WHERE email = ?", [adminEmail], (err, updatedUser) => {
                    if (err) {
                        console.error('❌ Erro na verificação:', err.message);
                    } else {
                        console.log('');
                        console.log('🎉 RESULTADO:');
                        console.log('════════════════════════════════');
                        console.log(`👑 ${updatedUser.email}`);
                        console.log(`📛 Nome: ${updatedUser.name}`);
                        console.log(`✅ É Admin: ${updatedUser.isAdmin ? 'SIM' : 'NÃO'}`);
                        console.log('');
                        console.log('🚀 PRÓXIMOS PASSOS:');
                        console.log('1. 🔄 Faça LOGOUT completo');
                        console.log('   - Abra console (F12)');
                        console.log('   - Digite: localStorage.clear()');
                        console.log('   - Pressione Enter');
                        console.log('');
                        console.log('2. 🔐 Faça LOGIN novamente');
                        console.log('   - Vá para: http://localhost:3000/analisar.html');
                        console.log(`   - Entre com: ${adminEmail}`);
                        console.log('');
                        console.log('3. 🌐 Acesse o painel admin');
                        console.log('   - Vá para: http://localhost:3000/admin.html');
                        console.log('   - Deve funcionar agora!');
                        console.log('');
                        console.log('⚠️ IMPORTANTE: O logout é obrigatório para');
                        console.log('   renovar o token JWT com as novas permissões!');
                    }

                    db.close((err) => {
                        if (err) {
                            console.error('❌ Erro ao fechar banco:', err.message);
                        } else {
                            console.log('');
                            console.log('✅ Processo concluído!');
                        }
                        process.exit(0);
                    });
                });
            });
        }
    });
}); 