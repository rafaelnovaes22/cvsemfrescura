// Teste: Feedback Empático e Amigável para Currículos com Seções Ausentes
// Mostra como o sistema fornece orientação gentil e encorajadora

console.log('🤗 TESTE: Feedback Empático e Amigável\n');

const feedbackEmpatico = {
    "job_keywords": ["React", "JavaScript", "Node.js", "Scrum"],
    "job_keywords_present": ["JavaScript"],
    "job_keywords_missing": ["React", "Node.js", "Scrum"],

    // FEEDBACK EMPÁTICO E ENCORAJADOR
    "resumo": {
        "nota": 2.5,
        "avaliacao": "Percebi que você tem experiência valiosa em desenvolvimento, o que é um excelente ponto de partida! Para destacar ainda mais seu perfil, seria muito interessante incluir uma seção de resumo profissional no início do currículo. Isso ajudará os recrutadores a entenderem rapidamente suas principais competências e objetivos de carreira.",
        "sugestoes": [
            "Considere criar uma breve introdução (2-3 linhas) destacando sua experiência",
            "Inclua seu objetivo profissional de forma clara e objetiva",
            "Mencione suas principais competências técnicas logo no início",
            "Destaque quantos anos de experiência você possui na área"
        ]
    },

    "experiencia_profissional": {
        "nota": 5.0,
        "avaliacao": "É ótimo ver que você tem experiência profissional relevante na área! Notei algumas informações sobre seus projetos com JavaScript, o que é um ponto muito positivo. Para valorizar ainda mais sua trajetória, seria interessante organizar essas experiências de forma mais estruturada, incluindo detalhes sobre as empresas e períodos trabalhados.",
        "sugestoes": [
            "Organize suas experiências da mais recente para a mais antiga",
            "Inclua nome da empresa, seu cargo e período (ex: Jan 2020 - Dez 2022)",
            "Destaque projetos específicos e tecnologias que você domina",
            "Adicione resultados alcançados quando possível (ex: 'melhorou performance em 30%')"
        ]
    },

    "habilidades": {
        "nota": 4.0,
        "avaliacao": "Vi que você menciona conhecimento em JavaScript, o que é fundamental e muito valorizado no mercado! Para potencializar seu perfil ainda mais, seria excelente criar uma seção específica de habilidades técnicas. Isso facilitará para os recrutadores identificarem rapidamente suas competências.",
        "sugestoes": [
            "Crie uma seção dedicada às suas habilidades técnicas",
            "Organize por categorias: Frontend, Backend, Ferramentas, etc.",
            "Considere incluir React e Node.js se você tem interesse em aprender",
            "Adicione soft skills que são importantes para equipes de desenvolvimento"
        ]
    },

    "formacao": {
        "nota": 2.0,
        "avaliacao": "Acredito que você deve ter uma formação interessante! Seria muito valioso incluir essas informações no seu currículo, pois a educação é um diferencial importante. Mesmo que não tenha curso superior, cursos técnicos, bootcamps ou especializações são muito valorizados na área de tecnologia.",
        "sugestoes": [
            "Inclua sua formação acadêmica principal (ensino superior, técnico, etc.)",
            "Adicione cursos online relevantes que você tenha concluído",
            "Mencione bootcamps, workshops ou eventos de tecnologia que participou",
            "Considere fazer cursos nas tecnologias que aparecem nas vagas de seu interesse"
        ]
    },

    "idiomas": {
        "nota": 1.0,
        "avaliacao": "Que oportunidade incrível para se destacar! Incluir informações sobre idiomas pode ser um grande diferencial no seu currículo. Mesmo um inglês básico para leitura técnica já é um ponto positivo, e muitas vagas na área de tecnologia valorizam esse conhecimento.",
        "sugestoes": [
            "Adicione uma seção de idiomas, mesmo que seja só português nativo + inglês básico",
            "Se tem algum conhecimento de inglês, inclua o nível real (básico, intermediário, etc.)",
            "Considere estudar inglês técnico, que é muito valorizado na área",
            "Mencione se consegue ler documentação técnica em inglês"
        ]
    },

    "informacoes_pessoais": {
        "nota": 6.5,
        "avaliacao": "Suas informações de contato estão organizadas, o que é fundamental! Para profissionais de tecnologia, seria muito interessante incluir links para mostrar seu trabalho, como LinkedIn atualizado e especialmente GitHub com seus projetos. Isso permite que os recrutadores vejam seu código e projetos práticos.",
        "sugestoes": [
            "Mantenha LinkedIn sempre atualizado com suas experiências mais recentes",
            "Crie um perfil no GitHub e inclua alguns projetos pessoais",
            "Considere adicionar seu portfólio online se tiver",
            "Mencione se tem disponibilidade para trabalho remoto/híbrido"
        ]
    },

    "recommendations": [
        "Seu currículo tem uma base sólida! Foque primeiro em organizar as informações já existentes",
        "Considere criar as seções que estão faltando - cada uma adicionará valor ao seu perfil",
        "Lembre-se: todo profissional pode aprender novas tecnologias - destaque sua vontade de crescer",
        "Seja autêntico sobre seu nível atual e mostre interesse em se desenvolver nas áreas necessárias"
    ],

    "conclusion": "Você tem um ótimo potencial! Seu currículo mostra experiência em JavaScript e interesse genuíno pela área de desenvolvimento. Com algumas melhorias na organização e adição de algumas seções importantes, seu perfil ficará muito mais atrativo para as vagas que você busca. Lembre-se: todo grande desenvolvedor começou de algum lugar, e o que importa é mostrar sua dedicação e vontade de aprender!"
};

console.log('📝 EXEMPLOS DE FEEDBACK EMPÁTICO POR SEÇÃO:');
console.log('═══════════════════════════════════════════════\n');

Object.keys(feedbackEmpatico).forEach(key => {
    if (key.includes('resumo') || key.includes('experiencia') || key.includes('habilidades') ||
        key.includes('formacao') || key.includes('idiomas') || key.includes('informacoes')) {

        const section = feedbackEmpatico[key];
        const emoji = section.nota <= 2 ? '🌱' : section.nota <= 5 ? '🌿' : '🌳';
        const status = section.nota <= 2 ? 'Oportunidade de Crescimento' :
            section.nota <= 5 ? 'Bom Potencial' : 'Muito Bem!';

        console.log(`${emoji} ${key.toUpperCase()}: ${section.nota}/10 - ${status}`);
        console.log(`💬 "${section.avaliacao}"`);
        console.log(`💡 Sugestões Amigáveis: ${section.sugestoes.length} orientações construtivas\n`);
    }
});

console.log('✨ CARACTERÍSTICAS DO FEEDBACK EMPÁTICO:');
console.log('══════════════════════════════════════════');
console.log('🤗 SEMPRE começa com algo positivo');
console.log('🌱 Vê problemas como oportunidades de crescimento');
console.log('💪 Encoraja o candidato e reconhece o esforço');
console.log('🎯 Fornece orientação específica mas gentil');
console.log('🚀 Foca no potencial ao invés dos problemas');
console.log('❤️ Usa linguagem humana e calorosa');

module.exports = { feedbackEmpatico }; 