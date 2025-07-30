// onboarding.js - Gerenciamento do fluxo de onboarding para destravaCV

document.addEventListener('DOMContentLoaded', function () {
    console.log('Onboarding script carregado');
    // Adiciona um pequeno atraso para garantir que outros scripts estejam carregados
    setTimeout(initOnboarding, 500);
});

// Verificar se o usuário está logado e já completou o onboarding
async function initOnboarding() {
    console.log('Inicializando verificação de onboarding...');

    // Verificar se o auth está disponível
    if (!window.auth) {
        console.error('Módulo de autenticação não está disponível');
        return;
    }

    const user = window.auth.getUser();

    // Se não há usuário logado, não exibir onboarding
    if (!user) {
        console.log('Usuário não está logado, onboarding não será exibido');
        return;
    }

    console.log('Usuário logado:', user.name);

    // Verificar o status do onboarding com o servidor
    try {
        const token = window.auth.getToken();
        const apiBaseUrl = (() => {
            if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
                return window.CONFIG.api.baseUrl;
            }

            // Se CONFIG não estiver disponível, falhar explicitamente
            console.error('❌ CONFIG não disponível em onboarding!');
            throw new Error('Configuração não disponível');
        })();
        const res = await fetch(`${apiBaseUrl}/api/user/onboarding-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao verificar status de onboarding');

        const data = await res.json();
        console.log('Status de onboarding:', data);

        // Se o onboarding já foi concluído, não exibir novamente
        if (data.onboarding_completed) {
            console.log('Onboarding já foi concluído');
            return;
        }

        // Iniciar fluxo de onboarding para novos usuários
        console.log('Exibindo modal de onboarding para novo usuário');
        showOnboardingModal();
    } catch (error) {
        console.error('Erro ao verificar status de onboarding:', error);
    }
}

// Exibir o modal de onboarding
function showOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) {
        console.error('Modal de onboarding não encontrado');
        return;
    }

    // Garantir que o modal esteja visível
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Impedir rolagem da página

    console.log('Modal de onboarding exibido');

    // Configurar navegação entre etapas
    setupOnboardingNavigation();
}

// Expor funções para acesso global
window.initOnboarding = initOnboarding;
window.showOnboardingModal = showOnboardingModal;

// Configurar a navegação entre as etapas do onboarding
function setupOnboardingNavigation() {
    const steps = document.querySelectorAll('.onboarding-step');
    const nextButtons = document.querySelectorAll('.onboarding-next');
    const backButtons = document.querySelectorAll('.onboarding-back');
    const progressDots = document.querySelectorAll('.progress-dot');
    const skipButton = document.querySelector('.onboarding-skip');

    let currentStep = 0;

    // Mostrar a primeira etapa inicialmente
    showStep(currentStep);

    // Configurar botões "Próximo"
    nextButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Validar campos da etapa atual se necessário
            if (validateCurrentStep(currentStep)) {
                if (currentStep < steps.length - 1) {
                    currentStep++;
                    showStep(currentStep);
                } else {
                    // Última etapa - salvar dados e concluir onboarding
                    completeOnboarding();
                }
            }
        });
    });

    // Configurar botões "Voltar"
    backButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Botão "Pular" (opcional)
    if (skipButton) {
        skipButton.addEventListener('click', function () {
            // Confirmar se o usuário realmente deseja pular o onboarding
            if (confirm('Tem certeza que deseja pular o tutorial de introdução? Você pode configurar suas preferências mais tarde nas configurações.')) {
                // Concluir onboarding com valores padrão
                completeOnboarding(true);
            }
        });
    }

    // Função para mostrar a etapa específica
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
        });

        // Atualizar indicadores de progresso
        progressDots.forEach((dot, index) => {
            if (index <= stepIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Validar a etapa atual do onboarding
function validateCurrentStep(stepIndex) {
    switch (stepIndex) {
        case 0:
            // Primeira etapa - escolha da área profissional
            const jobArea = document.querySelector('input[name="job_area"]:checked');
            if (!jobArea) {
                alert('Por favor, selecione sua área de atuação');
                return false;
            }
            return true;

        case 1:
            // Segunda etapa - nível de experiência
            const experienceLevel = document.querySelector('input[name="experience_level"]:checked');
            if (!experienceLevel) {
                alert('Por favor, selecione seu nível de experiência');
                return false;
            }
            return true;

        case 2:
            // Terceira etapa - configurações adicionais (opcional)
            return true;

        default:
            return true;
    }
}

// Salvar dados e concluir o onboarding
async function completeOnboarding(isSkipped = false) {
    try {
        // Valores padrão para o caso de pular o onboarding
        let jobArea = 'outro';
        let experienceLevel = 'medio';
        let preferences = {};

        // Se não foi pulado, coletar os dados dos campos
        if (!isSkipped) {
            const jobAreaElement = document.querySelector('input[name="job_area"]:checked');
            const experienceLevelElement = document.querySelector('input[name="experience_level"]:checked');

            jobArea = jobAreaElement ? jobAreaElement.value : 'outro';
            experienceLevel = experienceLevelElement ? experienceLevelElement.value : 'medio';

            // Coletar preferências adicionais
            const notificationsEnabled = document.getElementById('notifications_enabled')?.checked || false;
            const darkModeEnabled = document.getElementById('dark_mode_enabled')?.checked || false;

            preferences = {
                notifications: notificationsEnabled,
                darkMode: darkModeEnabled
            };
        }

        // Enviar dados para o servidor
        const token = window.auth.getToken();
        const apiBaseUrl = (() => {
            if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
                return window.CONFIG.api.baseUrl;
            }

            // Se CONFIG não estiver disponível, falhar explicitamente
            console.error('❌ CONFIG não disponível em onboarding!');
            throw new Error('Configuração não disponível');
        })();
        const res = await fetch(`${apiBaseUrl}/api/user/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                job_area: jobArea,
                experience_level: experienceLevel,
                preferences: preferences
            })
        });

        if (!res.ok) throw new Error('Erro ao salvar dados de onboarding');

        const data = await res.json();

        // Atualizar dados do usuário no localStorage
        if (data.user) {
            const currentUser = window.auth.getUser();
            const updatedUser = { ...currentUser, ...data.user };
            window.auth.saveAuth(window.auth.getToken(), updatedUser);
        }

        // Fechar o modal de onboarding
        const modal = document.getElementById('onboardingModal');
        if (modal) modal.style.display = 'none';

        // Mostrar mensagem de conclusão
        showCompletionMessage();

    } catch (error) {
        console.error('Erro ao concluir onboarding:', error);
        alert('Ocorreu um erro ao salvar suas preferências. Tente novamente mais tarde.');
    }
}

