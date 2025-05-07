/**
 * Sistema de verificação de plausibilidade para resultados da análise ATS
 * Implementa regras para identificar respostas potencialmente alucinadas
 */

/**
 * Verifica se o resultado da análise ATS é plausível
 * @param {Object} atsResult - Resultado da análise ATS
 * @returns {Object} - {plausible, issues}
 */
function checkPlausibility(atsResult) {
  const issues = [];
  let plausible = true;
  
  try {
    // 1. Verificações de compatibilidade percentual
    if (atsResult.perfil_vagas && Array.isArray(atsResult.perfil_vagas)) {
      for (const vaga of atsResult.perfil_vagas) {
        // Se uma vaga tem compatibilidade muito alta (> 95%) mas muitas recomendações, isso é suspeito
        if (vaga.compatibilidade_percentual > 95 && 
            atsResult.recomendacoes && 
            atsResult.recomendacoes.termos_adicionar && 
            atsResult.recomendacoes.termos_adicionar.length > 10) {
          issues.push(`Compatibilidade muito alta (${vaga.compatibilidade_percentual}%) mas com muitas recomendações`);
          plausible = false;
        }
        
        // Se uma vaga tem compatibilidade muito baixa (< 10%) mas poucas recomendações, isso é suspeito
        if (vaga.compatibilidade_percentual < 10 && 
            (!atsResult.recomendacoes || 
             !atsResult.recomendacoes.termos_adicionar || 
             atsResult.recomendacoes.termos_adicionar.length < 3)) {
          issues.push(`Compatibilidade muito baixa (${vaga.compatibilidade_percentual}%) mas com poucas recomendações`);
          plausible = false;
        }
      }
    }
    
    // 2. Verificação de volume e distribuição de skills
    if (atsResult.hard_skills) {
      // Verificar se as seções de hard skills têm quantidades razoáveis
      const checkHardSkillsSection = (section, minExpected, maxExpected) => {
        if (atsResult.hard_skills[section] && Array.isArray(atsResult.hard_skills[section])) {
          const count = atsResult.hard_skills[section].length;
          if (count > maxExpected) {
            issues.push(`Número excessivo de itens em hard_skills.${section}: ${count} (máximo esperado: ${maxExpected})`);
            plausible = false;
          } else if (count < minExpected && atsResult.perfil_vagas && atsResult.perfil_vagas.length > 0) {
            // Só considera isso um problema se houver vagas para análise
            issues.push(`Número insuficiente de itens em hard_skills.${section}: ${count} (mínimo esperado: ${minExpected})`);
            plausible = false;
          }
        }
      };
      
      checkHardSkillsSection('tecnicos', 1, 50);
      checkHardSkillsSection('formacao', 0, 20);
      checkHardSkillsSection('idiomas', 0, 10);
      checkHardSkillsSection('experiencia', 0, 30);
    }
    
    // 3. Verificação de consistência das palavras-chave
    const allKeywords = [];
    
    // Coleta todas as palavras-chave técnicas
    if (atsResult.hard_skills && atsResult.hard_skills.tecnicos) {
      allKeywords.push(...atsResult.hard_skills.tecnicos);
    }
    
    // Procura por duplicatas exatas ou muito similares
    const normalizedKeywords = allKeywords.map(kw => normalizeForComparison(kw));
    const duplicates = findDuplicates(normalizedKeywords);
    
    if (duplicates.length > 0) {
      issues.push(`Detectadas ${duplicates.length} palavras-chave potencialmente duplicadas`);
      plausible = false;
    }
    
    // 4. Verificação de consistência entre perfil e skills
    if (atsResult.perfil_vagas && atsResult.perfil_vagas.length > 0 && atsResult.hard_skills) {
      // Para vagas de TI, esperamos skills técnicas
      const tiVagas = atsResult.perfil_vagas.filter(v => 
        v.area && v.area.toLowerCase().includes('ti') || 
        v.area && v.area.toLowerCase().includes('tecnologia')
      );
      
      if (tiVagas.length > 0 && 
          (!atsResult.hard_skills.tecnicos || atsResult.hard_skills.tecnicos.length < 3)) {
        issues.push(`Vaga(s) de TI identificada(s), mas poucas skills técnicas detectadas`);
        plausible = false;
      }
    }
    
    // 5. Verificar se as recomendações são coerentes com o restante da análise
    if (atsResult.recomendacoes && atsResult.recomendacoes.termos_adicionar) {
      const recKeywords = atsResult.recomendacoes.termos_adicionar;
      
      // Se todas as keywords recomendadas são muito similares, isso é suspeito
      if (recKeywords.length > 5) {
        const normalizedRecs = recKeywords.map(kw => normalizeForComparison(kw));
        const uniqueTerms = new Set(normalizedRecs);
        
        if (uniqueTerms.size < recKeywords.length * 0.7) {
          issues.push(`Muitas recomendações de termos similares ou repetitivos`);
          plausible = false;
        }
      }
    }
    
  } catch (error) {
    issues.push(`Erro ao verificar plausibilidade: ${error.message}`);
    plausible = false;
  }
  
  return {
    plausible,
    issues
  };
}

