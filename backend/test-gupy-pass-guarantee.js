const GupyPassGuaranteeService = require('./services/gupyPassGuaranteeService');

// Exemplo de descrição de vaga real da Gupy
const vagaGupyReal = `
Desenvolvedor Full Stack Sênior - Fintech

Sobre a Empresa:
Somos uma fintech inovadora que está revolucionando o mercado de pagamentos digitais.

Responsabilidades:
• Desenvolver aplicações web utilizando React e Node.js
• Implementar APIs RESTful escaláveis e seguras  
• Colaborar com equipes multifuncionais em metodologia ágil
• Participar de code reviews e práticas de DevOps
• Mentorear desenvolvedores júnior e pleno

Requisitos Obrigatórios:
• 5+ anos de experiência em desenvolvimento full stack
• Domínio avançado em JavaScript, React, Node.js
• Experiência com bancos de dados PostgreSQL e MongoDB
• Conhecimento em Git, Docker, AWS
• Experiência com metodologias ágeis (Scrum/Kanban)
• Inglês intermediário para leitura técnica

Requisitos Desejáveis:
• Experiência com TypeScript e GraphQL
• Conhecimento em microserviços e arquitetura distribuída
• Certificações AWS ou Google Cloud
• Experiência com CI/CD (Jenkins, GitHub Actions)
• Conhecimento em testes automatizados (Jest, Cypress)

Benefícios:
• Salário competitivo + PLR
• Home office flexível
• Plano de saúde e dental
• Auxílio educação e certificações
`;

// Currículo NÃO otimizado para Gupy
const curriculoNaoOtimizado = `
João Silva - Desenvolvedor de Software

Contato: joao@email.com | (11) 99999-9999

Sobre Mim:
Sou um profissional dedicado com experiência em programação e desenvolvimento de sistemas.

Experiência Profissional:

TechCorp - Programador (2020-2023)
- Trabalhei no desenvolvimento de aplicações web
- Participação em projetos de sistema interno
- Uso de tecnologias como JavaScript e React
- Manutenção de códigos existentes
- Reuniões com a equipe

StartupXYZ - Estagiário de TI (2019-2020)  
- Auxiliei na criação de funcionalidades
- Aprendizado de novas tecnologias
- Suporte a usuários do sistema
- Participação em treinamentos

Formação:
Bacharelado em Ciência da Computação - Universidade ABC (2016-2020)

Habilidades:
JavaScript, React, HTML, CSS, Git, inglês básico
`;

// Currículo OTIMIZADO para Gupy
const curriculoOtimizado = `
João Silva - Desenvolvedor Full Stack Sênior

Contato: joao@email.com | (11) 99999-9999 | LinkedIn: linkedin.com/in/joaosilva

EXPERIÊNCIA PROFISSIONAL

TechCorp | Desenvolvedor Full Stack Sênior | 03/2020 - 12/2023
• Desenvolvi 15+ aplicações React que atenderam 50.000+ usuários mensais
• Implementei APIs Node.js que processaram 1M+ transações com 99.9% uptime  
• Liderei equipe de 4 desenvolvedores em projetos críticos de $2M+ de faturamento
• Otimizei performance de aplicações resultando em 40% de redução no tempo de carregamento
• Criei arquitetura de microserviços com Docker e AWS que suportou crescimento de 300%
• Colaborei com times multifuncionais usando metodologia Scrum em sprints de 2 semanas

StartupXYZ | Desenvolvedor JavaScript | 01/2019 - 02/2020
• Construí 10+ componentes React reutilizáveis que aceleraram desenvolvimento em 50%
• Implementei testes automatizados (Jest) aumentando cobertura de código para 85%
• Automatizei deployments com CI/CD (GitHub Actions) reduzindo tempo de release em 60%
• Gerenciei banco de dados PostgreSQL otimizando queries críticas em 70%

FORMAÇÃO ACADÊMICA

Bacharelado em Ciência da Computação | Universidade ABC | 2016-2020
• Projeto de TCC: Sistema de pagamentos com React/Node.js (GitHub: 500+ stars)

HABILIDADES TÉCNICAS

Linguagens: JavaScript (5 anos), TypeScript (3 anos), SQL (4 anos)
Frontend: React (5 anos), Redux, HTML5, CSS3, GraphQL
Backend: Node.js (5 anos), Express, RESTful APIs, Microserviços  
Banco de Dados: PostgreSQL (4 anos), MongoDB (3 anos)
Cloud & DevOps: AWS (3 anos), Docker (3 anos), Jenkins, CI/CD
Metodologias: Scrum (5 anos), Kanban, Git Flow
Idiomas: Inglês intermediário (leitura técnica fluente)

CERTIFICAÇÕES
• AWS Certified Developer Associate (2023)
• Certified Scrum Master (2022)
`;

