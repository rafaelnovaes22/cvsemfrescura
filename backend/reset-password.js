const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');

async function resetPassword() {
    console.log('🔧 Resetando senha do usuário Rafael...');
    
    // Hash da nova senha
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erro ao conectar:', err.message);
            return;
        }
        console.log('✅ Conectado ao banco');
        
        // Atualizar senha
        db.run(
            "UPDATE users SET password = ? WHERE email = ?",
            [hashedPassword, 'rafaeldenovaes@gmail.com'],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao atualizar senha:', err.message);
                } else {
                    console.log(`✅ Senha atualizada! Linhas afetadas: ${this.changes}`);
                    if (this.changes > 0) {
                        console.log('🔑 Nova senha: 123456');
                        console.log('📧 Email: rafaeldenovaes@gmail.com');
                    } else {
                        console.log('❌ Nenhum usuário foi atualizado');
                    }
                }
                
                db.close();
            }
        );
    });
}

resetPassword().catch(console.error);
