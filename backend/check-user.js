const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
console.log('🔍 Verificando usuário no banco:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco');
    
    // Verificar usuários
    db.all("SELECT id, email, name FROM users;", [], (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar usuários:', err.message);
        } else {
            console.log(`📊 Total de usuários: ${rows.length}`);
            
            if (rows.length > 0) {
                console.log('\n👥 USUÁRIOS ENCONTRADOS:');
                rows.forEach((user, index) => {
                    console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Nome: ${user.name || 'sem nome'}`);
                });
                
                // Verificar se Rafael existe
                const rafael = rows.find(u => u.email === 'rafaeldenoves@gmail.com');
                if (rafael) {
                    console.log(`\n✅ Rafael encontrado! ID: ${rafael.id}`);
                } else {
                    console.log('\n❌ Rafael não encontrado com este email');
                    // Buscar emails similares
                    const similar = rows.filter(u => u.email.includes('rafael'));
                    if (similar.length > 0) {
                        console.log('🔍 Emails similares encontrados:');
                        similar.forEach(u => console.log(`   - ${u.email}`));
                    }
                }
            } else {
                console.log('❌ Nenhum usuário encontrado no banco');
            }
        }
        
        db.close();
    });
});
