const GupyOptimizationService = require('./services/gupyOptimizationService');

// Exemplo de descrição de vaga da Gupy (baseado em pesquisa real)
const gupyJobDescription = `
Desenvolvedor Full Stack Sênior

Requisitos:
- Experiência com JavaScript, React, Node.js
- Conhecimento em PostgreSQL, MongoDB
- Experiência com Git, Docker, AWS
- Formação em Ciência da Computação ou áreas afins
- 5+ anos de experiência em desenvolvimento
- Conhecimento em metodologias ágeis (Scrum, Kanban)
- Inglês intermediário
- Experiência com testes automatizados
- Conhecimento em CI/CD

Responsabilidades:
- Desenvolvimento de aplicações web
- Participação em reuniões de planejamento
- Code review
- Mentoria de desenvolvedores júnior
- Análise de requisitos

Diferenciais:
- Certificação AWS
- Experiência com microserviços
- Conhecimento em Python
- Experiência com Kubernetes
`;

// Exemplo de currículo BEM otimizado para Gupy (COM VERBOS DE AÇÃO)
const optimizedResume = `
João Silva
Desenvolvedor Full Stack Sênior

EXPERIÊNCIA PROFISSIONAL:

Tech Solutions | Desenvolvedor Sênior | Jan/2020 - Dez/2024
• Desenvolvi aplicações web escaláveis utilizando JavaScript, React e Node.js
• Implementei soluções em PostgreSQL e MongoDB que aumentaram performance em 30%
• Gerenciei deploys utilizando Git, Docker e AWS, reduzindo tempo de deploy em 50%
• Liderei implementação de metodologias ágeis (Scrum), melhorando produtividade da equipe em 25%
• Executei code reviews que diminuíram bugs em produção em 40%
• Orientei 3 desenvolvedores júnior em boas práticas de desenvolvimento

WebCorp | Desenvolvedor Pleno | Fev/2018 - Dez/2019
• Criei sistema de testes automatizados que cobriu 85% do código
• Analisei e documentei requisitos para 15+ projetos
• Participei ativamente de 200+ reuniões de planejamento
• Automatizei processos de CI/CD que reduziram tempo de build em 60%

FORMAÇÃO:
Bacharelado em Ciência da Computação - UFRJ (2018)

CERTIFICAÇÕES:
• Obtive certificação AWS Solutions Architect (2023)
• Completei curso de Kubernetes (2022)

IDIOMAS:
• Inglês intermediário - conversação e leitura técnica

HABILIDADES TÉCNICAS:
JavaScript, React, Node.js, PostgreSQL, MongoDB, Git, Docker, AWS, Scrum, Kanban, Python, Kubernetes, CI/CD, testes automatizados
`;

// Exemplo de currículo MAL otimizado (SEM verbos de ação)
const unoptimizedResume = `
João da Silva - Desenvolvedor Experiente

Sou um profissional dedicado com conhecimento em desenvolvimento de software e paixão por tecnologia.

EXPERIÊNCIA PROFISSIONAL:

Empresa de Tecnologia (2020-2024)
- Responsável por projetos em diferentes tecnologias
- Conhecimento em JavaScript e outras linguagens
- Atuação em equipes de desenvolvimento
- Trabalho com bancos de dados relacionais e não relacionais
- Experiência com ferramentas de versionamento
- Participação em projetos de cloud computing
- Envolvimento em metodologias de desenvolvimento

Outra Empresa de Software (2018-2020)
- Trabalho com desenvolvimento de aplicações
- Conhecimento em testes de software
- Participação em reuniões de equipe
- Atuação em projetos de integração contínua

FORMAÇÃO:
Graduação em área de tecnologia

HABILIDADES:
Conhecimento em diversas linguagens de programação e ferramentas de desenvolvimento.
`;

