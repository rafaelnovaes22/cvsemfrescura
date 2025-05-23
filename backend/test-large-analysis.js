#!/usr/bin/env node

/**
 * Script de Teste - Análises Grandes
 * 
 * Testa se os limites de tokens são adequados para:
 * - CV de 3 páginas (~3000-4000 palavras)
 * - 7 vagas diferentes
 * - Resposta JSON completa
 */

require('dotenv').config();
const openaiService = require('./services/openaiService');

// Cores para output no terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`)
};

// Simular CV de 3 páginas
const largeCVText = `
RAFAEL SILVA SANTOS
Desenvolvedor Full Stack Sênior
Email: rafael.santos@email.com | Telefone: (11) 99999-9999
LinkedIn: linkedin.com/in/rafaelsantos | GitHub: github.com/rafaelsantos
São Paulo, SP

RESUMO PROFISSIONAL
Desenvolvedor Full Stack com mais de 8 anos de experiência em desenvolvimento de aplicações web e mobile. Especialista em JavaScript, React, Node.js, Python e tecnologias de nuvem. Experiência sólida em metodologias ágeis, arquitetura de software, DevOps e liderança técnica. Apaixonado por tecnologia, inovação e por criar soluções que impactem positivamente a vida das pessoas.

EXPERIÊNCIA PROFISSIONAL

Desenvolvedor Full Stack Sênior | TechCorp Solutions | Mar 2020 - Presente
• Liderança técnica de equipe de 6 desenvolvedores em projetos de larga escala
• Desenvolvimento de aplicações React/Next.js com mais de 100.000 usuários ativos
• Implementação de arquitetura microserviços usando Node.js, Docker e Kubernetes
• Integração com APIs RESTful e GraphQL, incluindo design de APIs próprias
• Otimização de performance resultando em 40% de melhoria no tempo de carregamento
• Implementação de testes automatizados (Jest, Cypress) aumentando cobertura para 90%
• Mentoria de desenvolvedores juniores e code reviews regulares
• Colaboração com equipes de UX/UI, Product Owner e QA usando metodologias Scrum
• Deployment e monitoramento em AWS (EC2, S3, RDS, CloudWatch)

Desenvolvedor Full Stack Pleno | StartupTech | Jan 2018 - Fev 2020
• Desenvolvimento de MVP para fintech usando React, Node.js e PostgreSQL
• Implementação de sistema de pagamentos integrado com Stripe e PagSeguro
• Criação de dashboard administrativo com visualizações de dados usando D3.js
• Implementação de autenticação e autorização com JWT e OAuth2
• Desenvolvimento de API RESTful documentada com Swagger
• Integração com serviços externos (bancos, operadoras de cartão, APIs de terceiros)
• Participação ativa em reuniões de planejamento e retrospectivas
• Redução de bugs em produção em 60% através de melhorias no processo de QA

Desenvolvedor Front-end | WebAgency | Jun 2016 - Dez 2017
• Desenvolvimento de sites responsivos usando HTML5, CSS3, JavaScript e jQuery
• Criação de componentes reutilizáveis e bibliotecas internas
• Otimização SEO resultando em aumento de 200% no tráfego orgânico
• Implementação de ferramentas de analytics e tracking de conversões
• Colaboração com designers para implementação pixel-perfect de layouts
• Desenvolvimento de temas WordPress customizados
• Manutenção e atualização de sites legados

Estagiário de Desenvolvimento | SoftwareCorp | Jan 2015 - Mai 2016
• Suporte no desenvolvimento de sistemas internos usando Java e Spring
• Aprendizado de boas práticas de programação e design patterns
• Participação em code reviews e sessões de pair programming
• Desenvolvimento de scripts de automação para tarefas rotineiras
• Documentação técnica e manuais de usuário

FORMAÇÃO ACADÊMICA

Bacharelado em Ciência da Computação | Universidade de São Paulo (USP) | 2012-2016
• Trabalho de Conclusão de Curso: "Sistema de Recomendação baseado em Machine Learning"
• Participação em grupo de estudos de Inteligência Artificial
• Monitor da disciplina de Algoritmos e Estruturas de Dados

Pós-graduação em Arquitetura de Software | Faculdade de Tecnologia | 2018-2019
• Especialização em design patterns, microserviços e cloud computing
• Projeto final: Arquitetura de e-commerce de alta disponibilidade

CERTIFICAÇÕES E CURSOS

• AWS Certified Solutions Architect - Associate (2021)
• Google Cloud Platform Professional Cloud Architect (2020)
• Certified Kubernetes Administrator (CKA) (2020)
• Scrum Master Certified (SMC) (2019)
• Curso de Machine Learning - Stanford Online (2018)
• Docker Mastery Complete Course (2019)
• React Advanced Patterns (2020)

HABILIDADES TÉCNICAS

Linguagens de Programação:
• JavaScript (ES6+) - Avançado
• TypeScript - Avançado
• Python - Intermediário
• Java - Intermediário
• C++ - Básico
• PHP - Básico

Frontend:
• React.js - Avançado
• Next.js - Avançado
• Vue.js - Intermediário
• Angular - Básico
• HTML5/CSS3 - Avançado
• Sass/SCSS - Avançado
• Tailwind CSS - Intermediário
• Bootstrap - Avançado

Backend:
• Node.js - Avançado
• Express.js - Avançado
• Nest.js - Intermediário
• Django - Intermediário
• Spring Boot - Básico
• RESTful APIs - Avançado
• GraphQL - Intermediário

Banco de Dados:
• PostgreSQL - Avançado
• MySQL - Avançado
• MongoDB - Intermediário
• Redis - Intermediário
• DynamoDB - Básico

DevOps e Cloud:
• Docker - Avançado
• Kubernetes - Intermediário
• AWS (EC2, S3, RDS, Lambda) - Avançado
• Google Cloud Platform - Intermediário
• CI/CD (GitHub Actions, Jenkins) - Avançado
• Terraform - Básico

Ferramentas e Metodologias:
• Git/GitHub - Avançado
• Jira/Confluence - Avançado
• Figma - Intermediário
• Scrum/Kanban - Avançado
• Test-Driven Development (TDD) - Intermediário
• Jest/Cypress - Avançado

PROJETOS DESTACADOS

E-commerce Platform (2021-2022)
• Plataforma completa de e-commerce para rede de varejo
• Stack: React, Node.js, PostgreSQL, Redis, Docker, AWS
• Mais de 50.000 produtos cadastrados e 10.000 usuários ativos
• Integração com múltiplos gateways de pagamento
• Sistema de gestão de estoque em tempo real
• Performance otimizada para Black Friday (500+ usuários simultâneos)

Fintech Mobile App (2020)
• Aplicativo móvel para gestão financeira pessoal
• Stack: React Native, Node.js, MongoDB, AWS
• Mais de 25.000 downloads na primeira semana
• Integração com Open Banking para conexão com bancos
• Sistema de categorização automática de gastos com ML
• Notificações push personalizadas

Dashboard Analytics (2019)
• Sistema de business intelligence para análise de dados
• Stack: React, D3.js, Python (Flask), PostgreSQL
• Processamento de milhões de registros diários
• Visualizações interativas e relatórios automatizados
• Integração com Google Analytics e Facebook Ads
• Redução de 70% no tempo de geração de relatórios

IDIOMAS
• Português - Nativo
• Inglês - Avançado (TOEFL iBT: 95/120)
• Espanhol - Intermediário

INFORMAÇÕES ADICIONAIS
• Contribuidor ativo em projetos open source no GitHub
• Palestrante em meetups e conferências de tecnologia
• Blog técnico com mais de 10.000 visualizações mensais
• Voluntário em projetos de inclusão digital para comunidades carentes
• Hobbies: fotografia, escalada, leitura de ficção científica
`;