/**
 * Normaliza uma string para comparação
 * @param {string} str - String para normalizar
 * @returns {string} - String normalizada
 */
function normalizeForComparison(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encontra duplicatas em um array
 * @param {Array<string>} arr - Array para verificar
 * @returns {Array<string>} - Array com duplicatas encontradas
 */
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = [];
  
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.push(item);
    } else {
      seen.add(item);
    }
  }
  
  return duplicates;
}

/**
 * Verifica o resultado da análise para atributos implausíveis específicos
 * e corrige valores obviamente incorretos
 * @param {Object} atsResult - Resultado da análise ATS
 * @returns {Object} - Resultado corrigido
 */
function sanitizeImplausibleValues(atsResult) {
  try {
    // Cria uma cópia profunda para não modificar o original diretamente
    const sanitized = JSON.parse(JSON.stringify(atsResult));
    
    // 1. Corrige percentuais de compatibilidade fora do intervalo [0, 100]
    if (sanitized.perfil_vagas && Array.isArray(sanitized.perfil_vagas)) {
      for (const vaga of sanitized.perfil_vagas) {
        if (typeof vaga.compatibilidade_percentual === 'number') {
          if (vaga.compatibilidade_percentual < 0) {
            vaga.compatibilidade_percentual = 0;
          } else if (vaga.compatibilidade_percentual > 100) {
            vaga.compatibilidade_percentual = 100;
          }
        } else if (vaga.compatibilidade_percentual === undefined) {
          // Se não existe, define um valor padrão
          vaga.compatibilidade_percentual = 50;
        }
      }
    }
    
    // 2. Limita o número de itens em arrays excessivamente grandes
    const maxArraySizes = {
      'hard_skills.tecnicos': 50,
      'hard_skills.formacao': 20,
      'hard_skills.idiomas': 10,
      'hard_skills.experiencia': 30,
      'soft_skills.comportamentais': 30,
      'soft_skills.gestao': 20,
      'responsabilidades': 40,
      'recomendacoes.termos_adicionar': 30,
      'recomendacoes.secoes_expandir': 15,
      'recomendacoes.reformulacoes': 20,
      'recomendacoes.formatacao': 15
    };
    
    // Aplica os limites de tamanho de array
    for (const [path, maxSize] of Object.entries(maxArraySizes)) {
      const parts = path.split('.');
      let current = sanitized;
      
      // Navega até o objeto pai
      for (let i = 0; i < parts.length - 1; i++) {
        if (current && typeof current === 'object') {
          current = current[parts[i]];
        } else {
          current = null;
          break;
        }
      }
      
      // Aplica o limite se o objeto pai e o array existirem
      const lastPart = parts[parts.length - 1];
      if (current && current[lastPart] && Array.isArray(current[lastPart])) {
        if (current[lastPart].length > maxSize) {
          current[lastPart] = current[lastPart].slice(0, maxSize);
        }
      }
    }
    
    // 3. Remove strings vazias e valores null/undefined de arrays
    const cleanArrays = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          obj[key] = obj[key].filter(item => item !== null && item !== undefined && item !== '');
        } else if (typeof obj[key] === 'object') {
          cleanArrays(obj[key]);
        }
      }
    };
    
    cleanArrays(sanitized);
    
    return sanitized;
  } catch (error) {
    // Em caso de erro, retorna o objeto original
    console.error(`Erro ao sanitizar valores implausíveis: ${error.message}`);
    return atsResult;
  }
}

module.exports = {
  checkPlausibility,
  sanitizeImplausibleValues
};