// Exibir mensagem de conclusão do onboarding
function showCompletionMessage() {
    const welcomeToast = document.createElement('div');
    welcomeToast.className = 'welcome-toast';
    welcomeToast.innerHTML = Sanitizer.sanitizeHtml(`
        <div class="welcome-toast-content">
            <h3>Seja bem-vindo ao destravaCV!</h3>
            <p>Agora você está pronto para analisar seu currículo e encontrar as melhores vagas.</p>
            <button class="welcome-toast-close">Entendi</button>
        </div>
    `, ['div', 'h3', 'p', 'button']);

    document.body.appendChild(welcomeToast);

    // Mostrar o toast com animação
    setTimeout(() => {
        welcomeToast.classList.add('show');
    }, 100);

    // Configurar o botão de fechar
    const closeButton = welcomeToast.querySelector('.welcome-toast-close');
    closeButton.addEventListener('click', () => {
        welcomeToast.classList.remove('show');
        setTimeout(() => {
            welcomeToast.remove();
        }, 300);
    });

    // Fechar automaticamente após 8 segundos
    setTimeout(() => {
        if (document.body.contains(welcomeToast)) {
            welcomeToast.classList.remove('show');
            setTimeout(() => {
                welcomeToast.remove();
            }, 300);
        }
    }, 8000);
}
