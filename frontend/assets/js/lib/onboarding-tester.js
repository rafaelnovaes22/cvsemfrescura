/**
 * Utilitário para testes de onboarding
 * 
 * Este script facilita o teste do fluxo de onboarding, fornecendo
 * métodos para simular diferentes estados e cenários.
 */

class OnboardingTester {
    constructor() {
        this.initialized = false;
        console.log('🧪 Onboarding Tester inicializado');
    }

    /**
     * Inicializa o tester e adiciona o painel de controle à interface
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.addControlPanel();

        // Intercepta as chamadas de API relacionadas ao onboarding
        this.interceptApis();
    }

    /**
     * Adiciona um painel de controle à interface para testes manuais
     */
    addControlPanel() {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '20px';
        panel.style.right = '20px';
        panel.style.backgroundColor = 'rgba(88, 56, 25, 0.9)';
        panel.style.padding = '15px';
        panel.style.borderRadius = '10px';
        panel.style.zIndex = '9999';
        panel.style.color = 'white';
        panel.style.fontFamily = 'IBM Plex Sans, sans-serif';
        panel.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        panel.style.maxWidth = '320px';
        panel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; font-size: 14px;">🧪 Tester de Onboarding</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-force-onboarding" style="background: #ECD9B5; color: #583819; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">Forçar Exibição do Onboarding</button>
                <button id="btn-reset-onboarding" style="background: #ECD9B5; color: #583819; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">Resetar Status de Onboarding</button>
                <button id="btn-toggle-panel" style="background: #583819; color: white; border: 1px solid #ECD9B5; padding: 8px; border-radius: 5px; margin-top: 5px; cursor: pointer;">Esconder Painel</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Adicionar eventos
        document.getElementById('btn-force-onboarding').addEventListener('click', () => {
            this.forceShowOnboarding();
        });

        document.getElementById('btn-reset-onboarding').addEventListener('click', () => {
            this.resetOnboardingStatus();
        });

        document.getElementById('btn-toggle-panel').addEventListener('click', (e) => {
            const btn = e.target;
            const controls = btn.parentElement;
            if (btn.textContent === 'Esconder Painel') {
                controls.style.display = 'none';
                btn.textContent = 'Mostrar Painel';
                controls.parentNode.style.width = 'auto';
                controls.parentNode.style.height = 'auto';
                controls.parentNode.style.padding = '10px';
            } else {
                controls.style.display = 'flex';
                btn.textContent = 'Esconder Painel';
                controls.parentNode.style.width = '';
                controls.parentNode.style.height = '';
                controls.parentNode.style.padding = '15px';
            }
        });
    }

    /**
     * Intercepta chamadas de API para facilitar testes
     */
    interceptApis() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            // Capturar chamadas para a API de onboarding
            if (url.includes('/api/user/onboarding-status')) {
                console.log('🧪 Interceptando chamada de status de onboarding');
                // Adicione logs ou modificações para teste
            }

            // Prosseguir com a chamada original
            return originalFetch(url, options);
        };
    }

    /**
     * Força a exibição do modal de onboarding
     */
    forceShowOnboarding() {
        const modal = document.getElementById('onboardingModal');
        if (modal) {
            console.log('🧪 Forçando exibição do modal de onboarding');
            modal.style.display = 'flex';

            // Configurar navegação de onboarding
            if (typeof setupOnboardingNavigation === 'function') {
                setupOnboardingNavigation();
            } else {
                console.error('🧪 Função setupOnboardingNavigation não encontrada');
            }
        } else {
            console.error('🧪 Modal de onboarding não encontrado no DOM');
        }
    }

    /**
     * Reseta o status de onboarding do usuário atual
     */
    async resetOnboardingStatus() {
        if (!window.auth || !window.auth.getToken()) {
            console.error('🧪 Usuário não está autenticado');
            return;
        }

        try {
            console.log('🧪 Resetando status de onboarding...');

            // Simular chamada para facilitar testes - em produção, crie um endpoint específico
            const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3001';
            await fetch(`${apiBaseUrl}/api/user/reset-onboarding`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.auth.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🧪 Status de onboarding resetado com sucesso');
            alert('Status de onboarding resetado. Recarregue a página para testar.');
        } catch (error) {
            console.error('🧪 Erro ao resetar status de onboarding:', error);
            alert('Erro ao resetar status. Consulte o console para detalhes.');
        }
    }
}

// Inicializar o tester automaticamente em ambiente de desenvolvimento
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.onboardingTester = new OnboardingTester();
        // Atraso para garantir que outros scripts sejam carregados
        setTimeout(() => {
            window.onboardingTester.init();
        }, 1000);
    }
});
