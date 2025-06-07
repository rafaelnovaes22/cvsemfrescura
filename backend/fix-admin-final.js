const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');

console.log('🔧 CORRIGINDO PERMISSÕES DE ADMINISTRADOR...');
console.log('═══════════════════════════════════════════');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log('❌ Erro:', err.message);
        return;
    }

    console.log('✅ Conectado ao banco');

    // Primeiro, verificar se há usuários
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.log('❌ Erro ao contar usuários:', err.message);
            db.close();
            return;
        }

        if (row.count === 0) {
            console.log('❌ Nenhum usuário encontrado!');
            console.log('💡 Registre-se primeiro em: http://localhost:3000/analisar.html');
            db.close();
            return;
        }

        console.log(`📊 ${row.count} usuário(s) encontrado(s)`);

        // Verificar se coluna isAdmin existe
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.log('❌ Erro ao verificar colunas:', err.message);
                db.close();
                return;
            }

            const hasIsAdmin = columns.some(col => col.name === 'isAdmin');

            if (!hasIsAdmin) {
                console.log('🔧 Adicionando coluna isAdmin...');
                db.run("ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0", (err) => {
                    if (err) {
                        console.log('❌ Erro ao adicionar coluna:', err.message);
                        db.close();
                        return;
                    }
                    console.log('✅ Coluna isAdmin adicionada');
                    promoverAdmin();
                });
            } else {
                console.log('✅ Coluna isAdmin já existe');
                promoverAdmin();
            }
        });
    });

    function promoverAdmin() {
        // Promover usuário mais recente
        db.run(`
            UPDATE users 
            SET isAdmin = 1 
            WHERE id = (
                SELECT id 
                FROM users 
                ORDER BY createdAt DESC 
                LIMIT 1
            )
        `, (err) => {
            if (err) {
                console.log('❌ Erro ao promover:', err.message);
                db.close();
                return;
            }

            console.log('✅ Usuário promovido a admin!');

            // Verificar resultado
            db.all(`
                SELECT 
                    id,
                    name,
                    email,
                    isAdmin,
                    createdAt
                FROM users 
                ORDER BY createdAt DESC
            `, (err, users) => {
                if (err) {
                    console.log('❌ Erro ao verificar:', err.message);
                } else {
                    console.log('');
                    console.log('👥 USUÁRIOS ATUALIZADOS:');
                    console.log('─'.repeat(40));

                    users.forEach(user => {
                        const badge = user.isAdmin ? '👑 ADMIN' : '👤 USER';
                        console.log(`${badge} ${user.email} (${user.name})`);
                    });

                    const adminUser = users.find(u => u.isAdmin);
                    if (adminUser) {
                        console.log('');
                        console.log('🎉 PROBLEMA RESOLVIDO!');
                        console.log('═══════════════════════');
                        console.log(`👑 ${adminUser.email} agora é ADMINISTRADOR`);
                        console.log('');
                        console.log('🚀 PRÓXIMOS PASSOS:');
                        console.log('1. 🔄 Faça LOGOUT completo no navegador');
                        console.log('2. 🔐 Faça LOGIN novamente');
                        console.log('3. 🌐 Acesse: http://localhost:3000/admin.html');
                        console.log('4. ✅ O painel deve abrir normalmente');
                        console.log('');
                        console.log('💡 Se ainda não funcionar:');
                        console.log('• Limpe cache do navegador (Ctrl+Shift+Del)');
                        console.log('• Abra em aba anônima');
                        console.log('• Verifique console do navegador (F12)');
                    }
                }

                db.close();
            });
        });
    }
}); 