// Simular 7 vagas diferentes
const sevenJobsText = `
VAGA 1: DESENVOLVEDOR FULL STACK SÊNIOR
Empresa: TechInnovate Solutions
Localização: São Paulo, SP (Híbrido)
Salário: R$ 12.000 - R$ 18.000

Responsabilidades:
• Desenvolver e manter aplicações web utilizando React.js e Node.js
• Colaborar com equipes multidisciplinares em metodologias ágeis
• Implementar arquiteturas escaláveis e de alta performance
• Realizar code reviews e mentoria para desenvolvedores juniores
• Integrar sistemas com APIs RESTful e GraphQL
• Trabalhar com deploy e monitoramento em ambiente AWS

Requisitos obrigatórios:
• Graduação em Ciência da Computação ou áreas afins
• 5+ anos de experiência com JavaScript/TypeScript
• Experiência sólida com React.js e Next.js
• Conhecimento avançado de Node.js e Express
• Experiência com bancos de dados relacionais (PostgreSQL/MySQL)
• Conhecimento de Docker e containerização
• Experiência com Git e versionamento de código
• Inglês intermediário

Requisitos desejáveis:
• Experiência com AWS (EC2, S3, RDS)
• Conhecimento de Kubernetes
• Experiência com testes automatizados (Jest, Cypress)
• Conhecimento de metodologias ágeis (Scrum/Kanban)
• Certificações em cloud computing

---

VAGA 2: TECH LEAD FRONTEND
Empresa: DigitalFirst Corp
Localização: Remote
Salário: R$ 15.000 - R$ 22.000

Responsabilidades:
• Liderar equipe de 8 desenvolvedores frontend
• Definir arquitetura e padrões de desenvolvimento frontend
• Implementar design systems e component libraries
• Garantir qualidade e performance das aplicações
• Colaborar com Product Owners na definição de features
• Realizar hiring e onboarding de novos membros

Requisitos obrigatórios:
• 7+ anos de experiência em desenvolvimento frontend
• Experiência com liderança técnica de equipes
• Expertise em React.js, TypeScript e ferramentas modernas
• Conhecimento sólido de performance web e otimização
• Experiência com micro-frontends
• Inglês fluente para comunicação com equipes internacionais

Requisitos desejáveis:
• Experiência com Vue.js ou Angular
• Conhecimento de Web Components
• Experiência com ferramentas de build (Webpack, Vite)
• Certificações em cloud platforms
• Experiência com design thinking

---

VAGA 3: ARQUITETO DE SOFTWARE
Empresa: Enterprise Solutions Ltd
Localização: São Paulo, SP
Salário: R$ 18.000 - R$ 25.000

Responsabilidades:
• Definir arquitetura de sistemas complexos e de larga escala
• Avaliar e selecionar tecnologias para novos projetos
• Estabelecer padrões e melhores práticas de desenvolvimento
• Colaborar com múltiplas equipes de engenharia
• Conduzir technical reviews e architecture decision records
• Mentorear desenvolvedores em conceitos de arquitetura

Requisitos obrigatórios:
• Graduação em Engenharia de Software ou Ciência da Computação
• 8+ anos de experiência em desenvolvimento de software
• Experiência comprovada em design de arquiteturas distribuídas
• Conhecimento profundo de microserviços e event-driven architecture
• Experiência com cloud computing (AWS, Azure ou GCP)
• Conhecimento de design patterns e princípios SOLID

Requisitos desejáveis:
• Pós-graduação em Arquitetura de Software
• Certificações de arquiteto em cloud providers
• Experiência com Kubernetes e orquestração de containers
• Conhecimento de Domain-Driven Design (DDD)
• Experiência com Event Sourcing e CQRS

---

VAGA 4: DESENVOLVEDOR BACKEND PYTHON
Empresa: AI Startup Innovations
Localização: São Paulo, SP (Remoto)
Salário: R$ 10.000 - R$ 15.000

Responsabilidades:
• Desenvolver APIs robustas usando Python e frameworks modernos
• Implementar algoritmos de machine learning em produção
• Otimizar performance de aplicações de alta carga
• Trabalhar com big data e processamento distribuído
• Integrar sistemas com serviços de IA e ML
• Colaborar com cientistas de dados na productização de modelos

Requisitos obrigatórios:
• 4+ anos de experiência com Python
• Experiência sólida com Django ou FastAPI
• Conhecimento de bancos de dados relacionais e NoSQL
• Experiência com Redis e sistemas de cache
• Conhecimento de containerização (Docker)
• Experiência com processamento assíncrono (Celery, RQ)

Requisitos desejáveis:
• Conhecimento de machine learning (scikit-learn, TensorFlow)
• Experiência com Apache Kafka ou RabbitMQ
• Conhecimento de Apache Spark para big data
• Experiência com monitoring e observabilidade
• Certificações em cloud computing

---

VAGA 5: DEVOPS ENGINEER
Empresa: CloudFirst Technologies
Localização: Remote (América Latina)
Salário: R$ 14.000 - R$ 20.000

Responsabilidades:
• Implementar e manter infrastructure as code
• Configurar pipelines CI/CD para múltiplos ambientes
• Gerenciar clusters Kubernetes em produção
• Implementar monitoring, logging e alerting
• Otimizar custos de cloud computing
• Garantir segurança e compliance em todos os ambientes

Requisitos obrigatórios:
• 5+ anos de experiência em DevOps/SRE
• Expertise em Kubernetes e orquestração de containers
• Experiência sólida com Terraform ou CloudFormation
• Conhecimento avançado de AWS/GCP/Azure
• Experiência com CI/CD (Jenkins, GitHub Actions, GitLab CI)
• Conhecimento de monitoring (Prometheus, Grafana, DataDog)

Requisitos desejáveis:
• Certificações de cloud architect
• Experiência com service mesh (Istio, Linkerd)
• Conhecimento de security scanning e compliance
• Experiência com GitOps (ArgoCD, Flux)
• Scripting avançado (Bash, Python, Go)

---

VAGA 6: PRODUCT ENGINEER
Empresa: Consumer Tech Company
Localização: São Paulo, SP (Híbrido)
Salário: R$ 13.000 - R$ 19.000

Responsabilidades:
• Trabalhar diretamente com Product Managers na definição de features
• Desenvolver experiências de usuário de alta qualidade
• Implementar A/B tests e feature flags
• Analisar métricas de produto e user behavior
• Colaborar com designers na implementação de UX/UI
• Manter alto nível de qualidade e performance

Requisitos obrigatórios:
• 5+ anos de experiência em desenvolvimento web
• Experiência sólida com React.js e ecossistema JavaScript
• Conhecimento de analytics e tracking de eventos
• Experiência com testes A/B e experimentação
• Mindset product-driven e foco no usuário final
• Experiência com metodologias ágeis

Requisitos desejáveis:
• Experiência com mobile development (React Native)
• Conhecimento de growth hacking e métricas de produto
• Experiência com ferramentas de analytics (Google Analytics, Mixpanel)
• Conhecimento de SEO e performance web
• Experiência com design systems

---

VAGA 7: STAFF ENGINEER
Empresa: Unicorn Startup Brazil
Localização: São Paulo, SP
Salário: R$ 20.000 - R$ 30.000

Responsabilidades:
• Liderar iniciativas técnicas de alto impacto na empresa
• Definir roadmap técnico e strategic technical decisions
• Mentorear e desenvolver engineers em todos os níveis
• Colaborar com liderança executiva em decisões técnicas
• Estabelecer technical excellence e engineering culture
• Resolver problemas técnicos complexos e de larga escala

Requisitos obrigatórios:
• 10+ anos de experiência em engenharia de software
• Histórico comprovado de liderança técnica em startups/scale-ups
• Experiência em sistemas distribuídos e arquiteturas complexas
• Capacidade de influenciar sem autoridade formal
• Excelentes habilidades de comunicação e mentoria
• Experiência com scaling de sistemas e organizações

Requisitos desejáveis:
• Experiência prévia como Staff/Principal Engineer
• Contribuições significativas para open source
• Experiência com hiring e building engineering teams
• MBA ou especialização em gestão
• Experiência internacional ou com remote teams
`;