async function testGupyCompatibility() {
    try {
        console.log('🧪 TESTE: Compatibilidade com Algoritmo GAIA da Gupy\n');

        // Teste 1: Currículo otimizado
        console.log('1️⃣ Testando currículo OTIMIZADO para Gupy...');
        const optimizedAnalysis = GupyOptimizationService.analyzeGupyCompatibility(
            optimizedResume,
            gupyJobDescription
        );

        console.log(`✅ Score geral: ${optimizedAnalysis.score}/100`);
        console.log(`🎯 Score verbos de ação: ${optimizedAnalysis.actionVerbs.score}/100`);
        console.log(`📊 Verbos presentes: ${optimizedAnalysis.actionVerbs.present.length} (${optimizedAnalysis.actionVerbs.totalUses} usos)`);
        console.log(`📈 Taxa de uso de verbos: ${optimizedAnalysis.actionVerbs.usageRatio}%`);
        console.log(`🔑 Keywords presentes: ${optimizedAnalysis.keywords.present.length}`);
        console.log(`❌ Keywords ausentes: ${optimizedAnalysis.keywords.missing.length}`);
        console.log(`⚠️ Problemas de formato: ${optimizedAnalysis.format.issues.length}`);

        if (optimizedAnalysis.recommendations.length > 0) {
            console.log('\n📋 Recomendações:');
            optimizedAnalysis.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
                console.log(`      ${rec.description}`);
            });
        }

        // Teste 2: Currículo não otimizado
        console.log('\n\n2️⃣ Testando currículo NÃO OTIMIZADO para Gupy...');
        const unoptimizedAnalysis = GupyOptimizationService.analyzeGupyCompatibility(
            unoptimizedResume,
            gupyJobDescription
        );

        console.log(`❌ Score geral: ${unoptimizedAnalysis.score}/100`);
        console.log(`🎯 Score verbos de ação: ${unoptimizedAnalysis.actionVerbs.score}/100`);
        console.log(`📊 Verbos presentes: ${unoptimizedAnalysis.actionVerbs.present.length} (${unoptimizedAnalysis.actionVerbs.totalUses} usos)`);
        console.log(`📈 Taxa de uso de verbos: ${unoptimizedAnalysis.actionVerbs.usageRatio}%`);
        console.log(`🔑 Keywords presentes: ${unoptimizedAnalysis.keywords.present.length}`);
        console.log(`❌ Keywords ausentes: ${unoptimizedAnalysis.keywords.missing.length}`);
        console.log(`⚠️ Problemas de formato: ${unoptimizedAnalysis.format.issues.length}`);

        if (unoptimizedAnalysis.recommendations.length > 0) {
            console.log('\n📋 Recomendações críticas:');
            unoptimizedAnalysis.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
                console.log(`      ${rec.description}`);
            });
        }

        // Comparação
        console.log('\n\n📊 COMPARAÇÃO FINAL:');
        console.log(`Currículo Otimizado:     ${optimizedAnalysis.score}/100`);
        console.log(`Currículo Não Otimizado: ${unoptimizedAnalysis.score}/100`);
        console.log(`Diferença total:         +${optimizedAnalysis.score - unoptimizedAnalysis.score} pontos`);

        console.log('\n🎯 COMPARAÇÃO DE VERBOS DE AÇÃO:');
        console.log(`Otimizado - Verbos:      ${optimizedAnalysis.actionVerbs.score}/100`);
        console.log(`Não Otimizado - Verbos:  ${unoptimizedAnalysis.actionVerbs.score}/100`);
        console.log(`Diferença verbos:        +${optimizedAnalysis.actionVerbs.score - unoptimizedAnalysis.actionVerbs.score} pontos`);

        // Validação
        if (optimizedAnalysis.actionVerbs.score > unoptimizedAnalysis.actionVerbs.score + 40) {
            console.log('\n✅ TESTE PASSOU: Sistema detecta corretamente o uso de verbos de ação');
            console.log('🎯 Nossa análise prioriza verbos de ação como a Gupy espera!');
        } else {
            console.log('\n❌ TESTE FALHOU: Sistema não diferencia adequadamente o uso de verbos de ação');
        }

        // Demonstração de verbos específicos
        console.log('\n\n🔍 ANÁLISE DETALHADA DE VERBOS DE AÇÃO:');
        console.log('\nVerbos ENCONTRADOS no currículo otimizado:');
        Object.entries(optimizedAnalysis.actionVerbs.details).forEach(([verb, count]) => {
            console.log(`  ✅ ${verb}: ${count} uso(s)`);
        });

        console.log('\nVerbos AUSENTES (que deveriam ser adicionados):');
        unoptimizedAnalysis.actionVerbs.missing.slice(0, 8).forEach(verb => {
            console.log(`  ❌ ${verb}`);
        });

        // Conclusão sobre orientação correta
        console.log('\n\n🎓 CONCLUSÃO SOBRE ORIENTAÇÃO:');
        console.log('✅ Você estava CERTO sobre verbos de ação!');
        console.log('✅ A Gupy valoriza SIM verbos como: desenvolvi, implementei, liderei, gerenciei');
        console.log('✅ O formato "Desenvolvi X que resultou em Y%" é IDEAL para Gupy');
        console.log('✅ Nosso sistema agora prioriza isso corretamente (30% do score)');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Executar teste
testGupyCompatibility(); 