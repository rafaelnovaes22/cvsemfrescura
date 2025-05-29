// Script para gerar código de sorteio único - sem conexão de banco
// Execute este script para gerar o código e depois crie manualmente no sistema

function generateSorteioCode() {
    // Gerar código único para sorteio
    const sorteioCode = 'SORTEIO' + Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log('🎁 CÓDIGO DE PRESENTE PARA SORTEIO GERADO');
    console.log('='.repeat(50));
    console.log('');
    console.log('📋 CÓDIGO GERADO:', sorteioCode);
    console.log('');
    console.log('🎯 CONFIGURAÇÕES:');
    console.log('   - Máximo de usos: 1 (APENAS UMA PESSOA PODE USAR)');
    console.log('   - Expira em: Nunca');
    console.log('   - Status: Ativo');
    console.log('   - Descrição: "Código de sorteio - uso único"');
    console.log('');
    console.log('🔧 COMO CRIAR NO SISTEMA:');
    console.log('');
    console.log('1. Opção 1 - Via API (Postman/curl):');
    console.log('   POST /api/gift-code/create');
    console.log('   Headers: Authorization: Bearer [SEU_TOKEN_ADMIN]');
    console.log('   Body: {');
    console.log(`     "code": "${sorteioCode}",`);
    console.log('     "maxUses": 1,');
    console.log('     "description": "Código de sorteio - uso único"');
    console.log('   }');
    console.log('');
    console.log('2. Opção 2 - Direto no banco PostgreSQL:');
    console.log('   INSERT INTO gift_codes (');
    console.log('     code, description, "isActive", "usedCount", "maxUses", "expiresAt", "createdAt", "updatedAt"');
    console.log('   ) VALUES (');
    console.log(`     '${sorteioCode}',`);
    console.log('     \'Código de sorteio - uso único\',');
    console.log('     true,');
    console.log('     0,');
    console.log('     1,');
    console.log('     NULL,');
    console.log('     NOW(),');
    console.log('     NOW()');
    console.log('   );');
    console.log('');
    console.log('📱 COMO USAR:');
    console.log(`   URL: https://cvsemfrescura.com.br/analisar?giftCode=${sorteioCode}`);
    console.log(`   Manual: Digite "${sorteioCode}" na página de análise`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Este código pode ser usado APENAS 1 vez');
    console.log('   - A primeira pessoa que usar ganha 1 análise gratuita');
    console.log('   - Após o uso, o código fica indisponível automaticamente');
    console.log('   - O sistema já está preparado para códigos únicos');
    console.log('');
    console.log('🎲 PARA O SORTEIO:');
    console.log('   - Copie este código para suas redes sociais');
    console.log('   - A primeira pessoa que clicar no link ou digitar o código ganha');
    console.log('   - O sistema automaticamente bloqueia tentativas posteriores');
    console.log('');

    // Gerar também alguns códigos de backup caso queira fazer mais sorteios
    console.log('🔄 CÓDIGOS DE BACKUP (para futuros sorteios):');
    for (let i = 1; i <= 3; i++) {
        const backupCode = 'SORTEIO' + Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log(`   ${i}. ${backupCode}`);
    }
    console.log('');
    console.log('✅ Código pronto para uso! Apenas crie no sistema usando uma das opções acima.');
}

generateSorteioCode(); 