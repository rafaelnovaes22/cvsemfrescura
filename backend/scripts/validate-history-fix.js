#!/usr/bin/env node

const HistoryDiagnostic = require('./diagnose-and-repair-history');
const CompleteWorkflowTester = require('./test-complete-workflow');
const HistoryEndpointTester = require('./test-history-endpoints');

class HistoryFixValidator {
    constructor() {
        this.results = {
            diagnostic: null,
            endpoints: null,
            workflow: null,
            overall: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'debug': '🔍'
        }[type] || '📋';

        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    async runDiagnostic() {
        try {
            this.log('Executando diagnóstico do sistema...', 'info');

            const diagnostic = new HistoryDiagnostic();
            const success = await diagnostic.runFullDiagnostic();

            this.results.diagnostic = success;

            if (success) {
                this.log('Diagnóstico passou - sistema saudável', 'success');
            } else {
                this.log('Diagnóstico falhou - problemas encontrados', 'error');
            }

            return success;
        } catch (error) {
            this.log(`Erro durante diagnóstico: ${error.message}`, 'error');
            this.results.diagnostic = false;
            return false;
        }
    }

    async runEndpointTests() {
        try {
            this.log('Testando endpoints da API...', 'info');

            const tester = new HistoryEndpointTester();
            const success = await tester.runTests();

            this.results.endpoints = success;

            if (success) {
                this.log('Testes de endpoints passaram', 'success');
            } else {
                this.log('Testes de endpoints falharam', 'error');
            }

            return success;
        } catch (error) {
            this.log(`Erro durante testes de endpoints: ${error.message}`, 'error');
            this.results.endpoints = false;
            return false;
        }
    }

    async runWorkflowTests() {
        try {
            this.log('Testando fluxo completo...', 'info');

            const tester = new CompleteWorkflowTester();
            const success = await tester.runCompleteTest();

            this.results.workflow = success;

            if (success) {
                this.log('Testes de fluxo completo passaram', 'success');
            } else {
                this.log('Testes de fluxo completo falharam', 'error');
            }

            return success;
        } catch (error) {
            this.log(`Erro durante testes de fluxo: ${error.message}`, 'error');
            this.results.workflow = false;
            return false;
        }
    }

    generateFinalReport() {
        this.log('\n' + '='.repeat(80), 'info');
        this.log('RELATÓRIO FINAL DE VALIDAÇÃO - CORREÇÃO DO HISTÓRICO', 'info');
        this.log('='.repeat(80), 'info');

        // Resultados individuais
        this.log('\n📊 RESULTADOS DOS TESTES:', 'info');
        this.log(`  🔍 Diagnóstico do Sistema: ${this.results.diagnostic ? '✅ PASSOU' : '❌ FALHOU'}`, 'info');
        this.log(`  🌐 Testes de Endpoints: ${this.results.endpoints ? '✅ PASSOU' : '❌ FALHOU'}`, 'info');
        this.log(`  🔄 Testes de Fluxo Completo: ${this.results.workflow ? '✅ PASSOU' : '❌ FALHOU'}`, 'info');

        // Resultado geral
        const allPassed = this.results.diagnostic && this.results.endpoints && this.results.workflow;
        this.results.overall = allPassed;

        this.log('\n🎯 RESULTADO GERAL:', 'info');
        if (allPassed) {
            this.log('🎉 TODOS OS TESTES PASSARAM!', 'success');
            this.log('✅ O sistema de histórico foi corrigido com sucesso', 'success');
            this.log('✅ Pronto para uso em produção', 'success');
        } else {
            this.log('❌ ALGUNS TESTES FALHARAM!', 'error');
            this.log('⚠️ Corrija os problemas antes de usar em produção', 'warning');
        }

        // Próximos passos
        this.log('\n📋 PRÓXIMOS PASSOS:', 'info');
        if (allPassed) {
            this.log('1. Fazer backup do banco de dados atual', 'info');
            this.log('2. Aplicar correções em produção', 'info');
            this.log('3. Testar manualmente no frontend', 'info');
            this.log('4. Monitorar logs por 24-48 horas', 'info');
            this.log('5. Coletar feedback dos usuários', 'info');
        } else {
            this.log('1. Revisar logs de erro acima', 'info');
            this.log('2. Corrigir problemas identificados', 'info');
            this.log('3. Executar validação novamente', 'info');
            this.log('4. Repetir até todos os testes passarem', 'info');
        }

        // Comandos úteis
        this.log('\n🔧 COMANDOS ÚTEIS PARA DEBUG:', 'info');
        this.log('  Backend:', 'info');
        this.log('    node scripts/diagnose-and-repair-history.js', 'info');
        this.log('    node scripts/test-complete-workflow.js', 'info');
        this.log('  Frontend (Console):', 'info');
        this.log('    historyLogger.toggleDebug()', 'info');
        this.log('    historyLogger.downloadLogs()', 'info');

        this.log('\n' + '='.repeat(80), 'info');

        return allPassed;
    }

    async runFullValidation() {
        try {
            this.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DA CORREÇÃO DO HISTÓRICO', 'info');
            this.log('Este processo irá executar todos os testes necessários...', 'info');

            // 1. Diagnóstico do sistema
            await this.runDiagnostic();

            // 2. Testes de endpoints (apenas se diagnóstico passou)
            if (this.results.diagnostic) {
                await this.runEndpointTests();
            } else {
                this.log('Pulando testes de endpoints devido a falha no diagnóstico', 'warning');
                this.results.endpoints = false;
            }

            // 3. Testes de fluxo completo (apenas se testes anteriores passaram)
            if (this.results.diagnostic && this.results.endpoints) {
                await this.runWorkflowTests();
            } else {
                this.log('Pulando testes de fluxo devido a falhas anteriores', 'warning');
                this.results.workflow = false;
            }

            // 4. Gerar relatório final
            const success = this.generateFinalReport();

            return success;

        } catch (error) {
            this.log(`Erro fatal durante validação: ${error.message}`, 'error');
            this.log(error.stack, 'debug');
            return false;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    (async () => {
        const validator = new HistoryFixValidator();

        try {
            const success = await validator.runFullValidation();

            // Código de saída baseado no resultado
            process.exit(success ? 0 : 1);

        } catch (error) {
            console.error('❌ Erro fatal durante validação:', error);
            process.exit(1);
        }
    })();
}

module.exports = HistoryFixValidator;