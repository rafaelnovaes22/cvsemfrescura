/**
 * Utilitário para validação estrutural das respostas do modelo
 * Garante que o JSON retornado está completo e consistente
 */

/**
 * Verifica se um objeto JSON possui a estrutura esperada para uma análise ATS
 * @param {Object} responseData - Resposta JSON do modelo
 * @returns {Object} - Objeto com resultado da validação {valid, errors}
 */
function validateATSResponseStructure(responseData) {
  try {
    const errors = [];
    
    // Verificações básicas de existência
    if (!responseData) {
      return { valid: false, errors: ['Resposta vazia ou inválida'] };
    }
    
    // Verifica seções obrigatórias de primeiro nível
    const requiredSections = [
      'perfil_vagas', 
      'hard_skills', 
      'soft_skills', 
      'responsabilidades', 
      'recomendacoes'
    ];
    
    for (const section of requiredSections) {
      if (!responseData[section]) {
        errors.push(`Seção obrigatória "${section}" não encontrada`);
      }
    }
    
    // Verifica estrutura do perfil_vagas
    if (responseData.perfil_vagas) {
      if (!Array.isArray(responseData.perfil_vagas)) {
        errors.push('perfil_vagas deve ser um array');
      } else if (responseData.perfil_vagas.length === 0) {
        errors.push('perfil_vagas não pode estar vazio');
      } else {
        // Verifica campos obrigatórios em cada vaga
        const requiredVagaFields = [
          'vaga_id', 'cargo', 'area', 'nivel', 
          'modelo_trabalho', 'compatibilidade_percentual'
        ];
        
        responseData.perfil_vagas.forEach((vaga, index) => {
          for (const field of requiredVagaFields) {
            if (vaga[field] === undefined) {
              errors.push(`Campo "${field}" ausente na vaga ${index + 1}`);
            }
          }
          
          // Verifica se o percentual de compatibilidade está dentro do intervalo esperado
          if (typeof vaga.compatibilidade_percentual === 'number') {
            if (vaga.compatibilidade_percentual < 0 || vaga.compatibilidade_percentual > 100) {
              errors.push(`Compatibilidade percentual inválida (${vaga.compatibilidade_percentual}) na vaga ${index + 1}`);
            }
          }
        });
      }
    }
    
    // Verifica estrutura hard_skills
    if (responseData.hard_skills) {
      const requiredHardSkillSections = ['tecnicos', 'formacao', 'idiomas', 'experiencia'];
      
      for (const section of requiredHardSkillSections) {
        if (!responseData.hard_skills[section]) {
          errors.push(`Subseção "${section}" não encontrada em hard_skills`);
        } else if (!Array.isArray(responseData.hard_skills[section])) {
          errors.push(`Subseção "${section}" em hard_skills deve ser um array`);
        }
      }
    }
    
    // Verifica estrutura soft_skills
    if (responseData.soft_skills) {
      const requiredSoftSkillSections = ['comportamentais', 'gestao'];
      
      for (const section of requiredSoftSkillSections) {
        if (!responseData.soft_skills[section]) {
          errors.push(`Subseção "${section}" não encontrada em soft_skills`);
        } else if (!Array.isArray(responseData.soft_skills[section])) {
          errors.push(`Subseção "${section}" em soft_skills deve ser um array`);
        }
      }
    }
    
    // Verifica estrutura das recomendações
    if (responseData.recomendacoes) {
      const requiredRecommendationSections = [
        'termos_adicionar', 
        'secoes_expandir', 
        'reformulacoes', 
        'formatacao'
      ];
      
      for (const section of requiredRecommendationSections) {
        if (!responseData.recomendacoes[section]) {
          errors.push(`Subseção "${section}" não encontrada em recomendacoes`);
        } else if (!Array.isArray(responseData.recomendacoes[section])) {
          errors.push(`Subseção "${section}" em recomendacoes deve ser um array`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Erro ao validar estrutura: ${error.message}`]
    };
  }
}

/**
 * Verifica se uma resposta em texto está estruturada como JSON válido
 * @param {string} responseText - Texto da resposta do modelo
 * @returns {Object} - {valid, data, error}
 */
function parseAndValidateJSON(responseText) {
  try {
    // Tenta extrair JSON se a resposta contiver texto antes ou depois
    let jsonString = responseText;
    
    // Procura por um objeto JSON na string (entre { e })
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    // Tenta fazer o parse do JSON
    const data = JSON.parse(jsonString);
    return {
      valid: true,
      data,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      error: `Falha ao analisar JSON: ${error.message}`
    };
  }
}

module.exports = {
  validateATSResponseStructure,
  parseAndValidateJSON
};
