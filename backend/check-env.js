require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente...');
console.log('');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definida');
console.log('PORT:', process.env.PORT || 'não definida');

console.log('');
console.log('📂 Diretório atual:', process.cwd());

const fs = require('fs');
const path = require('path');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('📄 Arquivo .env existe?', envExists ? '✅ SIM' : '❌ NÃO');

if (envExists) {
    console.log('📍 Caminho do .env:', envPath);

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        console.log(`📋 Variáveis encontradas no .env: ${lines.length}`);

        lines.forEach(line => {
            const [key] = line.split('=');
            if (key) {
                console.log(`   - ${key.trim()}`);
            }
        });
    } catch (error) {
        console.error('❌ Erro ao ler .env:', error.message);
    }
}

console.log('========================================'); 