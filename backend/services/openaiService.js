const axios = require('axios');
const claudeService = require('./claudeService');
const { costTracker } = require('../utils/costTracker');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(jobsText, resumeText) {
  return `Responda sempre em português do Brasil.
Você é um sistema ATS especialista em análise de currículos e vagas.

1. Extraia e liste de forma COMPLETA, DETALHADA e SEM OMITIR NENHUMA todos os termos relevantes das vagas em "job_keywords". Siga OBRIGATORIAMENTE as regras abaixo:
   - Remova duplicidades contextuais (ex: "roadmap" e "visão e roadmap" → mantenha apenas o termo mais completo; "metodologias ágeis" e "metodologias" → mantenha o termo mais específico).
   - Agrupe termos semelhantes (ex: "requisitos técnicos", "requisitos funcionais", "requisitos de negócios", "requisitos não funcionais" → "requisitos (técnicos, funcionais, de negócios, não funcionais)").
   - Elimine verbos soltos ou termos que não fazem sentido isoladamente (ex: "ouvir", "planejamento", "definir escopo" → mantenha apenas "escopo" se relevante).
   - Mantenha apenas substantivos compostos, nomes de áreas, ferramentas, conceitos completos e termos realmente relevantes.
   - Não repita termos com variação de maiúsculas/minúsculas ou plural/singular.
   - O resultado deve ser uma lista enxuta, sem repetições, agrupada por contexto quando necessário.
   - NÃO inclua frases descritivas, apenas termos, tecnologias, competências, ferramentas, cargos, requisitos, etc.
   - NÃO inclua verbos soltos (ex: "Implementar", "Executar", "Comunicar") como palavras-chave. Verbos só devem aparecer se fizerem parte de uma expressão técnica ou termo composto relevante (ex: "Gestão de Projetos", "Aplicar Metodologias Ágeis").
   - NÃO utilize objetos ou listas separadas. Apenas um array único contendo todos os termos relevantes extraídos das vagas.
   - Ao extrair termos de múltiplas vagas, consolide todos em um ÚNICO array job_keywords, SEM duplicidades. Cada termo deve aparecer apenas uma vez, mesmo que esteja presente em mais de uma vaga ou trecho. Faça a deduplicação após juntar todos os termos das vagas analisadas.

2. Para cada palavra-chave extraída da vaga (em "job_keywords"), compare diretamente com TODO o texto do currículo fornecido:
   - Considere como presente APENAS se a expressão da palavra-chave (ou seu plural/singular) aparecer como palavra inteira no texto do currículo, ignorando caixa e acentos. NÃO marque como presente se a palavra-chave for apenas parte de outra palavra, aparecer em contexto amplo, como sinônimo distante, ou como fragmento. NÃO aceite matches por contexto, associação indireta, parte de palavra, ou variações morfológicas que não sejam plural/singular.
   - Exemplos:
     - "gestão de backlog" só deve ser marcada como presente se a expressão completa aparecer. Se houver apenas "backlog" ou "gestão", NÃO marque como presente.
     - "estratégias" só deve ser marcada como presente se "estratégias" ou "estratégia" aparecerem como palavra inteira. "objetivos estratégicos" NÃO é válido.
     - "produtos de IA" só deve ser marcada como presente se a expressão completa aparecer. Se houver apenas "produtos" ou "IA" separados, NÃO marque como presente.
     - "cientista de dados" só deve ser marcada como presente se a expressão completa aparecer. Se houver apenas "cientista" ou "dados" separados, NÃO marque como presente.
     - "comunicação efetiva" só deve ser marcada como presente se a expressão completa aparecer. Se houver apenas "comunicação" ou "efetiva" separados, NÃO marque como presente.
   - Seja estritamente literal: só marque como presente se a expressão exata (ou plural/singular) estiver explícita, como palavra inteira, no texto do currículo.
   - Se a palavra-chave da vaga estiver presente no texto do currículo, adicione ao array "job_keywords_present".
   - Se a palavra-chave da vaga NÃO estiver presente no texto do currículo nesses termos, adicione ao array "job_keywords_missing".
   - NÃO utilize resume_keywords para montar esses arrays; a comparação deve ser feita SEMPRE diretamente entre cada termo de job_keywords e o texto completo do currículo.
   - NÃO extraia nem retorne resume_keywords.
   - NÃO agrupe nem categorize, apenas retorne esses dois arrays além de "job_keywords".
   - Ignore apenas casos sem relação real (não aceite palavras que não tenham correspondência semântica ou contextual com a vaga/currículo).

// 3. Não extraia nem liste palavras-chave do currículo (não gere resume_keywords).

3. Compare as listas: preencha "found_keywords" com as palavras-chave das vagas presentes no currículo e "missing_keywords" com as palavras-chave das vagas ausentes no currículo.

4. Avalie DETALHADAMENTE o currículo nos seguintes campos, um por um:
   - Resumo
   - Idiomas
   - Formação
   - Habilidades
   - Informações Pessoais
   - Experiência Profissional
   
   IMPORTANTE - ADAPTAÇÃO A DIFERENTES ESTRUTURAS DE CURRÍCULO:
   - Se uma seção não existir claramente definida no currículo, analise o CONTEÚDO DISPONÍVEL e informe que a seção está ausente ou misturada
   - Se as informações estiverem espalhadas ou misturadas, extraia o que for possível do texto disponível
   - Para currículos mal estruturados, foque na ESSÊNCIA das informações, não na formatação
   - Se não há dados suficientes para uma seção, seja honesto: nota baixa + sugestão de criar/organizar essa seção
   
   Para cada campo, você DEVE:
   - Dar uma NOTA de 0 a 10 baseada na qualidade, completude e relevância para as vagas
     * NOTA 0-2: Área para desenvolver ou informações em construção
     * NOTA 3-5: Seção presente mas com espaço para crescimento  
     * NOTA 6-8: Seção bem estruturada com potencial de aprimoramento
     * NOTA 9-10: Seção excelente e bem desenvolvida
   - Escrever uma avaliação EMPÁTICA e CONSTRUTIVA (mínimo 2 frases) analisando:
     * SEMPRE começar com algo POSITIVO quando possível
     * O que está BEM na seção atual (ou o que encontrou no currículo mesmo que desorganizado)
     * O que pode ser DESENVOLVIDO de forma encorajadora (incluindo estruturação se necessário)
     * Como a seção se relaciona com as vagas analisadas
     * Se a seção está em construção, mencione de forma SUPORTIVA
   - Fornecer 2-4 sugestões PRÁTICAS e ENCORAJADORAS de desenvolvimento
   
   INSTRUÇÕES ESPECIAIS POR SEÇÃO:
   - RESUMO: Se não há resumo/objetivo, analise se há informações introdutórias no início
   - EXPERIÊNCIA: Sempre presente de alguma forma - extraia do que estiver disponível  
   - HABILIDADES: Se não há seção específica, extraia do texto geral o que for mencionado
   - FORMAÇÃO: Se não clara, procure por educação, cursos, universidade, etc.
   - IDIOMAS: Se não mencionado, nota baixa + sugestão de incluir
   - INFO PESSOAIS: Sempre há algo (nome, contato) - avalie completude
   
   TONE E LINGUAGEM:
   - Use linguagem EXTREMAMENTE AMIGÁVEL e ENCORAJADORA
   - NUNCA use palavras como: "crítico", "ausente", "problemático", "falha", "deficiência", "prejudica", "lacuna"
   - SEMPRE use: "área para desenvolver", "em construção", "oportunidade", "pode crescer", "seria valioso incluir"
   - Reconheça SEMPRE o esforço e potencial do candidato
   - Foque no CRESCIMENTO e DESENVOLVIMENTO, nunca nos problemas
   - Seja ESPECÍFICO mas GENTIL e INSPIRADOR nas sugestões
   - Trate cada seção como uma "jornada em andamento"
   
   NUNCA deixe uma seção sem análise - sempre forneça feedback CONSTRUTIVO e ENCORAJADOR.

5. Dê recomendações gerais para melhorar o currículo em relação às vagas analisadas.

6. Escreva uma conclusão geral sobre o grau de aderência do currículo às vagas.

VAGAS:
${jobsText}

CURRÍCULO:
${resumeText}

Responda em JSON, SEMPRE incluindo TODAS as chaves abaixo, mesmo que alguma esteja vazia:
{
  "job_keywords": [],
  "resume_keywords": [],
  "missing_keywords": [],
  "found_keywords": [],
  "recommendations": [],
  "conclusion": "",
  "resumo": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "idiomas": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "formacao": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "habilidades": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "informacoes_pessoais": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "experiencia_profissional": { "nota": 0, "avaliacao": "", "sugestoes": [] }
}
`;
}

