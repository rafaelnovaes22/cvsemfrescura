// Script simples para consultar códigos de presente
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'database', 'dev.sqlite');

console.log('🔍 CONSULTANDO CÓDIGOS DE PRESENTE...');
console.log('═══════════════════════════════════════');
console.log(`📁 Banco de dados: ${dbPath}`);
console.log('');

// Abrir conexão com o banco
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar com o banco:', err.message);
        console.log('');
        console.log('💡 Possíveis soluções:');
        console.log('1. Execute: cd backend && npm start (para criar o banco)');
        console.log('2. Verifique se o servidor foi iniciado pelo menos uma vez');
        console.log('3. Execute: node inicializar-codigos-prod.js');
        return;
    }

    console.log('✅ Conectado ao banco SQLite');

    // Consultar códigos de presente
    const query = `
        SELECT 
            code,
            maxUses,
            usedCount,
            isActive,
            description,
            expiresAt,
            createdAt
        FROM gift_codes 
        ORDER BY createdAt DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Erro na consulta:', err.message);
            console.log('');
            console.log('💡 A tabela gift_codes pode não existir ainda.');
            console.log('Execute: node inicializar-codigos-prod.js para criar a estrutura');
        } else {
            console.log(`📊 Total de códigos encontrados: ${rows.length}`);
            console.log('');

            if (rows.length === 0) {
                console.log('❌ NENHUM CÓDIGO DE PRESENTE ENCONTRADO!');
                console.log('');
                console.log('💡 Para criar códigos:');
                console.log('1. Execute: node inicializar-codigos-prod.js');
                console.log('2. Ou acesse: http://localhost:3000/admin.html');
                console.log('3. Ou execute: node create-test-gift-code.js');
            } else {
                console.log('🎁 CÓDIGOS DE PRESENTE DISPONÍVEIS:');
                console.log('═══════════════════════════════════════');

                let ativos = 0;
                let disponiveis = 0;
                let esgotados = 0;
                let expirados = 0;

                rows.forEach((row, index) => {
                    const usosRestantes = row.maxUses - row.usedCount;
                    const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
                    const isExhausted = row.usedCount >= row.maxUses;

                    // Contadores
                    if (row.isActive) ativos++;
                    if (row.isActive && !isExpired && !isExhausted) disponiveis++;
                    if (isExhausted) esgotados++;
                    if (isExpired) expirados++;

                    // Status
                    let status = '✅ DISPONÍVEL';
                    let statusIcon = '🟢';

                    if (isExpired) {
                        status = '⏰ EXPIRADO';
                        statusIcon = '⏰';
                    } else if (isExhausted) {
                        status = '❌ ESGOTADO';
                        statusIcon = '🔴';
                    } else if (!row.isActive) {
                        status = '🔴 INATIVO';
                        statusIcon = '🔴';
                    }

                    const expiracao = row.expiresAt ?
                        new Date(row.expiresAt).toLocaleDateString('pt-BR') :
                        'Sem expiração';

                    const criacao = new Date(row.createdAt).toLocaleDateString('pt-BR');

                    console.log(`${index + 1}. ${statusIcon} ${row.code}`);
                    console.log(`   📊 Status: ${status}`);
                    console.log(`   🔢 Usos: ${row.usedCount}/${row.maxUses} (restam ${usosRestantes})`);
                    console.log(`   📅 Expira: ${expiracao}`);
                    console.log(`   📝 Descrição: ${row.description || 'Sem descrição'}`);
                    console.log(`   📍 Criado: ${criacao}`);
                    console.log('');
                });

                // Estatísticas
                console.log('📈 ESTATÍSTICAS:');
                console.log(`   🟢 Total: ${rows.length}`);
                console.log(`   ✅ Ativos: ${ativos}`);
                console.log(`   🎯 Disponíveis: ${disponiveis}`);
                console.log(`   🔴 Esgotados: ${esgotados}`);
                console.log(`   ⏰ Expirados: ${expirados}`);
                console.log('');

                // Códigos prontos para uso
                const codigosDisponiveis = rows.filter(row =>
                    row.isActive &&
                    row.usedCount < row.maxUses &&
                    (!row.expiresAt || new Date(row.expiresAt) > new Date())
                );

                if (codigosDisponiveis.length > 0) {
                    console.log('🚀 CÓDIGOS PRONTOS PARA USO:');
                    console.log('═══════════════════════════════');
                    codigosDisponiveis.forEach(row => {
                        const usosRestantes = row.maxUses - row.usedCount;
                        console.log(`✅ ${row.code} - ${usosRestantes} uso(s) restante(s)`);
                        console.log(`   🔗 http://localhost:3000/analisar.html?giftCode=${row.code}`);
                    });
                    console.log('');
                }
            }

            console.log('🔧 FERRAMENTAS:');
            console.log('═══════════════');
            console.log('🌐 Painel Admin: http://localhost:3000/admin.html');
            console.log('📊 Health Check: http://localhost:3000/health');
            console.log('🎯 Criar códigos: node create-test-gift-code.js');
        }

        // Fechar conexão
        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
            } else {
                console.log('');
                console.log('✅ Consulta concluída!');
            }
        });
    });
}); 