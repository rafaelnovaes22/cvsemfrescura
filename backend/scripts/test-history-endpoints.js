const sequelize = require('../db');
const AnalysisResults = require('../models/AnalysisResults');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

class HistoryEndpointTester {
    constructor() {
        this.testResults = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);

        this.testResults.push({ message, type, timestamp });
    }

    async createTestData() {
        try {
            this.log('🔧 Criando dados de teste...');

            // Verificar se já existe usuário de teste
            let testUser = await User.findOne({ where: { email: 'test@example.com' } });

            if (!testUser) {
                testUser = await User.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'hashedpassword',
                    credits: 10
                });
                this.log('✅ Usuário de teste criado');
            } else {
                this.log('✅ Usuário de teste já existe');
            }

            // Criar análise de teste se não existir
            const existingAnalysis = await AnalysisResults.findOne({ where: { userId: testUser.id } });

            if (!existingAnalysis) {
                const testAnalysis = await AnalysisResults.create({
                    userId: testUser.id,
                    resumeFileName: 'test-resume.pdf',
                    resumeContent: 'Test resume content',
                    jobUrls: ['http://example.com/job1', 'http://example.com/job2'],
                    result: {
                        conclusion: 'Test conclusion for historical analysis',
                        resumo: {
                            nota: 8.5,
                            avaliacao: 'Excelente resumo profissional',
                            sugestoes: ['Adicionar mais detalhes técnicos']
                        },
                        job_keywords_present: ['javascript', 'react', 'node.js'],
                        job_keywords_missing: ['python', 'django'],
                        jobs: [
                            { title: 'Frontend Developer', link: 'http://example.com/job1' },
                            { title: 'Full Stack Developer', link: 'http://example.com/job2' }
                        ]
                    }
                });

                this.log(`✅ Análise de teste criada: ${testAnalysis.id}`);
                return { testUser, testAnalysis };
            } else {
                this.log('✅ Análise de teste já existe');
                return { testUser, testAnalysis: existingAnalysis };
            }

        } catch (error) {
            this.log(`❌ Erro ao criar dados de teste: ${error.message}`, 'error');
            throw error;
        }
    }

    async testModelMethods(testUser, testAnalysis) {
        try {
            this.log('🧪 Testando métodos do modelo...');

            // Testar findUserAnalyses
            const userAnalyses = await AnalysisResults.findUserAnalyses(testUser.id);
            this.log(`✅ findUserAnalyses retornou ${userAnalyses.length} análises`);

            if (userAnalyses.length > 0) {
                const firstAnalysis = userAnalyses[0];
                this.log(`📊 Primeira análise: ID=${firstAnalysis.id}, Arquivo=${firstAnalysis.fileName}, Vagas=${firstAnalysis.jobCount}`);
            }

            // Testar findUserAnalysis
            const specificAnalysis = await AnalysisResults.findUserAnalysis(testAnalysis.id, testUser.id);

            if (specificAnalysis) {
                this.log('✅ findUserAnalysis funcionando');
                this.log(`📊 Análise específica: hasConclusion=${!!specificAnalysis.conclusion}, isHistorical=${specificAnalysis.isHistoricalView}`);
            } else {
                this.log('❌ findUserAnalysis retornou null', 'error');
            }

            return true;
        } catch (error) {
            this.log(`❌ Erro ao testar métodos do modelo: ${error.message}`, 'error');
            return false;
        }
    }

    generateReport() {
        this.log('\n📋 RELATÓRIO DE TESTES DOS ENDPOINTS');
        this.log('='.repeat(50));

        const errors = this.testResults.filter(r => r.type === 'error');
        const successes = this.testResults.filter(r => r.type === 'info');

        this.log(`✅ Testes bem-sucedidos: ${successes.length}`);
        this.log(`❌ Erros encontrados: ${errors.length}`);

        if (errors.length > 0) {
            this.log('\n❌ ERROS DETALHADOS:');
            errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.message}`);
            });
        }

        return errors.length === 0;
    }

    async runTests() {
        try {
            this.log('🚀 Iniciando testes dos endpoints de histórico...');

            // Conectar ao banco
            await sequelize.authenticate();
            this.log('✅ Conexão com banco estabelecida');

            // Sincronizar modelos
            await sequelize.sync({ alter: false });
            this.log('✅ Modelos sincronizados');

            // Criar dados de teste
            const { testUser, testAnalysis } = await this.createTestData();

            // Testar métodos do modelo
            await this.testModelMethods(testUser, testAnalysis);

            // Gerar relatório
            const success = this.generateReport();

            return success;

        } catch (error) {
            this.log(`❌ Erro fatal durante testes: ${error.message}`, 'error');
            return false;
        } finally {
            await sequelize.close();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    (async () => {
        const tester = new HistoryEndpointTester();

        try {
            const success = await tester.runTests();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = HistoryEndpointTester;