exports.extractATSData = async (jobsText, resumeText) => {
  const prompt = buildPrompt(jobsText, resumeText);
  console.log('[ATS] Tamanho do prompt:', prompt.length, 'caracteres');
  console.log('[ATS] 🔄 Nova estratégia: Claude primeiro → OpenAI fallback (economia de ~80%)');

  // 🚀 PRIORIDADE 1: CLAUDE 3.5 SONNET (mais barato e eficiente)
  try {
    console.log('[Claude] Tentando Claude 3.5 Sonnet primeiro...');
    const claudeRaw = await claudeService.extractATSDataClaude(prompt);
    console.log('[Claude] ✅ Resposta recebida com sucesso (modelo primário)');

    let text = claudeRaw.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    text = text.trim();
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    return JSON.parse(text);
  } catch (claudeError) {
    console.error('[Claude] ❌ Falha no modelo primário, tentando fallback com OpenAI:', claudeError.message);

    // 🔄 FALLBACK: OPENAI GPT-4 (quando Claude não funciona)
    const requestConfig = {
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        { role: 'system', content: 'Você é um ATS especialista.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4096
    };

    console.log('[OpenAI] Configuração do fallback:', {
      model: requestConfig.model,
      temperature: requestConfig.temperature,
      max_tokens: requestConfig.max_tokens,
      reason: 'Claude indisponível'
    });

    try {
      const response = await axios.post(
        OPENAI_URL,
        requestConfig,
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let text = response.data.choices[0].message.content;
      console.log('[OpenAI] ✅ Resposta recebida com sucesso (fallback)');

      // 💰 Rastrear custos da API (fallback mais caro)
      const usage = response.data.usage;
      if (usage) {
        const cost = costTracker.trackOpenAI(
          requestConfig.model,
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          'completion',
          false // isPrimary = false (OpenAI agora é fallback)
        );
        console.log(`[OpenAI] 💸 Custo do fallback: $${cost.toFixed(4)} (${usage.prompt_tokens} + ${usage.completion_tokens} tokens)`);

        // Comparar custo extra vs Claude
        const claudeEquivalentCost = ((usage.prompt_tokens || 0) * 0.003 / 1000) + ((usage.completion_tokens || 0) * 0.015 / 1000);
        const extraCost = cost - claudeEquivalentCost;
        const extraPercentage = ((extraCost / claudeEquivalentCost) * 100).toFixed(1);
        console.log(`[OpenAI] ⚠️ Custo extra vs Claude: $${extraCost.toFixed(4)} (${extraPercentage}% mais caro)`);
        console.log(`[OpenAI] 🔍 Investigar: Por que Claude falhou? Rate limit? API down?`);
      }

      // Remove blocos markdown e crases
      text = text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      else if (text.startsWith('```')) text = text.slice(3);
      text = text.trim();
      if (text.endsWith('```')) text = text.slice(0, -3);
      text = text.trim();

      return JSON.parse(text);
    } catch (openaiError) {
      console.error('[OpenAI] ❌ Fallback também falhou:', openaiError.message);
      throw new Error(`Ambos modelos falharam - Claude: ${claudeError.message} | OpenAI: ${openaiError.message}`);
    }
  }
};
