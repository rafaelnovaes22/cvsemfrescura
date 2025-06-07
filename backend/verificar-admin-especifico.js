const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
const targetEmail = 'rafaeldenovaes@gmail.com';

console.log('🔍 VERIFICANDO USUÁRIO ADMINISTRADOR ESPECÍFICO...');
console.log('═══════════════════════════════════════════════════');
console.log(`📧 Email: ${targetEmail}`);
console.log('');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('❌ Erro ao conectar:', err.message);
        return;
    }

    console.log('✅ Conectado ao banco SQLite');

    // Buscar usuário específico
    db.get(`
        SELECT 
            id,
            name,
            email,
            isAdmin,
            email_verified,
            onboarding_completed,
            last_login,
            createdAt,
            updatedAt
        FROM users 
        WHERE email = ?
    `, [targetEmail], (err, user) => {
        if (err) {
            console.log('❌ Erro na consulta:', err.message);
            db.close();
            return;
        }

        if (!user) {
            console.log(`❌ Usuário ${targetEmail} não encontrado!`);
            console.log('');
            console.log('💡 POSSÍVEIS CAUSAS:');
            console.log('• Email digitado incorretamente');
            console.log('• Usuário não está registrado no sistema');
            console.log('• Banco de dados foi resetado');
            console.log('');
            console.log('🔧 SOLUÇÕES:');
            console.log('1. Verifique se o email está correto');
            console.log('2. Registre-se novamente: http://localhost:3000/analisar.html');
            console.log('3. Ou crie admin: node create-admin-user.js rafaeldenovaes@gmail.com --create');
        } else {
            console.log('✅ USUÁRIO ENCONTRADO!');
            console.log('─'.repeat(50));
            console.log(`📛 Nome: ${user.name}`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`👑 É Admin: ${user.isAdmin ? 'SIM ✅' : 'NÃO ❌'}`);
            console.log(`✉️ Email verificado: ${user.email_verified ? 'SIM' : 'NÃO'}`);
            console.log(`🎯 Onboarding: ${user.onboarding_completed ? 'COMPLETO' : 'PENDENTE'}`);
            console.log(`🕐 Último login: ${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}`);
            console.log(`📅 Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
            console.log('');

            // Diagnóstico detalhado
            if (!user.isAdmin) {
                console.log('⚠️ PROBLEMA IDENTIFICADO:');
                console.log('❌ Usuário NÃO tem permissões de administrador!');
                console.log('');
                console.log('🔧 SOLUÇÃO:');
                console.log(`Execute: node create-admin-user.js ${targetEmail}`);
            } else {
                console.log('✅ PERMISSÕES OK - USUÁRIO É ADMINISTRADOR');
                console.log('');
                console.log('🔍 DIAGNÓSTICO DO PROBLEMA DE ACESSO:');
                console.log('');
                console.log('Se o painel admin não abre mesmo logado, possíveis causas:');
                console.log('');
                console.log('1. 🔑 TOKEN JWT EXPIRADO:');
                console.log('   • Token pode ter expirado (padrão: 7 dias)');
                console.log('   • Faça logout e login novamente');
                console.log('   • Verifique no console: localStorage.getItem("token")');
                console.log('');
                console.log('2. 🧹 CACHE DO NAVEGADOR:');
                console.log('   • Limpe cache completo (Ctrl+Shift+Del)');
                console.log('   • Ou abra em aba anônima/privada');
                console.log('   • Execute: localStorage.clear()');
                console.log('');
                console.log('3. 🌐 PROBLEMAS DE REDE/API:');
                console.log('   • Verifique se servidor está rodando');
                console.log('   • Teste: http://localhost:3000/health');
                console.log('   • Teste API: http://localhost:3000/api/admin/dashboard');
                console.log('');
                console.log('4. 🐛 ERROS JAVASCRIPT:');
                console.log('   • Abra console do navegador (F12)');
                console.log('   • Procure por erros em vermelho');
                console.log('   • Verifique se há bloqueios de CORS');
                console.log('');
                console.log('🚀 PROCEDIMENTO DE TESTE MANUAL:');
                console.log('══════════════════════════════════════');
                console.log('1. Abra uma aba anônima');
                console.log('2. Vá para: http://localhost:3000/analisar.html');
                console.log(`3. Faça login com: ${targetEmail}`);
                console.log('4. Após login, acesse: http://localhost:3000/admin.html');
                console.log('5. Abra F12 e verifique erros no console');
                console.log('');
                console.log('💻 TESTE DA API NO CONSOLE DO NAVEGADOR:');
                console.log('```javascript');
                console.log('// Cole este código no console após fazer login');
                console.log('fetch("/api/admin/dashboard", {');
                console.log('  headers: {');
                console.log('    "Authorization": `Bearer ${localStorage.getItem("token")}`');
                console.log('  }');
                console.log('}).then(r => r.json()).then(console.log);');
                console.log('```');
                console.log('');
                console.log('📊 RESPOSTA ESPERADA:');
                console.log('• Status 200: {"totalCodes": X, "activeCodes": Y, ...}');
                console.log('• Status 401: Token inválido ou expirado');
                console.log('• Status 403: Usuário não é admin (não deveria acontecer)');
                console.log('• Status 500: Erro no servidor');
            }
        }

        db.close((err) => {
            if (err) {
                console.log('❌ Erro ao fechar banco:', err.message);
            } else {
                console.log('');
                console.log('✅ Diagnóstico finalizado!');
                console.log('');
                console.log('🔗 LINKS ÚTEIS:');
                console.log('──────────────────────────────────────');
                console.log('🌐 Login: http://localhost:3000/analisar.html');
                console.log('👑 Admin: http://localhost:3000/admin.html');
                console.log('🏥 Health: http://localhost:3000/health');
                console.log('📊 Dashboard API: http://localhost:3000/api/admin/dashboard');
            }
        });
    });
}); 