function countTokensApprox(text) {
    // Aproximação: 1 token ≈ 4 caracteres para português
    return Math.ceil(text.length / 4);
}

async function testLargeAnalysis() {
    console.log('\n🧪 TESTE DE ANÁLISE GRANDE - CV 3 PÁGINAS + 7 VAGAS\n');

    // Calcular tokens de input
    const cvTokens = countTokensApprox(largeCVText);
    const jobsTokens = countTokensApprox(sevenJobsText);
    const totalInputTokens = cvTokens + jobsTokens;

    log.info(`📊 ANÁLISE DE TOKENS:`);
    console.log(`├── CV (3 páginas): ~${cvTokens.toLocaleString()} tokens`);
    console.log(`├── 7 vagas: ~${jobsTokens.toLocaleString()} tokens`);
    console.log(`└── Total input: ~${totalInputTokens.toLocaleString()} tokens\n`);

    // Verificar limites dos modelos
    const gpt4Limit = 128000; // GPT-4 Turbo input limit
    const claudeLimit = 200000; // Claude 3.5 Sonnet input limit
    const outputLimit = 4096; // Current output limit

    if (totalInputTokens > gpt4Limit) {
        log.error(`Input excede limite do GPT-4: ${totalInputTokens} > ${gpt4Limit}`);
    } else {
        log.success(`Input dentro do limite do GPT-4: ${totalInputTokens} < ${gpt4Limit}`);
    }

    if (totalInputTokens > claudeLimit) {
        log.error(`Input excede limite do Claude: ${totalInputTokens} > ${claudeLimit}`);
    } else {
        log.success(`Input dentro do limite do Claude: ${totalInputTokens} < ${claudeLimit}`);
    }

    // Testar análise real
    try {
        log.info('🔄 Executando análise completa...');
        const startTime = Date.now();

        const result = await openaiService.extractATSData(sevenJobsText, largeCVText);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log.success(`✅ Análise concluída em ${duration}s`);

        // Analisar resultado
        const resultJson = JSON.stringify(result, null, 2);
        const outputTokens = countTokensApprox(resultJson);

        log.info(`📈 RESULTADOS:`);
        console.log(`├── Keywords extraídas: ${result.job_keywords?.length || 0}`);
        console.log(`├── Keywords encontradas: ${result.found_keywords?.length || 0}`);
        console.log(`├── Keywords faltantes: ${result.missing_keywords?.length || 0}`);
        console.log(`├── Seções avaliadas: ${Object.keys(result).filter(key => typeof result[key] === 'object' && result[key].nota !== undefined).length}`);
        console.log(`├── Tokens de output: ~${outputTokens.toLocaleString()}`);
        console.log(`└── Tamanho da resposta: ${(resultJson.length / 1024).toFixed(2)} KB\n`);

        // Verificar se resposta foi truncada
        if (outputTokens >= outputLimit * 0.9) {
            log.warning(`⚠️ Resposta pode ter sido truncada (${outputTokens} ≈ ${outputLimit})`);
            log.warning('Considere aumentar max_tokens ou dividir a análise');
        } else {
            log.success(`✅ Resposta completa (${outputTokens} < ${outputLimit})`);
        }

        // Verificar qualidade da análise
        const sectionsWithNotes = Object.keys(result).filter(key =>
            typeof result[key] === 'object' &&
            result[key].nota !== undefined
        );

        if (sectionsWithNotes.length >= 6) {
            log.success('✅ Todas as seções foram analisadas');
        } else {
            log.warning(`⚠️ Apenas ${sectionsWithNotes.length}/6 seções analisadas`);
        }

        if (result.conclusion && result.conclusion.length > 100) {
            log.success('✅ Conclusão detalhada gerada');
        } else {
            log.warning('⚠️ Conclusão pode estar incompleta');
        }

        return true;

    } catch (error) {
        log.error(`❌ Falha na análise: ${error.message}`);
        return false;
    }
}

