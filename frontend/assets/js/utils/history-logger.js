// Logger específico para debug do sistema de histórico
class HistoryLogger {
    constructor() {
        this.logs = [];
        this.isDebugMode = this.checkDebugMode();

        if (this.isDebugMode) {
            console.log('🔧 HistoryLogger: Modo debug ativado');
        }
    }

    checkDebugMode() {
        // Ativar debug se:
        // 1. URL contém ?debug=true
        // 2. localStorage tem historyDebug=true
        // 3. Ambiente de desenvolvimento
        const urlParams = new URLSearchParams(window.location.search);
        const urlDebug = urlParams.get('debug') === 'true';
        const storageDebug = localStorage.getItem('historyDebug') === 'true';
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        return urlDebug || storageDebug || isDev;
    }

    log(message, data = null, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            data,
            level,
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        this.logs.push(logEntry);

        // Manter apenas os últimos 100 logs
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }

        // Console logging baseado no nível
        const emoji = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'debug': '🔍'
        }[level] || '📋';

        const consoleMethod = {
            'error': 'error',
            'warning': 'warn',
            'debug': 'debug'
        }[level] || 'log';

        if (this.isDebugMode || level === 'error') {
            console[consoleMethod](`${emoji} [HISTORY] ${message}`, data || '');
        }

        // Salvar logs críticos no localStorage para análise posterior
        if (level === 'error') {
            this.saveErrorLog(logEntry);
        }
    }

    saveErrorLog(logEntry) {
        try {
            const errorLogs = JSON.parse(localStorage.getItem('historyErrorLogs') || '[]');
            errorLogs.push(logEntry);

            // Manter apenas os últimos 20 erros
            if (errorLogs.length > 20) {
                errorLogs.splice(0, errorLogs.length - 20);
            }

            localStorage.setItem('historyErrorLogs', JSON.stringify(errorLogs));
        } catch (e) {
            console.error('Erro ao salvar log de erro:', e);
        }
    }

    logApiCall(endpoint, method = 'GET', data = null) {
        this.log(`API Call: ${method} ${endpoint}`, {
            endpoint,
            method,
            data: data ? (typeof data === 'string' ? data.substring(0, 200) : data) : null,
            timestamp: Date.now()
        }, 'debug');
    }

    logApiResponse(endpoint, status, data = null, duration = null) {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success';
        this.log(`API Response: ${status} ${endpoint}`, {
            endpoint,
            status,
            duration,
            dataSize: data ? JSON.stringify(data).length : 0,
            hasData: !!data
        }, level);
    }

    logSessionStorage(operation, key, dataSize = null) {
        this.log(`SessionStorage ${operation}: ${key}`, {
            operation,
            key,
            dataSize,
            totalKeys: Object.keys(sessionStorage).length
        }, 'debug');
    }

    logUserAction(action, details = null) {
        this.log(`User Action: ${action}`, details, 'info');
    }

    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            logs: this.logs,
            sessionStorage: this.getSessionStorageSnapshot(),
            localStorage: this.getLocalStorageSnapshot()
        };

        return JSON.stringify(exportData, null, 2);
    }

    getSessionStorageSnapshot() {
        const snapshot = {};
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);
                snapshot[key] = {
                    size: value ? value.length : 0,
                    preview: value ? value.substring(0, 100) : null
                };
            }
        } catch (e) {
            snapshot.error = e.message;
        }
        return snapshot;
    }

    getLocalStorageSnapshot() {
        const snapshot = {};
        try {
            const relevantKeys = ['token', 'user', 'historyDebug', 'historyErrorLogs'];
            relevantKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    snapshot[key] = {
                        size: value.length,
                        preview: key === 'token' ? '[HIDDEN]' : value.substring(0, 100)
                    };
                }
            });
        } catch (e) {
            snapshot.error = e.message;
        }
        return snapshot;
    }

    downloadLogs() {
        const logs = this.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `history-debug-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('Debug logs downloaded', null, 'success');
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem('historyErrorLogs');
        this.log('Logs cleared', null, 'info');
    }

    // Método para ativar/desativar debug
    toggleDebug() {
        this.isDebugMode = !this.isDebugMode;
        localStorage.setItem('historyDebug', this.isDebugMode.toString());
        this.log(`Debug mode ${this.isDebugMode ? 'enabled' : 'disabled'}`, null, 'info');

        if (this.isDebugMode) {
            console.log('🔧 Para baixar logs de debug, execute: historyLogger.downloadLogs()');
            console.log('🔧 Para limpar logs, execute: historyLogger.clearLogs()');
        }
    }
}

// Criar instância global
const historyLogger = new HistoryLogger();

// Expor globalmente para debug
window.historyLogger = historyLogger;

// Adicionar comandos de debug ao console
if (historyLogger.isDebugMode) {
    console.log('🔧 Comandos de debug disponíveis:');
    console.log('  - historyLogger.downloadLogs() - Baixar logs');
    console.log('  - historyLogger.clearLogs() - Limpar logs');
    console.log('  - historyLogger.toggleDebug() - Alternar debug');
}