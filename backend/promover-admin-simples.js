const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco
const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Conectando ao banco SQLite...');
console.log('📍 Banco:', dbPath);

// Promover usuário a admin
const email = 'rafaeldenovaes@gmail.com';

db.run(`UPDATE users SET isAdmin = 1 WHERE email = ?`, [email], function (err) {
    if (err) {
        console.error('❌ Erro ao promover admin:', err.message);
    } else {
        console.log(`✅ Usuário ${email} promovido a admin!`);
        console.log(`📊 Linhas afetadas: ${this.changes}`);
    }

    // Verificar se funcionou
    db.get(`SELECT email, isAdmin FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) {
            console.error('❌ Erro ao verificar:', err.message);
        } else if (row) {
            console.log(`✅ Status atual do usuário:`, row);
        } else {
            console.log('❌ Usuário não encontrado!');
        }

        db.close(() => {
            console.log('🔒 Conexão fechada.');
        });
    });
}); 