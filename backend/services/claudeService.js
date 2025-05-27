const axios = require('axios');
const { costTracker } = require('../utils/costTracker');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'; // 160k tokens, disponível e de alta qualidade

/**
 * Envia prompt para o Claude 3 Sonnet e retorna a resposta do modelo.
 * Configurado para ter consistência com OpenAI: temperature 0.1, system message.
 * @param {string} prompt
 * @returns {Promise<string>} resposta do modelo
 */
exports.extractATSDataClaude = async function (prompt) {
  const headers = {
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 4096, // Alinhado com OpenAI para consistência
    temperature: 0.1, // Mesma temperatura do OpenAI para consistência
    system: 'Você é um ATS especialista.', // Mesmo system message do OpenAI
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  console.log('[Claude] Configuração:', {
    model: CLAUDE_MODEL,
    temperature: 0.1,
    max_tokens: 4096,
    system: 'Você é um ATS especialista.'
  });

  try {
    const response = await axios.post(CLAUDE_URL, body, { headers });
    console.log('[Claude] Resposta recebida com sucesso');

    // 💰 Rastrear custos da API (modelo primário)
    const usage = response.data.usage;
    if (usage) {
      const cost = costTracker.trackClaude(
        CLAUDE_MODEL,
        usage.input_tokens || 0,
        usage.output_tokens || 0,
        true // isPrimary = true (Claude é agora o modelo principal)
      );
      console.log(`[Claude] 💰 Custo da análise: $${cost.toFixed(4)} (${usage.input_tokens} + ${usage.output_tokens} tokens)`);

      // Comparar economia vs OpenAI
      const openaiEquivalentCost = ((usage.input_tokens || 0) * 0.03 / 1000) + ((usage.output_tokens || 0) * 0.06 / 1000);
      const savings = openaiEquivalentCost - cost;
      const savingsPercentage = ((savings / openaiEquivalentCost) * 100).toFixed(1);
      console.log(`[Claude] 💸 Economia vs OpenAI: $${savings.toFixed(4)} (${savingsPercentage}% mais barato)`);
    }

    // Claude retorna a resposta em response.data.content[0].text
    return response.data.content[0].text;
  } catch (e) {
    if (e.response) {
      console.error('[Claude] Full error response:', JSON.stringify(e.response.data, null, 2));
      throw new Error(e.response.data?.error?.message || JSON.stringify(e.response.data));
    } else {
      console.error('[Claude] Error:', e.message);
      throw new Error(e.message);
    }
  }
};
