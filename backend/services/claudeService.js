const axios = require('axios');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'; // 160k tokens, disponível e de alta qualidade

/**
 * Envia prompt para o Claude 3 Sonnet e retorna a resposta do modelo.
 * @param {string} prompt
 * @returns {Promise<string>} resposta do modelo
 */
exports.extractATSDataClaude = async function(prompt) {
  const headers = {
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 4096, // ajuste conforme necessidade
    messages: [
      { role: 'user', content: prompt }
    ]
  };
  try {
    const response = await axios.post(CLAUDE_URL, body, { headers });
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
