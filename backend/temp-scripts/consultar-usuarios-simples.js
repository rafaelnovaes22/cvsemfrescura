const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');

console.log('🔍 CONSULTANDO USUÁRIOS NO BANCO...');
console.log('═══════════════════════════════════');
console.log(`📁 Banco: ${dbPath}`);
console.log('');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('❌ ERRO ao conectar:', err.message);
        return;
    }

    console.log('✅ Conectado ao banco SQLite');

    // Primeiro, verificar se a tabela users existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
            console.log('❌ Erro ao verificar tabela:', err.message);
            db.close();
            return;
        }

        if (!row) {
            console.log('❌ Tabela users não existe!');
            console.log('💡 Execute primeiro: npm start (para criar tabelas)');
            db.close();
            return;
        }

        console.log('✅ Tabela users encontrada');

        // Verificar estrutura da tabela
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.log('❌ Erro ao verificar colunas:', err.message);
                db.close();
                return;
            }

            console.log('');
            console.log('🏗️ ESTRUTURA DA TABELA USERS:');
            console.log('─'.repeat(40));

            let hasIsAdmin = false;
            columns.forEach(col => {
                console.log(`📋 ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
                if (col.name === 'isAdmin') hasIsAdmin = true;
            });

            if (!hasIsAdmin) {
                console.log('');
                console.log('⚠️ PROBLEMA IDENTIFICADO:');
                console.log('❌ Coluna isAdmin NÃO EXISTE!');
                console.log('');
                console.log('💡 SOLUÇÃO:');
                console.log('Execute: cd backend && node fix-admin-migration.js');
                db.close();
                return;
            }

            console.log('');
            console.log('✅ Coluna isAdmin encontrada');
            console.log('');

            // Buscar todos os usuários
            const query = `
                SELECT 
                    id, 
                    name, 
                    email, 
                    isAdmin, 
                    createdAt,
                    last_login
                FROM users 
                ORDER BY createdAt DESC
            `;

            db.all(query, (err, users) => {
                if (err) {
                    console.log('❌ Erro na consulta:', err.message);
                    db.close();
                    return;
                }

                console.log(`📊 TOTAL DE USUÁRIOS: ${users.length}`);
                console.log('');

                if (users.length === 0) {
                    console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
                    console.log('');
                    console.log('💡 SOLUÇÕES:');
                    console.log('1. Registre-se em: http://localhost:3000/analisar.html');
                    console.log('2. Ou crie um admin: node create-admin-user.js admin@test.com --create');
                } else {
                    console.log('👥 USUÁRIOS CADASTRADOS:');
                    console.log('─'.repeat(50));

                    let adminCount = 0;

                    users.forEach((user, index) => {
                        const isAdmin = Boolean(user.isAdmin);
                        const adminBadge = isAdmin ? '👑 ADMIN' : '👤 USER';
                        const lastLogin = user.last_login ?
                            new Date(user.last_login).toLocaleDateString('pt-BR') :
                            'Nunca';
                        const created = new Date(user.createdAt).toLocaleDateString('pt-BR');

                        console.log(`${index + 1}. ${adminBadge} ${user.email}`);
                        console.log(`   📛 Nome: ${user.name}`);
                        console.log(`   🔐 Admin: ${isAdmin ? 'SIM' : 'NÃO'}`);
                        console.log(`   📅 Criado: ${created}`);
                        console.log(`   🕐 Último login: ${lastLogin}`);
                        console.log('');

                        if (isAdmin) adminCount++;
                    });

                    console.log('📈 ESTATÍSTICAS:');
                    console.log(`   👑 Administradores: ${adminCount}`);
                    console.log(`   👤 Usuários normais: ${users.length - adminCount}`);
                    console.log('');

                    if (adminCount === 0) {
                        console.log('⚠️ PROBLEMA CRÍTICO:');
                        console.log('❌ NENHUM USUÁRIO TEM PERMISSÕES DE ADMIN!');
                        console.log('');
                        console.log('🔧 SOLUÇÃO RÁPIDA:');

                        const lastUser = users[0]; // Usuário mais recente
                        console.log(`Promover ${lastUser.email} a administrador:`);
                        console.log('');
                        console.log(`cd backend && node create-admin-user.js ${lastUser.email}`);
                        console.log('');
                        console.log('🚀 DEPOIS:');
                        console.log('1. Faça logout no navegador');
                        console.log('2. Faça login novamente');
                        console.log('3. Acesse: http://localhost:3000/admin.html');

                    } else {
                        console.log('✅ SISTEMA OK - TEM ADMINISTRADOR(ES)');
                        console.log('');
                        console.log('🔍 SE O PAINEL ADMIN NÃO ABRE:');
                        console.log('');
                        console.log('1. 🔐 Verifique se está logado com conta de admin');
                        console.log('2. 🧹 Limpe cache do navegador');
                        console.log('3. 🔄 Faça logout e login novamente');
                        console.log('4. 🕵️ Abra console do navegador (F12) para ver erros');
                        console.log('');

                        const adminUsers = users.filter(u => Boolean(u.isAdmin));
                        console.log('👑 CONTAS DE ADMINISTRADOR:');
                        adminUsers.forEach(admin => {
                            console.log(`   ✅ ${admin.email} (${admin.name})`);
                        });
                    }
                }

                console.log('');
                console.log('🔗 LINKS IMPORTANTES:');
                console.log('═════════════════════════════════');
                console.log('🌐 Painel Admin: http://localhost:3000/admin.html');
                console.log('🔐 Login: http://localhost:3000/analisar.html');
                console.log('🏥 Health: http://localhost:3000/health');

                db.close((err) => {
                    if (err) {
                        console.log('❌ Erro ao fechar banco:', err.message);
                    } else {
                        console.log('');
                        console.log('✅ Consulta finalizada!');
                    }
                });
            });
        });
    });
}); 