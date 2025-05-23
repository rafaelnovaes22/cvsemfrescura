#!/usr/bin/env node

/**
 * Script de Teste - Integração OpenAI
 * 
 * Este script testa a integração com a OpenAI API:
 * 1. Verifica se a chave está configurada
 * 2. Testa conexão com a API
 * 3. Faz uma requisição de teste
 * 4. Verifica o serviço ATS
 */

require('dotenv').config();
const axios = require('axios');
const openaiService = require('./services/openaiService');

// Cores para output no terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`)
};

async function testOpenAIIntegration() {
    console.log('\n🧪 TESTE DE INTEGRAÇÃO OPENAI - CV SEM FRESCURA\n');

    // 1. Verificar Chave
    log.info('Verificando configuração da chave OpenAI...');

    if (!process.env.OPENAI_API_KEY) {
        log.error('OPENAI_API_KEY não configurada no .env');
        return false;
    }

    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        log.error('OPENAI_API_KEY não parece válida (deve começar com sk-)');
        return false;
    }

    log.success('Chave OpenAI encontrada');
    log.info(`Chave: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

    // 2. Testar Conexão Básica com OpenAI
    try {
        log.info('Testando conexão com a API OpenAI...');
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: 'Teste de conectividade. Responda apenas "OK".' }
                ],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        log.success('Conectado com sucesso à API OpenAI!');
        log.info(`Resposta: ${response.data.choices[0].message.content}`);
    } catch (error) {
        log.error(`Falha na conexão com OpenAI: ${error.response?.data?.error?.message || error.message}`);

        if (error.response?.status === 401) {
            log.error('Erro de autenticação - chave inválida ou expirada');
        } else if (error.response?.status === 429) {
            log.error('Rate limit excedido - aguarde ou verifique sua cota');
        } else if (error.response?.status === 400) {
            log.error('Requisição malformada');
        }

        return false;
    }

    // 3. Testar Modelo Específico (GPT-4)
    try {
        log.info('Testando modelo GPT-4 usado no sistema...');
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4-turbo-2024-04-09',
                messages: [
                    { role: 'user', content: 'Teste de conectividade GPT-4. Responda apenas "GPT-4 OK".' }
                ],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        log.success('GPT-4 funcionando corretamente!');
        log.info(`Resposta: ${response.data.choices[0].message.content}`);
    } catch (error) {
        log.error(`Erro com GPT-4: ${error.response?.data?.error?.message || error.message}`);

        if (error.response?.data?.error?.code === 'model_not_found') {
            log.warning('Modelo GPT-4 não disponível - verificando acesso...');
        }
    }

    // 4. Testar Serviço ATS
    try {
        log.info('Testando serviço ATS interno...');

        const jobsText = `
    Vaga: Desenvolvedor Full Stack
    Requisitos: JavaScript, React, Node.js, SQL
    `;

        const resumeText = `
    João Silva
    Desenvolvedor JavaScript com 3 anos de experiência
    Tecnologias: React, Node.js, MongoDB
    `;

        const result = await openaiService.extractATSData(jobsText, resumeText);

        log.success('Serviço ATS funcionando!');
        log.info(`Palavras-chave encontradas: ${result.job_keywords?.length || 0}`);
        log.info(`Resultado: ${result.conclusion?.substring(0, 100) || 'Sem conclusão'}...`);

    } catch (error) {
        log.error(`Erro no serviço ATS: ${error.message}`);
        console.error('Detalhes do erro:', error);
        return false;
    }

    // 5. Verificar Claude (fallback)
    if (process.env.CLAUDE_API_KEY) {
        log.success('Claude API configurada como fallback');
    } else {
        log.warning('Claude API não configurada (opcional)');
    }

    console.log('\n🎉 TESTE CONCLUÍDO!\n');
    return true;
}

// Executar teste
if (require.main === module) {
    testOpenAIIntegration().then((success) => {
        if (success) {
            console.log('✅ Integração OpenAI funcionando corretamente!');
            console.log('\n📋 PRÓXIMOS PASSOS:');
            console.log('1. 🚀 Sistema pronto para análises ATS');
            console.log('2. 🧪 Teste uma análise completa via frontend');
            console.log('3. 📊 Monitore logs durante o uso\n');
        } else {
            console.log('❌ Problemas encontrados na integração OpenAI!');
            console.log('\n🔧 AÇÕES NECESSÁRIAS:');
            console.log('1. ✅ Verificar chave OpenAI no .env');
            console.log('2. 💰 Verificar saldo/cota na conta OpenAI');
            console.log('3. 🔑 Verificar permissões da chave API');
            console.log('4. 🌐 Verificar conectividade com internet\n');
            process.exit(1);
        }
    }).catch(error => {
        log.error(`Erro no teste: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testOpenAIIntegration }; 