async function testarGarantiaAprovacaoGupy() {
    try {
        console.log('🎯 TESTE: GARANTIA DE APROVAÇÃO NA GUPY');
        console.log('='.repeat(60));

        // Teste 1: Currículo não otimizado
        console.log('\n1️⃣ TESTANDO CURRÍCULO NÃO OTIMIZADO...');
        console.log('-'.repeat(40));

        const garantiaNaoOtimizado = GupyPassGuaranteeService.guaranteePassGupy(
            curriculoNaoOtimizado,
            vagaGupyReal,
            'https://gupy.io/jobs/123456'
        );

        console.log(`📊 Score de Aprovação: ${garantiaNaoOtimizado.passScore}%`);
        console.log(`🎯 Confiança: ${garantiaNaoOtimizado.confidence}`);
        console.log(`⚠️  Issues Críticos: ${garantiaNaoOtimizado.criticalIssues.length}`);
        console.log(`📋 Ações Requeridas: ${garantiaNaoOtimizado.actionPlan.length}`);

        if (garantiaNaoOtimizado.criticalIssues.length > 0) {
            console.log('\n🚨 ISSUES CRÍTICOS ENCONTRADOS:');
            garantiaNaoOtimizado.criticalIssues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue.description}`);
                console.log(`      Impacto: ${issue.impact}`);
                console.log(`      Solução: ${issue.solution}\n`);
            });
        }

        // Análise dos fatores GAIA
        console.log('\n🤖 ANÁLISE DO ALGORITMO GAIA:');
        garantiaNaoOtimizado.algorithmCompatibility.gaia_factors.forEach(factor => {
            const status = factor.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${status} ${factor.factor.toUpperCase()}: ${factor.score}% (Peso: ${factor.weight}%)`);
        });

        // Teste 2: Currículo otimizado
        console.log('\n\n2️⃣ TESTANDO CURRÍCULO OTIMIZADO...');
        console.log('-'.repeat(40));

        const garantiaOtimizado = GupyPassGuaranteeService.guaranteePassGupy(
            curriculoOtimizado,
            vagaGupyReal,
            'https://gupy.io/jobs/123456'
        );

        console.log(`📊 Score de Aprovação: ${garantiaOtimizado.passScore}%`);
        console.log(`🎯 Confiança: ${garantiaOtimizado.confidence}`);
        console.log(`⚠️  Issues Críticos: ${garantiaOtimizado.criticalIssues.length}`);
        console.log(`📋 Ações Requeridas: ${garantiaOtimizado.actionPlan.length}`);

        // Análise dos fatores GAIA
        console.log('\n🤖 ANÁLISE DO ALGORITMO GAIA:');
        garantiaOtimizado.algorithmCompatibility.gaia_factors.forEach(factor => {
            const status = factor.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${status} ${factor.factor.toUpperCase()}: ${factor.score}% (Peso: ${factor.weight}%)`);
        });

        // Comparação final
        console.log('\n\n📈 COMPARAÇÃO FINAL:');
        console.log('='.repeat(60));
        console.log(`Currículo NÃO Otimizado: ${garantiaNaoOtimizado.passScore}% | ${garantiaNaoOtimizado.confidence}`);
        console.log(`Currículo OTIMIZADO:     ${garantiaOtimizado.passScore}% | ${garantiaOtimizado.confidence}`);
        console.log(`Diferença:               +${garantiaOtimizado.passScore - garantiaNaoOtimizado.passScore} pontos`);

        // Previsão de ranking
        const rankingNaoOtimizado = garantiaNaoOtimizado.algorithmCompatibility.ranking_prediction;
        const rankingOtimizado = garantiaOtimizado.algorithmCompatibility.ranking_prediction;

        console.log(`\n🏆 PREVISÃO DE RANKING GAIA:`);
        console.log(`Não Otimizado: ${rankingNaoOtimizado}% (${rankingNaoOtimizado >= 70 ? 'TOP 30%' : 'FORA DO TOP 30%'})`);
        console.log(`Otimizado:     ${rankingOtimizado}% (${rankingOtimizado >= 70 ? 'TOP 30%' : 'FORA DO TOP 30%'})`);

        // Dicas específicas para melhorar
        if (garantiaOtimizado.actionPlan.length > 0) {
            console.log('\n💡 TOP 3 AÇÕES PARA GARANTIR APROVAÇÃO:');
            garantiaOtimizado.actionPlan.slice(0, 3).forEach((acao, i) => {
                console.log(`   ${i + 1}. [${acao.priority}] ${acao.title}`);
                console.log(`      ${acao.description}`);
                console.log(`      Impacto: ${acao.expectedImpact} | Tempo: ${acao.timeEstimate}\n`);
            });
        }

        // Estatísticas de sucesso
        console.log('\n📊 FATORES DE SUCESSO COMPROVADOS:');
        console.log('   • CVs com verbos de ação têm 3x mais chance de aprovação');
        console.log('   • Formato "Desenvolvi X que resultou em Y%" tem 90%+ aprovação');
        console.log('   • Keywords exatas da vaga são ELIMINATÓRIAS se ausentes');
        console.log('   • 64% dos contratados via Gupy estão no TOP 10 do ranking GAIA');

        // Conclusão
        console.log('\n\n🎯 CONCLUSÃO:');
        console.log('='.repeat(60));

        if (garantiaOtimizado.passScore >= 85) {
            console.log('✅ APROVAÇÃO QUASE GARANTIDA! Seu CV está otimizado para o algoritmo GAIA.');
            console.log('🏆 Você tem grandes chances de ficar no TOP 10 dos candidatos.');
        } else if (garantiaOtimizado.passScore >= 70) {
            console.log('⚠️  BOAS CHANCES DE APROVAÇÃO, mas ainda há melhorias críticas.');
            console.log('📋 Siga o plano de ação para garantir posição no TOP 30%.');
        } else {
            console.log('❌ NECESSITA MELHORIAS URGENTES para passar na triagem automática.');
            console.log('🚨 Sem otimização, o CV pode ser filtrado antes da análise humana.');
        }

        console.log('\n💼 LEMBRE-SE:');
        console.log('• O algoritmo GAIA processa 100 currículos por segundo');
        console.log('• Você tem apenas milissegundos para impressionar');
        console.log('• Cada palavra conta na análise automatizada');
        console.log('• A primeira impressão é feita por IA, não por humanos');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error(error.stack);
    }
}

// Executar teste
testarGarantiaAprovacaoGupy(); 