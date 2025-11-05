const sequelize = require('../db');
const AnalysisResults = require('../models/AnalysisResults');
const User = require('../models/user');
const HistoryDiagnostic = require('./diagnose-and-repair-history');

class CompleteWorkflowTester {
    constructor() {
        this.testResults = [];
        this.testUser = null;
        this.testAnalysis = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);

        this.testResults.push({ message, type, timestamp });
    }

    async setupTestEnvironment() {
        try {
            this.log('🔧 Configurando ambiente de teste...');

            // Executar diagnóstico primeiro
            const diagnostic = new HistoryDiagnostic();
            const diagnosticSuccess = await diagnostic.runFullDiagnostic();

            if (!diagnosticSuccess) {
                throw new Error('Diagnóstico falhou - ambiente não está saudável');
            }

            this.log('✅ Diagnóstico passou - ambiente saudável');

            // Criar/encontrar usuário de teste
            this.testUser = await User.findOne({ where: { email: 'workflow-test@example.com' } });

            if (!this.testUser) {
                this.testUser = await User.create({
                    name: 'Workflow Test User',
                    email: 'workflow-test@example.com',
                    password: 'hashedpassword123',
                    credits: 5
                });
                this.log('✅ Usuário de teste criado');
            } else {
                this.log('✅ Usuário de teste encontrado');
            }

            return true;
        } catch (error) {
            this.log(`❌ Erro ao configurar ambiente: ${error.message}`, 'error');
            return false;
        }
    }

    async testAnalysisCreation() {
        try {
            this.log('🧪 Testando criação de análise...');

            const analysisData = {
                userId: this.testUser.id,
                resumeFileName: 'test-workflow-resume.pdf',
                resumeContent: 'Test resume content for workflow validation',
                jobUrls: [
                    'https://example.com/job1',
                    'https://example.com/job2',
                    'https://example.com/job3'
                ],
                result: {
                    conclusion: 'Esta é uma análise de teste para validar o fluxo completo do histórico.',
                    resumo: {
                        nota: 8.5,
                        avaliacao: 'Resumo profissional bem estruturado',
                        sugestoes: ['Adicionar mais detalhes sobre conquistas', 'Incluir palavras-chave específicas']
                    },
                    idiomas: {
                        nota: 7.0,
                        avaliacao: 'Idiomas adequados para as vagas',
                        sugestoes: ['Especificar nível de proficiência']
                    },
                    formacao: {
                        nota: 9.0,
                        avaliacao: 'Formação alinhada com requisitos',
                        sugestoes: []
                    },
                    habilidades: {
                        nota: 8.0,
                        avaliacao: 'Habilidades técnicas relevantes',
                        sugestoes: ['Adicionar certificações']
                    },
                    informacoes_pessoais: {
                        nota: 7.5,
                        avaliacao: 'Informações completas',
                        sugestoes: ['Adicionar LinkedIn']
                    },
                    experiencia_profissional: {
                        nota: 8.5,
                        avaliacao: 'Experiência sólida e relevante',
                        sugestoes: ['Quantificar resultados']
                    },
                    job_keywords: ['javascript', 'react', 'node.js', 'python', 'sql', 'git'],
                    job_keywords_present: ['javascript', 'react', 'git'],
                    job_keywords_missing: ['node.js', 'python', 'sql'],
                    job_keywords_with_count: [
                        { keyword: 'javascript', count: 5 },
                        { keyword: 'react', count: 3 },
                        { keyword: 'node.js', count: 2 },
                        { keyword: 'python', count: 4 },
                        { keyword: 'sql', count: 2 },
                        { keyword: 'git', count: 1 }
                    ],
                    jobs: [
                        {
                            title: 'Frontend Developer',
                            link: 'https://example.com/job1',
                            description: 'Desenvolver interfaces com React e JavaScript'
                        },
                        {
                            title: 'Full Stack Developer',
                            link: 'https://example.com/job2',
                            description: 'Desenvolvimento completo com Node.js e Python'
                        },
                        {
                            title: 'Software Engineer',
                            link: 'https://example.com/job3',
                            description: 'Engenharia de software com foco em qualidade'
                        }
                    ],
                    keyword_statistics: {
                        total_identified: 6,
                        total_occurrences: 17,
                        present_in_resume: 3,
                        missing_in_resume: 3,
                        match_percentage: 50
                    },
                    credits_remaining: 4,
                    fileName: 'test-workflow-resume.pdf'
                }
            };

            this.testAnalysis = await AnalysisResults.create(analysisData);
            this.log(`✅ Análise criada com sucesso: ${this.testAnalysis.id}`);

            // Verificar se os dados foram salvos corretamente
            const savedAnalysis = await AnalysisResults.findByPk(this.testAnalysis.id);

            if (!savedAnalysis) {
                throw new Error('Análise não foi encontrada após criação');
            }

            // Verificar estrutura dos dados
            const result = savedAnalysis.result;
            const requiredFields = ['conclusion', 'resumo', 'job_keywords_present', 'jobs'];
            const missingFields = requiredFields.filter(field => !result[field]);

            if (missingFields.length > 0) {
                throw new Error(`Campos ausentes na análise salva: ${missingFields.join(', ')}`);
            }

            this.log('✅ Estrutura da análise validada');
            return true;

        } catch (error) {
            this.log(`❌ Erro ao testar criação de análise: ${error.message}`, 'error');
            return false;
        }
    }

    async testHistoryRetrieval() {
        try {
            this.log('🧪 Testando recuperação do histórico...');

            // Testar método findUserAnalyses
            const userAnalyses = await AnalysisResults.findUserAnalyses(this.testUser.id);

            if (userAnalyses.length === 0) {
                throw new Error('Nenhuma análise encontrada no histórico');
            }

            this.log(`✅ Histórico retornou ${userAnalyses.length} análises`);

            // Verificar estrutura do histórico
            const firstAnalysis = userAnalyses[0];
            const requiredHistoryFields = ['id', 'fileName', 'jobUrls', 'createdAt', 'jobCount', 'summary'];
            const missingHistoryFields = requiredHistoryFields.filter(field => firstAnalysis[field] === undefined);

            if (missingHistoryFields.length > 0) {
                throw new Error(`Campos ausentes no histórico: ${missingHistoryFields.join(', ')}`);
            }

            this.log('✅ Estrutura do histórico validada');
            return true;

        } catch (error) {
            this.log(`❌ Erro ao testar recuperação do histórico: ${error.message}`, 'error');
            return false;
        }
    }

    async testSpecificAnalysisRetrieval() {
        try {
            this.log('🧪 Testando recuperação de análise específica...');

            // Testar método findUserAnalysis
            const specificAnalysis = await AnalysisResults.findUserAnalysis(this.testAnalysis.id, this.testUser.id);

            if (!specificAnalysis) {
                throw new Error('Análise específica não encontrada');
            }

            // Verificar campos adicionados para visualização histórica
            const requiredFields = ['isHistoricalView', 'originalDate', 'fileName', 'analysisId'];
            const missingFields = requiredFields.filter(field => specificAnalysis[field] === undefined);

            if (missingFields.length > 0) {
                throw new Error(`Campos ausentes na análise específica: ${missingFields.join(', ')}`);
            }

            // Verificar se os dados originais estão preservados
            if (!specificAnalysis.conclusion) {
                throw new Error('Conclusão não encontrada na análise específica');
            }

            if (!specificAnalysis.resumo || !specificAnalysis.resumo.nota) {
                throw new Error('Dados de resumo não encontrados na análise específica');
            }

            this.log('✅ Análise específica validada');
            return true;

        } catch (error) {
            this.log(`❌ Erro ao testar recuperação de análise específica: ${error.message}`, 'error');
            return false;
        }
    }

    async testDataIntegrity() {
        try {
            this.log('🧪 Testando integridade dos dados...');

            // Verificar se os dados JSON são válidos
            const analysis = await AnalysisResults.findByPk(this.testAnalysis.id);

            // Testar serialização/deserialização
            const resultString = JSON.stringify(analysis.result);
            const parsedResult = JSON.parse(resultString);

            if (!parsedResult.conclusion) {
                throw new Error('Dados corrompidos após serialização/deserialização');
            }

            // Testar jobUrls
            if (!Array.isArray(analysis.jobUrls)) {
                throw new Error('jobUrls não é um array válido');
            }

            if (analysis.jobUrls.length !== 3) {
                throw new Error(`jobUrls deveria ter 3 itens, mas tem ${analysis.jobUrls.length}`);
            }

            this.log('✅ Integridade dos dados validada');
            return true;

        } catch (error) {
            this.log(`❌ Erro ao testar integridade dos dados: ${error.message}`, 'error');
            return false;
        }
    }

    async cleanup() {
        try {
            this.log('🧹 Limpando dados de teste...');

            if (this.testAnalysis) {
                await this.testAnalysis.destroy();
                this.log('✅ Análise de teste removida');
            }

            if (this.testUser) {
                await this.testUser.destroy();
                this.log('✅ Usuário de teste removido');
            }

        } catch (error) {
            this.log(`⚠️ Erro durante limpeza: ${error.message}`, 'warning');
        }
    }

    generateReport() {
        this.log('\n📋 RELATÓRIO DE TESTE DO FLUXO COMPLETO');
        this.log('='.repeat(60));

        const errors = this.testResults.filter(r => r.type === 'error');
        const warnings = this.testResults.filter(r => r.type === 'warning');
        const successes = this.testResults.filter(r => r.type === 'info' && r.message.includes('✅'));

        this.log(`✅ Testes bem-sucedidos: ${successes.length}`);
        this.log(`⚠️ Avisos: ${warnings.length}`);
        this.log(`❌ Erros: ${errors.length}`);

        if (errors.length > 0) {
            this.log('\n❌ ERROS CRÍTICOS:');
            errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.message}`);
            });
        }

        if (warnings.length > 0) {
            this.log('\n⚠️ AVISOS:');
            warnings.forEach((warning, index) => {
                this.log(`${index + 1}. ${warning.message}`);
            });
        }

        const success = errors.length === 0;

        if (success) {
            this.log('\n🎉 TODOS OS TESTES PASSARAM!');
            this.log('O sistema de histórico está funcionando corretamente.');
        } else {
            this.log('\n❌ ALGUNS TESTES FALHARAM!');
            this.log('Verifique os erros acima e corrija antes de usar o sistema.');
        }

        return success;
    }

    async runCompleteTest() {
        try {
            this.log('🚀 Iniciando teste completo do fluxo de histórico...');

            // 1. Configurar ambiente
            const setupSuccess = await this.setupTestEnvironment();
            if (!setupSuccess) return false;

            // 2. Testar criação de análise
            const creationSuccess = await this.testAnalysisCreation();
            if (!creationSuccess) return false;

            // 3. Testar recuperação do histórico
            const historySuccess = await this.testHistoryRetrieval();
            if (!historySuccess) return false;

            // 4. Testar recuperação de análise específica
            const specificSuccess = await this.testSpecificAnalysisRetrieval();
            if (!specificSuccess) return false;

            // 5. Testar integridade dos dados
            const integritySuccess = await this.testDataIntegrity();
            if (!integritySuccess) return false;

            // 6. Gerar relatório
            const success = this.generateReport();

            return success;

        } catch (error) {
            this.log(`❌ Erro fatal durante teste: ${error.message}`, 'error');
            return false;
        } finally {
            // Sempre limpar dados de teste
            await this.cleanup();
            await sequelize.close();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    (async () => {
        const tester = new CompleteWorkflowTester();

        try {
            const success = await tester.runCompleteTest();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = CompleteWorkflowTester;