const atsService = require('../services/atsService');
const fs = require('fs');

exports.analyze = async (req, res) => {
  try {
    console.log('--- [ATS] Nova requisição recebida ---');
    const resumePath = req.file?.path;
    const jobLinks = JSON.parse(req.body.jobLinks || '[]');
    if (resumePath) {
      const path = require('path');
      console.log('[ATS] Arquivo recebido:', resumePath);
      console.log('[ATS] Extensão detectada:', path.extname(resumePath));
    }
    console.log('[ATS] Links recebidos:', jobLinks);
    if (!resumePath || !jobLinks.length) {
      console.warn('[ATS] Dados insuficientes: arquivo ou links ausentes.');
      return res.status(400).json({ error: 'Arquivo de currículo ou links de vagas ausentes.' });
    }
    if (jobLinks.length > 7) {
      console.warn('[ATS] Limite de vagas excedido:', jobLinks.length);
      return res.status(400).json({ error: 'O limite máximo é de 7 vagas por análise. Remova alguns links e tente novamente.' });
    }
    
    // Wrap em try/catch para tratar especificamente alucinações
    try {
      const result = await atsService.processATS(resumePath, jobLinks);
      
      // Extrai o texto do currículo para o filtro
      const textExtractor = require('../utils/textExtractor');
      const resumeText = await textExtractor.extract(resumePath);
      
      // Cruzamento real: só palavras da vaga encontradas no currículo
      const { analyzeKeywords, deduplicateKeywords } = require('../services/atsKeywordVerifier');
      if (result.job_keywords && Array.isArray(result.job_keywords)) {
        // Extrai as palavras-chave da vaga e remove duplicidades
        let jobKeywords = result.job_keywords;
        jobKeywords = deduplicateKeywords(jobKeywords);
        
        // IMPORTANTE: Agora vamos decompor as palavras-chave da vaga em termos mais simples 
        // para aumentar a chance de match com o currículo
        const atsPostProcessing = require('../utils/atsPostProcessing');
        let decomposedKeywords = [];
        for (const keyword of jobKeywords) {
          // Adiciona o termo original
          decomposedKeywords.push(keyword);
          // Adiciona os termos decompostos
          try {
            const decomposed = atsPostProcessing.decomposePhrase(keyword);
            decomposedKeywords = [...decomposedKeywords, ...decomposed];
          } catch (error) {
            console.error(`Erro ao decompor palavra-chave: ${keyword}`, error);
          }
        }
        
        // Remove duplicatas
        decomposedKeywords = [...new Set(decomposedKeywords)];
        console.log(`[ATS] Decomposição gerou ${decomposedKeywords.length} termos a partir de ${jobKeywords.length} palavras-chave originais`);
        
        // Usa a nova função analyzeKeywords com os termos decompostos
        const keywordAnalysis = analyzeKeywords(decomposedKeywords, resumeText);
        result.job_keywords_present = keywordAnalysis.job_keywords_present;
        result.job_keywords_missing = keywordAnalysis.job_keywords_missing;
        
        // Armazena os termos originais para referência
        result.original_keywords = jobKeywords;
        
        // Filtro algoritmico universal para termos específicos vs. genéricos
        // (declarada aqui para todo o escopo do analyze)
        function normalizeText(text) {
          return text.toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // VERIFICAÇÃO FINAL ULTRA-RIGOROSA PARA ELIMINAR QUALQUER FALSO POSITIVO
        // Esta função garante que palavras como "Cloud AWS", "Produtos de IA", etc.
        // só são consideradas presentes se estiverem EXATAMENTE no texto
        function ultraStrictVerification(keywords, text) {
          return keywords.filter(keyword => {
            // Normalização para comparação
            const normalizedKeyword = normalizeText(keyword);
            const normalizedText = normalizeText(text);
            
            // Para termos compostos (com mais de uma palavra)
            if (normalizedKeyword.includes(' ')) {
              // Cria um padrão de expressão regular que exige a sequência exata de palavras
              const pattern = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
              const regex = new RegExp(`\\b${pattern}\\b`, 'i');
              return regex.test(normalizedText);
            }
            
            // Para termos simples, exigir limites de palavra
            const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
            return regex.test(normalizedText);
          });
        }
        
        // Aplicar a verificação ultra-rigorosa
        const strictlyVerifiedKeywords = ultraStrictVerification(result.job_keywords_present, resumeText);
        
        // Atualizar as listas com base na verificação final
        const removedKeywords = result.job_keywords_present.filter(kw => !strictlyVerifiedKeywords.includes(kw));
        result.job_keywords_missing = [...result.job_keywords_missing, ...removedKeywords];
        result.job_keywords_present = strictlyVerifiedKeywords;
        
        // Processar os resultados para exibição amigável ao usuário
        result.job_keywords_present = processKeywordsForDisplay(result.job_keywords_present);
        result.job_keywords_missing = processKeywordsForDisplay(result.job_keywords_missing);
        
        /**
         * Processa os termos para exibição amigável ao usuário
         * Agrupa termos relacionados e remove duplicatas semânticas
         */
        function processKeywordsForDisplay(keywords) {
          // Categorias de termos para agrupar
          const categories = {
            'hard_skills': ['aws', 'azure', 'gcp', 'cloud', 'python', 'sql', 'tableau', 'power bi', 'quicksight', 'java', 'javascript', 'docker'],
            'soft_skills': ['comunicacao', 'lideranca', 'negociacao', 'resolucao de problemas', 'trabalho em equipe', 'adaptabilidade'],
            'metodologias': ['agil', 'scrum', 'kanban', 'devops', 'mlops'],
            'formacao': ['mestrado', 'pos-graduacao', 'graduacao', 'doutorado', 'mba'],
            'cargos': ['product owner', 'scrum master', 'data scientist', 'data analyst', 'data engineer']
          };
          
          // Filtrar termos muito genéricos ou que são parte de outros termos
          const filteredKeywords = keywords.filter(kw => {
            const normalized = normalizeText(kw);
            // Remover termos muito curtos ou genéricos
            if (normalized.length < 3) return false;
            
            // Verificar se este termo é parte de um termo mais específico que já está na lista
            const isPartOfLargerTerm = keywords.some(otherKw => {
              if (otherKw === kw) return false;
              return normalizeText(otherKw).includes(normalized) && 
                     normalizeText(otherKw).split(' ').length > normalized.split(' ').length;
            });
            
            return !isPartOfLargerTerm;
          });
          
          // Ordenar por tamanho (termos mais específicos primeiro)
          return filteredKeywords.sort((a, b) => {
            // Priorizar termos com parênteses
            const aHasParentheses = a.includes('(');
            const bHasParentheses = b.includes('(');
            if (aHasParentheses && !bHasParentheses) return -1;
            if (!aHasParentheses && bHasParentheses) return 1;
            
            // Depois, priorizar por número de palavras
            const aWords = a.split(' ').length;
            const bWords = b.split(' ').length;
            if (aWords !== bWords) return bWords - aWords;
            
            // Por fim, ordem alfabética
            return a.localeCompare(b);
          });
        }
        
        // Filtro algoritmico universal para termos específicos vs. genéricos
        // (declarada aqui para todo o escopo do analyze)
        function normalizeText(text) {
          return text.toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        const normalizedResumeText = normalizeText(resumeText);
        
        /**
         * Detecta se um termo é composto por palavras qualificadoras adicionais
         * em relação a outro termo mais simples
         */
        function isCompositeTermWith(specificTerm, possibleBaseTerm) {
          const specificWords = normalizeText(specificTerm).split(' ');
          const baseWords = normalizeText(possibleBaseTerm).split(' ');
          
          // Um termo específico deve ter mais palavras que o termo base
          if (specificWords.length <= baseWords.length) {
            return false;
          }
          
          // Verifica se todas as palavras do termo base estão presentes no termo específico
          // na mesma ordem relativa (podem existir palavras adicionais entre elas)
          let baseIndex = 0;
          for (let i = 0; i < specificWords.length && baseIndex < baseWords.length; i++) {
            if (specificWords[i] === baseWords[baseIndex]) {
              baseIndex++;
            }
          }
          
          // Se todas as palavras do termo base foram encontradas
          return baseIndex === baseWords.length;
        }
        
        /**
         * Detecta se um termo tem um qualificador específico (como "produtos de X" ou "X AWS")
         */
        function hasSpecificQualifier(term) {
          const normalized = normalizeText(term);
          
          // Padrões comuns de qualificação
          const patterns = [
            /\b(aws|azure|gcp|cloud)\b/,               // Plataformas cloud
            /\b(python|java|javascript|typescript)\b/, // Linguagens específicas
            /\b(react|angular|vue)\b/,                // Frameworks frontend
            /\b(node|express|flask|django)\b/,        // Frameworks backend
            /\b(kubernetes|docker|terraform)\b/,      // DevOps específico
            /\b(scrum|kanban|agile)\b/                // Metodologias específicas
          ];
          
          return patterns.some(pattern => pattern.test(normalized));
        }
        
        // Para cada palavra-chave presente, verificar se é específica o suficiente
        result.job_keywords_present = result.job_keywords_present.filter(kw => {
          // Termos compostos (com mais de uma palavra) são geralmente específicos o suficiente
          if (normalizeText(kw).includes(' ')) {
            return true;
          }
          
          // Termos simples só são mantidos se forem específicos
          return hasSpecificQualifier(kw);
        });
        
        // Para cada palavra-chave ausente, fazer a verificação de contexto
        result.job_keywords_missing = result.job_keywords_missing.filter(kw => {
          // Não remover termos compostos (são importantes)
          if (normalizeText(kw).includes(' ')) {
            return true;
          }
          
          // Para termos simples, verificar se já não está coberto por um termo mais específico
          const hasMoreSpecificTerm = result.job_keywords_present.some(presentKw => {
            return isCompositeTermWith(presentKw, kw);
          });
          
          // Se existir um termo mais específico que o inclui, não mostrar na lista de ausentes
          return !hasMoreSpecificTerm;
        });
        
        // Certifica-se de que uma palavra-chave não pode estar em ambas as listas
        result.job_keywords_missing = result.job_keywords_missing.filter(
          kw => !result.job_keywords_present.includes(kw)
        );
      }
      
      // Limpa o arquivo temporário e retorna o resultado
      fs.unlink(resumePath, () => {}); 
      console.log('[ATS] Análise concluída. Resultado:', JSON.stringify(result, null, 2));
      return res.json(result);
      
    } catch (error) {
      // Verificar se é um erro de alucinação
      if (error.isHallucination) {
        console.warn('[ATS Controller] Alucinação detectada:', error.message);
        
        // Limpar arquivo temporário
        if (resumePath) {
          fs.unlink(resumePath, () => {});
        }
        
        // Retornar erro específico de alucinação - código 428 indica "Precondition Required"
        return res.status(428).json({
          error: 'Alucinação de IA detectada',
          isHallucination: true,
          message: 'Foi detectada uma possível resposta inconsistente durante a análise. Para garantir a qualidade, a análise foi cancelada e não será cobrada.',
          detail: error.message,
          shouldRetry: true,
          code: error.code || 'HALLUCINATION_ERROR',
          explanation: {
            title: 'O que são alucinações em IAs?',
            content: 'Alucinações são um fenômeno natural em modelos de IA avançados, onde o sistema ocasionalmente gera informações inconsistentes ou incorretas. Isso ocorre mesmo nos modelos mais avançados como GPT-4 e Claude, e não é um defeito do nosso sistema, mas uma característica inerente da tecnologia atual.',
            reasons: [
              'Ambiguidades no texto do currículo ou da vaga',
              'Complexidade da análise solicitada',
              'Incertezas que o modelo tenta preencher com informações plausíveis'
            ],
            what_to_do: [
              'Tente novamente a análise (geralmente resolve o problema)',
              'Verifique se o currículo está em formato adequado',
              'Considere analisar menos vagas simultaneamente'
            ]
          },
          redirectTo: '/hallucination-error.html'
        });
      }
      
      // Caso contrário, relançar o erro para ser tratado no catch externo
      throw error;
    }
  } catch (error) {
    // Limpar arquivo temporário
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    console.error('[ATS Controller] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar análise ATS.',
      message: error.message
    });
  }
};
