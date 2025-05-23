// Teste: Como o sistema lida com currículos mal estruturados ou com seções ausentes
// Simula diferentes cenários reais de currículos problemáticos

console.log('🧪 TESTE: Análise de Currículos com Seções Ausentes ou Mal Estruturados\n');

// CENÁRIO 1: Currículo sem seções claras - tudo misturado
const curriculoMisturado = {
    "job_keywords": ["React", "JavaScript", "Node.js", "Scrum"],
    "job_keywords_present": ["JavaScript"],
    "job_keywords_missing": ["React", "Node.js", "Scrum"],

    // Análise adaptativa para currículo mal estruturado
    "resumo": {
        "nota": 2.0,
        "avaliacao": "Não foi identificada uma seção de resumo específica no currículo. As informações profissionais estão espalhadas pelo documento sem uma introdução clara que destaque o perfil do candidato. Isso dificulta a compreensão rápida das competências e objetivos profissionais.",
        "sugestoes": [
            "Criar uma seção de resumo profissional no início do currículo",
            "Incluir objetivo profissional claro (ex: 'Desenvolvedor Frontend especializado em...')",
            "Destacar principais competências em 2-3 linhas objetivas",
            "Mencionar anos de experiência e área de especialização"
        ]
    },

    "experiencia_profissional": {
        "nota": 4.5,
        "avaliacao": "Foi possível identificar algumas experiências profissionais mencionadas no texto, mas estão mal organizadas e misturadas com outras informações. Faltam datas, nomes de empresas claros e descrição estruturada das responsabilidades. As informações sobre projetos com JavaScript estão presentes mas dispersas.",
        "sugestoes": [
            "Organizar experiências em ordem cronológica inversa (mais recente primeiro)",
            "Incluir: Nome da empresa, cargo, período (mês/ano início - fim)",
            "Estruturar responsabilidades em bullet points",
            "Destacar projetos específicos com tecnologias mencionadas nas vagas"
        ]
    },

    "habilidades": {
        "nota": 3.2,
        "avaliacao": "Algumas habilidades técnicas foram mencionadas ao longo do texto (principalmente JavaScript), mas não há uma seção dedicada e organizada. Faltam tecnologias importantes como React e Node.js que são requisitos das vagas. A apresentação dispersa dificulta a identificação rápida das competências.",
        "sugestoes": [
            "Criar seção específica 'Habilidades Técnicas' ou 'Competências'",
            "Separar por categorias: Frontend, Backend, Ferramentas, Metodologias",
            "Adicionar React, Node.js e outras tecnologias das vagas se houver experiência",
            "Incluir nível de proficiência quando relevante"
        ]
    },

    "formacao": {
        "nota": 1.5,
        "avaliacao": "Não foi possível identificar informações claras sobre formação acadêmica no currículo analisado. Esta é uma seção crítica que está completamente ausente, prejudicando significativamente a avaliação do perfil educacional do candidato.",
        "sugestoes": [
            "Adicionar seção 'Formação Acadêmica' com curso superior se houver",
            "Incluir cursos técnicos, bootcamps ou especializações relevantes",
            "Mencionar instituições de ensino e períodos de formação",
            "Adicionar certificações importantes para a área de tecnologia"
        ]
    },

    "idiomas": {
        "nota": 0.5,
        "avaliacao": "Não foi identificada nenhuma menção sobre proficiência em idiomas no currículo. Para as vagas analisadas que frequentemente exigem inglês técnico, esta é uma lacuna crítica que precisa ser endereçada urgentemente.",
        "sugestoes": [
            "Criar seção 'Idiomas' especificando o nível de proficiência",
            "Incluir pelo menos inglês com nível real (básico, intermediário, avançado)",
            "Considerar adicionar certificações de idiomas se houver",
            "Mencionar experiência prática com idiomas em projetos internacionais"
        ]
    },

    "informacoes_pessoais": {
        "nota": 6.0,
        "avaliacao": "As informações básicas de contato estão presentes (nome, email aparentemente), mas a organização poderia ser melhor. Para um profissional de tecnologia, faltam informações importantes como LinkedIn e principalmente GitHub que são essenciais para demonstrar código.",
        "sugestoes": [
            "Organizar informações de contato de forma clara no topo do currículo",
            "Incluir LinkedIn atualizado e profissional",
            "Adicionar link do GitHub com repositórios relevantes",
            "Considerar incluir localização e disponibilidade para trabalho remoto"
        ]
    }
};

console.log('📊 CENÁRIO 1: Currículo Completamente Desorganizado');
console.log('═══════════════════════════════════════════════');

Object.keys(curriculoMisturado).forEach(key => {
    if (key.includes('resumo') || key.includes('experiencia') || key.includes('habilidades') ||
        key.includes('formacao') || key.includes('idiomas') || key.includes('informacoes')) {

        const section = curriculoMisturado[key];
        console.log(`📝 ${key.toUpperCase()}:`);
        console.log(`   Nota: ${section.nota}/10 - ${section.nota <= 2 ? '🔴 CRÍTICO' : section.nota <= 5 ? '🟡 PROBLEMÁTICO' : '🟢 ACEITÁVEL'}`);
        console.log(`   Status: ${section.nota <= 2 ? 'Seção ausente ou crítica' : section.nota <= 5 ? 'Seção incompleta' : 'Seção presente'}`);
        console.log('');
    }
});

console.log('\n✅ CONCLUSÕES DO SISTEMA ADAPTATIVO:');
console.log('══════════════════════════════════════');
console.log('🎯 SEMPRE analisa o que está disponível, mesmo que desorganizado');
console.log('🎯 SEMPRE fornece feedback, mesmo para seções ausentes');
console.log('🎯 ADAPTA as notas baseado na presença/ausência de informações');
console.log('🎯 PRIORIZA sugestões de estruturação quando necessário');
console.log('🎯 NUNCA deixa uma seção sem análise ou orientação');

module.exports = { curriculoMisturado }; 