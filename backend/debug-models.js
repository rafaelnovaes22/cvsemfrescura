console.log('🔍 Debug dos modelos...');

const fs = require('fs');
const path = require('path');

// Listar todos os arquivos de modelo
const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(file =>
    file.endsWith('.js') && file !== 'index.js'
);

console.log('📁 Arquivos de modelo encontrados:', files);

// Testar cada modelo individualmente
for (const file of files) {
    try {
        console.log(`\n🔍 Testando ${file}...`);
        const modelPath = path.join(modelsDir, file);
        const modelDefiner = require(modelPath);
        console.log(`✅ ${file} - Tipo:`, typeof modelDefiner);

        if (typeof modelDefiner === 'function') {
            console.log(`✅ ${file} é uma função (correto)`);
        } else {
            console.log(`❌ ${file} NÃO é uma função - Tipo:`, typeof modelDefiner);
            console.log(`❌ ${file} - Valor:`, modelDefiner);
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar ${file}:`, error.message);
    }
}

console.log('\n🔍 Testando index.js...');
try {
    const db = require('./models');
    console.log('✅ Index carregado com sucesso');
} catch (error) {
    console.error('❌ Erro no index:', error.message);
} 