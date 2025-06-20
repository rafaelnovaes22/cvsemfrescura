// Script direto para promover usuário a admin
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');

console.log('🔧 PROMOVENDO USUÁRIO A ADMINISTRADOR...');
console.log('═══════════════════════════════════════');

// Abrir banco em modo de escrita
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log('❌ Erro ao conectar:', err.message);
        return;
    }

    console.log('✅ Conectado ao banco SQLite');

    // Primeiro, verificar se a coluna isAdmin existe
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.log('❌ Erro ao verificar estrutura:', err.message);
            db.close();
            return;
        }

        const hasIsAdmin = columns.some(col => col.name === 'isAdmin');

        if (!hasIsAdmin) {
            console.log('❌ Coluna isAdmin não existe!');
            console.log('🔧 Adicionando coluna isAdmin...');

            db.run("ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0", (err) => {
                if (err) {
                    console.log('❌ Erro ao adicionar coluna:', err.message);
                    db.close();
                    return;
                }

                console.log('✅ Coluna isAdmin adicionada!');
                promoverUsuario();
            });
        } else {
            console.log('✅ Coluna isAdmin já existe');
            promoverUsuario();
        }
    });

    function promoverUsuario() {
        // Buscar todos os usuários
        db.all("SELECT id, name, email, isAdmin, createdAt FROM users ORDER BY createdAt DESC", (err, users) => {
            if (err) {
                console.log('❌ Erro ao buscar usuários:', err.message);
                db.close();
                return;
            }

            console.log('');
            console.log(`📊 Usuários encontrados: ${users.length}`);

            if (users.length === 0) {
                console.log('❌ Nenhum usuário encontrado!');
                console.log('💡 Registre-se primeiro em: http://localhost:3000/analisar.html');
                db.close();
                return;
            }

            // Verificar se já há admin
            const adminCount = users.filter(u => u.isAdmin).length;
            console.log(`👑 Administradores atuais: ${adminCount}`);

            if (adminCount > 0) {
                console.log('');
                console.log('✅ JÁ EXISTEM ADMINISTRADORES:');
                users.filter(u => u.isAdmin).forEach(admin => {
                    console.log(`   👑 ${admin.email} (${admin.name})`);
                });

                console.log('');
                console.log('🔍 DIAGNÓSTICO DO PROBLEMA:');
                console.log('Se o painel admin não abre mesmo logado:');
                console.log('');
                console.log('1. 🔄 Faça LOGOUT completo');
                console.log('2. 🧹 Limpe cache do navegador');
                console.log('3. 🔐 Faça LOGIN novamente');
                console.log('4. 🌐 Acesse: http://localhost:3000/admin.html');
                console.log('');
                console.log('5. 🕵️ Se ainda não funcionar, abra F12 e veja erros no console');

            } else {
                // Promover o usuário mais recente
                const userToPromote = users[0];
                console.log('');
                console.log(`🔧 Promovendo usuário mais recente: ${userToPromote.email}`);

                db.run("UPDATE users SET isAdmin = 1 WHERE id = ?", [userToPromote.id], function (err) {
                    if (err) {
                        console.log('❌ Erro ao promover usuário:', err.message);
                    } else {
                        console.log('✅ Usuário promovido com sucesso!');
                        console.log('');
                        console.log('🎉 PROBLEMA RESOLVIDO!');
                        console.log('─'.repeat(30));
                        console.log(`👑 ${userToPromote.email} agora é ADMINISTRADOR`);
                        console.log('');
                        console.log('🚀 PRÓXIMOS PASSOS:');
                        console.log('1. Faça LOGOUT se estiver logado');
                        console.log('2. Faça LOGIN novamente');
                        console.log('3. Acesse: http://localhost:3000/admin.html');
                        console.log('4. O painel deve abrir normalmente');
                    }

                    db.close();
                });
            }
        });
    }
}); 