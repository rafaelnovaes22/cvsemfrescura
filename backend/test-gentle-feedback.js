// Teste: Feedback Ultra Gentil - Sem Termos Impactantes
// Mostra como o sistema sempre encoraja, mesmo em casos difíceis

console.log('🌸 TESTE: Feedback Ultra Gentil e Inspirador\n');

const feedbackGentil = {
    "job_keywords": ["React", "JavaScript", "Node.js", "Scrum"],
    "job_keywords_present": ["JavaScript"],
    "job_keywords_missing": ["React", "Node.js", "Scrum"],

    // FEEDBACK ULTRA GENTIL - SEM IMPACTO NEGATIVO
    "resumo": {
        "nota": 1.5,
        "avaliacao": "Vejo que você tem experiência valiosa na área de desenvolvimento! Criar uma seção de resumo profissional seria uma excelente forma de destacar ainda mais seu talento e facilitar para os recrutadores conhecerem rapidamente suas competências. Isso será um grande diferencial para mostrar sua jornada profissional.",
        "sugestoes": [
            "Considere incluir uma breve apresentação pessoal (2-3 linhas)",
            "Destaque seus anos de experiência e área de especialização",
            "Mencione suas principais conquistas profissionais",
            "Inclua seu objetivo de carreira de forma inspiradora"
        ]
    },

    "experiencia_profissional": {
        "nota": 4.8,
        "avaliacao": "Que legal ver sua trajetória profissional! Você tem experiência relevante e conhecimento em JavaScript, que é fundamental no mercado. Para valorizar ainda mais essa experiência incrível, seria interessante organizá-la de forma que mostre toda sua evolução e conquistas ao longo do tempo.",
        "sugestoes": [
            "Organize cronologicamente para mostrar sua progressão",
            "Inclua resultados específicos que você alcançou",
            "Destaque projetos que demonstrem seu crescimento",
            "Adicione tecnologias e ferramentas que domina"
        ]
    },

    "habilidades": {
        "nota": 3.8,
        "avaliacao": "Notei que você tem conhecimento em JavaScript - que base sólida! Essa é uma competência muito valorizada. Criar uma seção dedicada às suas habilidades seria uma forma fantástica de mostrar toda sua versatilidade e competências técnicas de uma forma organizada e atrativa.",
        "sugestoes": [
            "Crie uma seção específica para destacar suas skills",
            "Organize por categorias (Frontend, Backend, Ferramentas)",
            "Inclua tecnologias que tem interesse em aprender",
            "Adicione soft skills que demonstram seu perfil colaborativo"
        ]
    },

    "formacao": {
        "nota": 1.2,
        "avaliacao": "Sua jornada de aprendizado é única e valiosa! Incluir informações sobre sua formação será uma forma maravilhosa de mostrar seu comprometimento com o crescimento. Seja formação tradicional, cursos online, bootcamps ou autodidatismo - tudo conta e é valorizado no mercado de tecnologia.",
        "sugestoes": [
            "Inclua qualquer formação que contribuiu para seu desenvolvimento",
            "Adicione cursos relevantes, mesmo que online",
            "Mencione especializações ou certificações",
            "Destaque sua capacidade de aprendizado contínuo"
        ]
    },

    "idiomas": {
        "nota": 0.8,
        "avaliacao": "Que oportunidade maravilhosa para se destacar ainda mais! Incluir uma seção de idiomas pode ser um diferencial incrível no seu perfil. Mesmo conhecimentos básicos são valiosos - muitos profissionais de tecnologia começaram assim e desenvolveram fluência ao longo da carreira.",
        "sugestoes": [
            "Inclua português nativo como primeiro idioma",
            "Adicione qualquer nível de inglês, mesmo básico",
            "Mencione se consegue acompanhar conteúdo técnico em inglês",
            "Considere isso como uma área de desenvolvimento futuro"
        ]
    },

    "informacoes_pessoais": {
        "nota": 6.8,
        "avaliacao": "Suas informações de contato estão bem organizadas - isso é fundamental! Para um profissional de tecnologia, incluir links para portfólio online seria uma forma fantástica de mostrar seus projetos e código. LinkedIn e GitHub são como sua vitrine profissional digital.",
        "sugestoes": [
            "Mantenha LinkedIn sempre atualizado",
            "Considere criar um perfil no GitHub para mostrar códigos",
            "Inclua qualquer portfólio ou projeto pessoal",
            "Adicione informações sobre modalidade de trabalho preferida"
        ]
    },

    "recommendations": [
        "Você tem uma base excelente para construir um perfil incrível!",
        "Cada seção que desenvolver adicionará mais valor ao seu currículo",
        "Lembre-se: todo expert foi iniciante um dia - o importante é a jornada",
        "Sua experiência com JavaScript já mostra seu potencial na área",
        "Continue desenvolvendo - o mercado valoriza profissionais em crescimento!"
    ],

    "conclusion": "Que jornada inspiradora você está construindo! Seu perfil mostra potencial real e experiência valiosa com JavaScript. Com alguns ajustes organizacionais e adição de algumas seções, seu currículo vai brilhar ainda mais. O importante é que você está no caminho certo - cada passo conta nessa jornada de crescimento profissional. Continue assim!"
};

console.log('🌸 EXEMPLOS DE FEEDBACK ULTRA GENTIL:');
console.log('═════════════════════════════════════════\n');

Object.keys(feedbackGentil).forEach(key => {
    if (key.includes('resumo') || key.includes('experiencia') || key.includes('habilidades') ||
        key.includes('formacao') || key.includes('idiomas') || key.includes('informacoes')) {

        const section = feedbackGentil[key];
        const emoji = section.nota <= 2 ? '🌱' : section.nota <= 5 ? '🌿' : '🌳';
        const status = section.nota <= 2 ? 'Área para Desenvolver' :
            section.nota <= 5 ? 'Em Crescimento' : 'Muito Bem Desenvolvida';

        console.log(`${emoji} ${key.toUpperCase()}: ${section.nota}/10 - ${status}`);
        console.log(`💝 "${section.avaliacao}"`);
        console.log(`🌟 Sugestões Inspiradoras: ${section.sugestoes.length} orientações gentis\n`);
    }
});

console.log('🌸 CARACTERÍSTICAS DO FEEDBACK ULTRA GENTIL:');
console.log('═══════════════════════════════════════════');
console.log('💕 SEMPRE reconhece valor e potencial');
console.log('🌱 Zero termos negativos ou impactantes');
console.log('✨ Transforma "problemas" em "oportunidades"');
console.log('🎯 Linguagem inspiradora e motivacional');
console.log('🌟 Foca na jornada de crescimento');
console.log('💪 Encoraja desenvolvimento contínuo');
console.log('🌈 Celebra cada conquista, por menor que seja');

module.exports = { feedbackGentil }; 