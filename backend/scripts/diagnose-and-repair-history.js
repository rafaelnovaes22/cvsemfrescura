const sequelize = require('../db');
const AnalysisResults = require('../models/AnalysisResults');
const User = require('../models/user');
const { logger } = require('../utils/logger');

class HistoryDiagnostic {
    constructor() {
        this.issues = [];
        this.fixes = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;

        console.log(logMessage);

        if (type === 'error') {
            this.issues.push(message);
        } else if (type === 'fix') {
            this.fixes.push(message);
        }
    }

    async checkDatabaseConnection() {
        try {
            await sequelize.authenticate();
            this.log('✅ Conexão com banco de dados estabelecida com sucesso');
            return true;
        } catch (error) {
            this.log(`❌ Erro na conexão com banco: ${error.message}`, 'error');
            return false;
        }
    }

    async checkTableStructure() {
        try {
            this.log('🔍 Verificando estrutura das tabelas...');

            // Verificar se as tabelas existem
            const tables = await sequelize.getQueryInterface().showAllTables();
            this.log(`📋 Tabelas encontradas: ${tables.join(', ')}`);

            const hasAnalysisResults = tables.includes('AnalysisResults');
            const hasUsers = tables.includes('users');

            if (!hasUsers) {
                this.log('❌ Tabela users não encontrada!', 'error');
                return false;
            }

            if (!hasAnalysisResults) {
                this.log('❌ Tabela AnalysisResults não encontrada!', 'error');
                return false;
            }

            // Verificar estrutura da tabela AnalysisResults
            const analysisResultsDesc = await sequelize.getQueryInterface().describeTable('AnalysisResults');
            this.log('📊 Estrutura da tabela AnalysisResults:');

            const expectedColumns = ['id', 'userId', 'resumeFileName', 'resumeContent', 'jobUrls', 'result', 'createdAt', 'updatedAt'];
            const actualColumns = Object.keys(analysisResultsDesc);

            for (const col of expectedColumns) {
                if (actualColumns.includes(col)) {
                    this.log(`  ✅ ${col}: ${analysisResultsDesc[col].type}`);
                } else {
                    this.log(`  ❌ Coluna ausente: ${col}`, 'error');
                }
            }

            return hasAnalysisResults && hasUsers;
        } catch (error) {
            this.log(`❌ Erro ao verificar estrutura: ${error.message}`, 'error');
            return false;
        }
    }

    async createMissingTables() {
        try {
            this.log('🔧 Criando tabelas ausentes...');

            // Sincronizar modelos (criar tabelas se não existirem)
            await sequelize.sync({ alter: false });

            this.log('✅ Tabelas criadas/verificadas com sucesso', 'fix');
            return true;
        } catch (error) {
            this.log(`❌ Erro ao criar tabelas: ${error.message}`, 'error');
            return false;
        }
    }

    async checkDataIntegrity() {
        try {
            this.log('🔍 Verificando integridade dos dados...');

            // Contar total de análises
            const totalAnalyses = await AnalysisResults.count();
            this.log(`📊 Total de análises na base: ${totalAnalyses}`);

            if (totalAnalyses === 0) {
                this.log('⚠️ Nenhuma análise encontrada na base de dados');
                return true; // Não é erro, apenas não há dados
            }

            // Verificar análises com dados corrompidos
            const analyses = await AnalysisResults.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']]
            });

            let corruptedCount = 0;
            let validCount = 0;

            for (const analysis of analyses) {
                try {
                    // Verificar se result é um JSON válido
                    if (typeof analysis.result === 'string') {
                        JSON.parse(analysis.result);
                    } else if (typeof analysis.result === 'object') {
                        // Já é objeto, ok
                    } else {
                        throw new Error('Result não é string nem objeto');
                    }

                    // Verificar se jobUrls é válido
                    if (analysis.jobUrls && typeof analysis.jobUrls === 'string') {
                        JSON.parse(analysis.jobUrls);
                    }

                    validCount++;
                    this.log(`  ✅ Análise ${analysis.id}: dados válidos`);
                } catch (error) {
                    corruptedCount++;
                    this.log(`  ❌ Análise ${analysis.id}: dados corrompidos - ${error.message}`, 'error');
                }
            }

            this.log(`📊 Resumo da integridade: ${validCount} válidas, ${corruptedCount} corrompidas`);