async function main() {
    const success = await testLargeAnalysis();

    console.log('\n🎯 RECOMENDAÇÕES:\n');

    if (success) {
        console.log('✅ Sistema suporta análises grandes');
        console.log('✅ Tokens de input adequados para CVs de 3 páginas + 7 vagas');
        console.log('✅ Output de 4096 tokens geralmente suficiente');
        console.log('\n📋 OTIMIZAÇÕES SUGERIDAS:');
        console.log('• Considerar divisão de análises muito grandes (10+ vagas)');
        console.log('• Monitorar uso de tokens em produção');
        console.log('• Implementar cache para análises similares');
    } else {
        console.log('❌ Sistema precisa de ajustes para análises grandes');
        console.log('\n🔧 AÇÕES NECESSÁRIAS:');
        console.log('• Aumentar max_tokens para 8192 (se modelo suportar)');
        console.log('• Implementar divisão de análises grandes');
        console.log('• Otimizar prompt para ser mais conciso');
    }

    console.log('\n💡 ALTERNATIVAS PARA ANÁLISES GIGANTES:');
    console.log('• Dividir análise por grupos de vagas (3-4 por vez)');
    console.log('• Implementar análise incremental');
    console.log('• Usar Claude 3.5 Sonnet com limite maior quando necessário\n');
}

// Executar teste
if (require.main === module) {
    main().catch(error => {
        log.error(`Erro no teste: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testLargeAnalysis }; 