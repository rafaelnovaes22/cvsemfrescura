// Central Version Management - CV Sem Frescura
// 🔄 Para atualizar versão: apenas mudar os valores abaixo

const CV_VERSION = {
    app: '2.4.0',
    timestamp: 1748114565, // Incrementar quando houver mudanças críticas

    // Gerar parâmetro de versão automaticamente
    get param() {
        return `v=${this.app}.${this.timestamp}`;
    },

    // URLs dos scripts com versão
    scripts: {
        config: '/assets/js/config.js',
        auth: '/assets/js/auth.js',
        header: '/assets/js/header-new.js',
        payment: '/assets/js/payment.js',
        history: '/assets/js/history.js',
        onboarding: '/assets/js/onboarding.js'
    },

    // Função para obter URL do script com versão
    getScriptUrl(scriptName) {
        const baseUrl = this.scripts[scriptName];
        if (!baseUrl) {
            console.warn(`❌ Script '${scriptName}' não encontrado na configuração de versão`);
            return scriptName;
        }
        return `${baseUrl}?${this.param}`;
    },

    // 🔄 Função para forçar reload de todos os scripts (útil para deploys)
    forceReload() {
        this.timestamp = Date.now();
        console.log(`🚀 Versão atualizada para build ${this.timestamp}`);
    }
};

// Função global para incluir scripts versionados
window.loadVersionedScript = function (scriptName) {
    return CV_VERSION.getScriptUrl(scriptName);
};

// 🔄 Função global para atualizar versão (útil em desenvolvimento)
window.updateVersion = function (newVersion = null) {
    if (newVersion) CV_VERSION.app = newVersion;
    CV_VERSION.forceReload();
    console.log(`✅ Versão atualizada: v${CV_VERSION.app} - Build ${CV_VERSION.timestamp}`);
    console.log('💡 Para aplicar: recarregue a página ou faça novo deploy');
};

// Log da versão atual
console.log(`🏷️ CV Sem Frescura v${CV_VERSION.app} - Build ${CV_VERSION.timestamp}`);
console.log('💡 Para atualizar versão: updateVersion("2.5.0") no console');

// Exportar globalmente
window.CV_VERSION = CV_VERSION; 