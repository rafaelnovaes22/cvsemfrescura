require('dotenv').config();
const { FirecrawlApp } = require('@mendable/firecrawl-js');

async function testBasicFirecrawl() {
    console.log('🔥 TESTE BÁSICO - BIBLIOTECA OFICIAL FIRECRAWL\n');

    try {
        // 1. Verificar se a biblioteca foi importada corretamente
        console.log('1️⃣ Verificando importação da biblioteca...');
        console.log('   ✅ FirecrawlApp importado com sucesso');

        // 2. Verificar variáveis de ambiente
        console.log('\n2️⃣ Verificando configuração...');
        const apiKey = process.env.FIRECRAWL_API_KEY;
        console.log('   - API Key:', apiKey ? '✅ Configurada' : '❌ Não configurada');
        console.log('   - Base URL:', process.env.FIRECRAWL_BASE_URL || 'padrão');

        // 3. Tentar inicializar o cliente (mesmo sem API key)
        console.log('\n3️⃣ Inicializando cliente...');

        if (apiKey) {
            const app = new FirecrawlApp({
                apiKey: apiKey
            });
            console.log('   ✅ Cliente inicializado com API key');

            // 4. Teste básico de scraping (se tiver API key)
            console.log('\n4️⃣ Testando scraping básico...');
            try {
                const result = await app.scrapeUrl('https://example.com', {
                    formats: ['markdown']
                });

                if (result.success) {
                    console.log('   ✅ Scraping bem-sucedido!');
                    console.log(`   - Título: ${result.data.metadata?.title}`);
                    console.log(`   - Tamanho do conteúdo: ${result.data.markdown?.length || 0} caracteres`);
                } else {
                    console.log('   ❌ Scraping falhou:', result.error);
                }
            } catch (error) {
                console.log('   ❌ Erro no scraping:', error.message);
            }
        } else {
            console.log('   ⚠️ Cliente não inicializado (sem API key)');
            console.log('   📝 Para testar completamente:');
            console.log('      1. Obtenha uma API key em https://firecrawl.dev');
            console.log('      2. Adicione FIRECRAWL_API_KEY=fc-sua-chave ao .env');
            console.log('      3. Execute este teste novamente');
        }

        console.log('\n✅ Teste básico concluído!');

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
    testBasicFirecrawl();
}

module.exports = { testBasicFirecrawl }; 