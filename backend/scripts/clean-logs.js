#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 🧹 Script de Limpeza de Logs - CV Sem Frescura
console.log('🧹 Iniciando limpeza de logs...');

const logsDir = path.join(__dirname, '../logs');
const logFiles = ['combined.log', 'error.log'];

// Função para limpar arquivo de log
function cleanLogFile(filename) {
    const filePath = path.join(logsDir, filename);

    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`📄 ${filename}: ${fileSizeInMB}MB`);

            // Limpa o arquivo mantendo apenas as últimas 100 linhas (se for error.log)
            if (filename === 'error.log') {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');

                if (lines.length > 100) {
                    const lastLines = lines.slice(-100);
                    fs.writeFileSync(filePath, lastLines.join('\n'));
                    console.log(`✅ ${filename}: Mantidas apenas as últimas 100 linhas`);
                } else {
                    console.log(`ℹ️ ${filename}: Arquivo pequeno, mantido como está`);
                }
            } else {
                // Para combined.log, limpa completamente em produção
                if (process.env.NODE_ENV === 'production') {
                    fs.writeFileSync(filePath, '');
                    console.log(`✅ ${filename}: Limpo completamente (produção)`);
                } else {
                    console.log(`ℹ️ ${filename}: Mantido (desenvolvimento)`);
                }
            }
        } else {
            console.log(`ℹ️ ${filename}: Arquivo não existe`);
        }
    } catch (error) {
        console.error(`❌ Erro ao limpar ${filename}:`, error.message);
    }
}

// Verificar se o diretório de logs existe
if (!fs.existsSync(logsDir)) {
    console.log('📁 Criando diretório de logs...');
    fs.mkdirSync(logsDir, { recursive: true });
}

// Limpar cada arquivo de log
logFiles.forEach(cleanLogFile);

// Criar arquivo .gitignore para logs se não existir
const gitignorePath = path.join(logsDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '# Ignorar todos os logs\n*.log\n');
    console.log('✅ .gitignore criado no diretório de logs');
}

console.log('✅ Limpeza de logs concluída!');

// Se executado em produção, também limpa logs antigos
if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Ambiente de produção detectado');
    console.log('💡 Considere configurar um cron job para executar este script regularmente');
    console.log('💡 Exemplo: 0 2 * * * /usr/local/bin/node /path/to/clean-logs.js');
} 