            return corruptedCount === 0;
        } catch (error) {
            this.log(`❌ Erro ao verificar integridade: ${error.message}`, 'error');
            return false;
        }
    }

    async testApiEndpoints() {
        try {
            this.log('🔍 Testando funcionalidade dos endpoints...');

            // Verificar se há usuários para testar
            const userCount = await User.count();
            if (userCount === 0) {
                this.log('⚠️ Nenhum usuário encontrado para testar endpoints');
                return true;
            }

            // Pegar primeiro usuário
            const testUser = await User.findOne();
            this.log(`🧪 Testando com usuário ID: ${testUser.id}`);

            // Testar busca de histórico
            const userAnalyses = await AnalysisResults.findAll({
                where: { userId: testUser.id },
                order: [['createdAt', 'DESC']],
                limit: 5
            });

            this.log(`📊 Análises do usuário ${testUser.id}: ${userAnalyses.length}`);

            if (userAnalyses.length > 0) {
                // Testar busca de análise específica
                const testAnalysis = userAnalyses[0];
                const specificAnalysis = await AnalysisResults.findOne({
                    where: {
                        id: testAnalysis.id,
                        userId: testUser.id
                    }
                });

                if (specificAnalysis) {
                    this.log(`✅ Busca de análise específica funcionando: ${testAnalysis.id}`);

                    // Verificar se o resultado tem os campos esperados
                    const result = typeof specificAnalysis.result === 'string'
                        ? JSON.parse(specificAnalysis.result)
                        : specificAnalysis.result;

                    const expectedFields = ['conclusion', 'resumo', 'job_keywords_present', 'job_keywords_missing'];
                    const hasExpectedFields = expectedFields.some(field => result[field]);

                    if (hasExpectedFields) {
                        this.log('✅ Dados da análise contêm campos esperados');
                    } else {
                        this.log('⚠️ Dados da análise podem estar incompletos', 'error');
                        this.log(`📋 Campos disponíveis: ${Object.keys(result).join(', ')}`);
                    }
                } else {
                    this.log('❌ Erro ao buscar análise específica', 'error');
                }
            }

            return true;
        } catch (error) {
            this.log(`❌ Erro ao testar endpoints: ${error.message}`, 'error');
            return false;
        }
    }

    async repairCorruptedData() {
        try {
            this.log('🔧 Iniciando reparo de dados corrompidos...');

            const analyses = await AnalysisResults.findAll();
            let repairedCount = 0;

            for (const analysis of analyses) {
                let needsUpdate = false;
                const updates = {};

                // Reparar result se for string
                if (typeof analysis.result === 'string') {
                    try {
                        const parsed = JSON.parse(analysis.result);
                        updates.result = parsed;
                        needsUpdate = true;
                    } catch (error) {
                        this.log(`❌ Não foi possível reparar result da análise ${analysis.id}`, 'error');
                    }
                }

                // Reparar jobUrls se for string
                if (analysis.jobUrls && typeof analysis.jobUrls === 'string') {
                    try {
                        const parsed = JSON.parse(analysis.jobUrls);
                        updates.jobUrls = parsed;
                        needsUpdate = true;
                    } catch (error) {
                        this.log(`❌ Não foi possível reparar jobUrls da análise ${analysis.id}`, 'error');
                    }
                }

                if (needsUpdate) {
                    await analysis.update(updates);
                    repairedCount++;
                    this.log(`✅ Análise ${analysis.id} reparada`, 'fix');
                }
            }

            this.log(`🔧 Reparo concluído: ${repairedCount} análises reparadas`, 'fix');
            return true;
        } catch (error) {
            this.log(`❌ Erro durante reparo: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        this.log('\n📋 RELATÓRIO DE DIAGNÓSTICO');
        this.log('='.repeat(50));

        if (this.issues.length > 0) {
            this.log('\n❌ PROBLEMAS ENCONTRADOS:');
            this.issues.forEach((issue, index) => {
                this.log(`${index + 1}. ${issue}`);
            });
        }

        if (this.fixes.length > 0) {
            this.log('\n✅ CORREÇÕES APLICADAS:');
            this.fixes.forEach((fix, index) => {
                this.log(`${index + 1}. ${fix}`);
            });
        }

        if (this.issues.length === 0) {
            this.log('\n🎉 SISTEMA SAUDÁVEL: Nenhum problema crítico encontrado!');
        }

        this.log('\n📊 RESUMO:');
        this.log(`- Problemas encontrados: ${this.issues.length}`);
        this.log(`- Correções aplicadas: ${this.fixes.length}`);
    }

    async runFullDiagnostic() {
        this.log('🚀 Iniciando diagnóstico completo do sistema de histórico...');

        // 1. Verificar conexão
        const connectionOk = await this.checkDatabaseConnection();
        if (!connectionOk) return false;

        // 2. Verificar estrutura das tabelas
        const structureOk = await this.checkTableStructure();
        if (!structureOk) {
            // Tentar criar tabelas ausentes
            await this.createMissingTables();
            // Verificar novamente
            await this.checkTableStructure();
        }

        // 3. Verificar integridade dos dados
        const integrityOk = await this.checkDataIntegrity();
        if (!integrityOk) {
            // Tentar reparar dados corrompidos
            await this.repairCorruptedData();
        }

        // 4. Testar funcionalidade dos endpoints
        await this.testApiEndpoints();

        // 5. Gerar relatório
        await this.generateReport();

        return this.issues.length === 0;
    }
}

// Executar diagnóstico se chamado diretamente
if (require.main === module) {
    (async () => {
        const diagnostic = new HistoryDiagnostic();

        try {
            const success = await diagnostic.runFullDiagnostic();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('❌ Erro fatal durante diagnóstico:', error);
            process.exit(1);
        } finally {
            await sequelize.close();
        }
    })();
}

module.exports = HistoryDiagnostic;