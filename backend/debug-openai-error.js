#!/usr/bin/env node

/**
 * Script de Debug - Erro 400 OpenAI
 * 
 * Investiga o erro 400 específico com prompt longo
 */

require('dotenv').config();
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

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

async function debugOpenAIError() {
    console.log('\n🔍 DEBUG OPENAI ERRO 400\n');

    // Testar progressivamente
    const tests = [
        {
            name: 'Teste Simples',
            config: {
                model: 'gpt-4-turbo-2024-04-09',
                messages: [{ role: 'user', content: 'Teste simples' }],
                temperature: 0.1,
                max_tokens: 100
            }
        },
        {
            name: 'Teste com System Message',
            config: {
                model: 'gpt-4-turbo-2024-04-09',
                messages: [
                    { role: 'system', content: 'Você é um ATS especialista.' },
                    { role: 'user', content: 'Analise este teste' }
                ],
                temperature: 0.1,
                max_tokens: 200
            }
        },
        {
            name: 'Teste com Max Tokens Alto',
            config: {
                model: 'gpt-4-turbo-2024-04-09',
                messages: [
                    { role: 'system', content: 'Você é um ATS especialista.' },
                    { role: 'user', content: 'Teste com limite alto de tokens' }
                ],
                temperature: 0.1,
                max_tokens: 8192
            }
        },
        {
            name: 'Teste com Prompt Médio',
            config: {
                model: 'gpt-4-turbo-2024-04-09',
                messages: [
                    { role: 'system', content: 'Você é um ATS especialista.' },
                    { role: 'user', content: 'Analise este currículo: João Silva, desenvolvedor com 3 anos de experiência em JavaScript, React e Node.js. Vaga: Desenvolvedor Full Stack com JavaScript, React, Node.js.' }
                ],
                temperature: 0.1,
                max_tokens: 4096
            }
        }
    ];

    for (const test of tests) {
        try {
            log.info(`Executando: ${test.name}`);

            const response = await axios.post(
                OPENAI_URL,
                test.config,
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            log.success(`${test.name}: OK`);
            log.info(`Tokens usados: ${response.data.usage?.total_tokens || 'N/A'}`);

        } catch (error) {
            log.error(`${test.name}: FALHOU`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Erro: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.log(`Erro: ${error.message}`);
            }
            console.log('---');
        }
    }

    // Teste específico do modelo
    log.info('Verificando modelos disponíveis...');
    try {
        const modelsResponse = await axios.get(
            'https://api.openai.com/v1/models',
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                }
            }
        );

        const gptModels = modelsResponse.data.data.filter(model =>
            model.id.includes('gpt-4')
        );

        log.success(`Modelos GPT-4 disponíveis: ${gptModels.length}`);
        gptModels.forEach(model => {
            console.log(`  - ${model.id}`);
        });

        // Verificar se o modelo específico existe
        const targetModel = 'gpt-4-turbo-2024-04-09';
        const modelExists = gptModels.some(model => model.id === targetModel);

        if (modelExists) {
            log.success(`Modelo ${targetModel}: DISPONÍVEL`);
        } else {
            log.error(`Modelo ${targetModel}: NÃO ENCONTRADO`);
            log.info('Modelos alternativos sugeridos:');
            gptModels.slice(0, 3).forEach(model => {
                console.log(`  - ${model.id}`);
            });
        }

    } catch (error) {
        log.error('Falha ao verificar modelos');
        console.log(error.response?.data || error.message);
    }

    console.log('\n🎯 RESUMO DO DEBUG:');
    console.log('Se todos os testes simples passaram mas o prompt completo falha, pode ser:');
    console.log('1. 📏 Prompt muito longo (limite de tokens)');
    console.log('2. 🚫 Modelo específico não disponível na conta');
    console.log('3. 💰 Limite de rate/quota excedido');
    console.log('4. 📝 Conteúdo específico violando políticas\n');
}

// Executar debug
if (require.main === module) {
    debugOpenAIError().catch(error => {
        log.error(`Erro no debug: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { debugOpenAIError }; 