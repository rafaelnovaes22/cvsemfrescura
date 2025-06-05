// Script para gerenciar o histórico de transações e análises
const transactionHistory = (() => {
  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
  };

  // Função para obter token com fallback seguro
  const getAuthToken = () => {
    if (window.auth && typeof window.auth.getToken === 'function') {
      return window.auth.getToken();
    }
    // Fallback para localStorage
    return localStorage.getItem('token');
  };

  // Função para carregar histórico de transações
  const loadTransactions = async () => {
    try {
      const historyContainer = document.getElementById('transaction-history');
      if (!historyContainer) return;

      // Verificar autenticação antes de fazer a requisição
      const token = getAuthToken();
      if (!token) {
        historyContainer.innerHTML = '<p class="error-state">Você precisa estar logado para ver o histórico.</p>';
        return;
      }

      // Exibir mensagem de carregamento
      historyContainer.innerHTML = '<p class="loading">Carregando histórico de transações...</p>';

      const apiBaseUrl = (() => {
        // Usar CONFIG se disponível (mais confiável)
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          console.log('🔧 Usando CONFIG.api.baseUrl:', window.CONFIG.api.baseUrl || 'URL relativa');
          return window.CONFIG.api.baseUrl;
        }

        // Fallback apenas se CONFIG não estiver disponível
        const hostname = window.location.hostname;
        console.log('⚠️ CONFIG não disponível, usando fallback para hostname:', hostname);

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3000';
        }

        return '';
      })();
      const response = await fetch(`${apiBaseUrl}/api/payment/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          historyContainer.innerHTML = '<p class="error-state">Sessão expirada. Faça login novamente.</p>';
          // Limpar dados de autenticação inválidos
          if (window.auth && window.auth.clearAuth) {
            window.auth.clearAuth();
          }
          return;
        }
        throw new Error('Falha ao carregar histórico');
      }

      const transactions = await response.json();

      if (transactions.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">Você ainda não possui transações.</p>';
        return;
      }

      // Construir tabela de histórico
      let tableHtml = `
        <table class="transaction-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Créditos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Adicionar cada transação à tabela
      // Filtra transações pendentes no frontend como medida de segurança adicional
      // O backend já filtra, mas mantemos esta verificação para consistência
      transactions
        .filter(transaction => transaction.status !== 'pending') // Filtrar transações pendentes
        .forEach(transaction => {
          const statusClass = {
            'completed': 'status-completed',
            'failed': 'status-failed',
            'refunded': 'status-refunded'
          }[transaction.status] || '';

          const statusLabel = {
            'completed': 'Concluído',
            'failed': 'Recusado', // Alterado de "Falhou" para "Recusado" para melhor UX
            'refunded': 'Reembolsado'
          }[transaction.status] || transaction.status;

          const planName = transaction.metadata?.planName || 'Não especificado';

          tableHtml += `
            <tr>
              <td>${formatDate(transaction.createdAt)}</td>
              <td>${planName}</td>
              <td>${formatCurrency(transaction.amount)}</td>
              <td>${transaction.credits}</td>
              <td class="${statusClass}">${statusLabel}</td>
            </tr>
          `;
        });

      tableHtml += `
          </tbody>
        </table>
      `;

      historyContainer.innerHTML = tableHtml;
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      document.getElementById('transaction-history').innerHTML =
        `<p class="error-state">Erro ao carregar histórico: ${error.message}</p>`;
    }
  };

  // Função para carregar histórico de análises
  const loadAnalyses = async () => {
    try {
      const analysisContainer = document.getElementById('analysis-history');
      if (!analysisContainer) return;

      // Verificar autenticação antes de fazer a requisição
      const token = getAuthToken();
      if (!token) {
        analysisContainer.innerHTML = '<p class="error-state">Você precisa estar logado para ver o histórico.</p>';
        return;
      }

      // Exibir mensagem de carregamento
      analysisContainer.innerHTML = '<p class="loading">Carregando histórico de análises...</p>';

      const apiBaseUrl = (() => {
        // Usar CONFIG se disponível (mais confiável)
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          console.log('🔧 Usando CONFIG.api.baseUrl:', window.CONFIG.api.baseUrl || 'URL relativa');
          return window.CONFIG.api.baseUrl;
        }

        // Fallback apenas se CONFIG não estiver disponível
        const hostname = window.location.hostname;
        console.log('⚠️ CONFIG não disponível, usando fallback para hostname:', hostname);

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3000';
        }

        return '';
      })();
      const response = await fetch(`${apiBaseUrl}/api/ats/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          analysisContainer.innerHTML = '<p class="error-state">Sessão expirada. Faça login novamente.</p>';
          // Limpar dados de autenticação inválidos
          if (window.auth && window.auth.clearAuth) {
            window.auth.clearAuth();
          }
          return;
        }
        throw new Error('Falha ao carregar histórico de análises');
      }

      const analyses = await response.json();

      if (analyses.length === 0) {
        analysisContainer.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <h3 style="color: var(--primary); margin-bottom: 12px;">Nenhuma análise encontrada</h3>
            <p style="color: #6b7280; margin-bottom: 24px;">
              Você ainda não realizou nenhuma análise de currículo. 
              Que tal fazer sua primeira análise agora?
            </p>
            <a href="analisar.html" style="
              display: inline-block; 
              background: var(--primary); 
              color: white; 
              padding: 12px 24px; 
              border-radius: 8px; 
              text-decoration: none; 
              font-weight: 600;
              transition: background-color 0.3s;
            " onmouseover="this.style.backgroundColor='var(--primary-dark)'" 
              onmouseout="this.style.backgroundColor='var(--primary)'">
              🚀 Fazer primeira análise
            </a>
          </div>
        `;
        return;
      }

      // Construir tabela de análises
      let tableHtml = `
        <table class="analysis-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Arquivo</th>
              <th>Vagas Analisadas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Adicionar cada análise à tabela
      analyses.forEach(analysis => {
        const shortFileName = analysis.fileName && analysis.fileName.length > 30
          ? analysis.fileName.substring(0, 30) + '...'
          : analysis.fileName || 'Não informado';

        tableHtml += `
          <tr>
            <td class="analysis-date">${formatDate(analysis.createdAt)}</td>
            <td title="${analysis.fileName || 'Não informado'}">${shortFileName}</td>
            <td>
              <span class="job-count-badge">${analysis.jobCount} vaga${analysis.jobCount !== 1 ? 's' : ''}</span>
            </td>
            <td>
              <button class="view-analysis-btn" onclick="viewAnalysis('${analysis.id}')">
                Ver Análise
              </button>
            </td>
          </tr>
        `;
      });

      tableHtml += `
          </tbody>
        </table>
      `;

      analysisContainer.innerHTML = tableHtml;
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      document.getElementById('analysis-history').innerHTML =
        `<p class="error-state">Erro ao carregar histórico de análises: ${error.message}</p>`;
    }
  };

  // Inicializa e retorna função pública
  return {
    loadTransactions,
    loadAnalyses
  };
})();

// Função para alternar entre abas
function switchTab(tabName) {
  // Remover classe active de todas as abas e conteúdos
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Adicionar classe active na aba clicada
  event.target.classList.add('active');

  // Mostrar conteúdo correspondente
  const contentId = tabName + '-content';
  document.getElementById(contentId).classList.add('active');

  // Carregar dados se necessário
  if (tabName === 'transactions') {
    transactionHistory.loadTransactions();
  } else if (tabName === 'analyses') {
    transactionHistory.loadAnalyses();
  }
}

// Função para visualizar uma análise específica
async function viewAnalysis(analysisId) {
  try {
    // Verificar autenticação antes de fazer a requisição
    const token = getAuthToken();
    if (!token) {
      alert('Você precisa estar logado para ver a análise.');
      return;
    }

    const apiBaseUrl = (() => {
      if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
        return window.CONFIG.api.baseUrl;
      }

      // Fallback: detectar ambiente
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000'; // Desenvolvimento
      } else {
        return ''; // Produção - URL relativa
      }
    })();
    const response = await fetch(`${apiBaseUrl}/api/ats/analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        // Limpar dados de autenticação inválidos
        if (window.auth && window.auth.clearAuth) {
          window.auth.clearAuth();
        }
        return;
      }
      throw new Error('Falha ao carregar análise');
    }

    const analysisResult = await response.json();

    // Salvar resultado na sessionStorage e redirecionar para results.html
    sessionStorage.setItem('atsResult', JSON.stringify(analysisResult));
    sessionStorage.setItem('fileName', analysisResult.fileName || 'análise-anterior.pdf');
    sessionStorage.setItem('isHistoricalView', 'true');

    // Redirecionar para a página de resultados
    window.location.href = 'results.html';
  } catch (error) {
    console.error('Erro ao carregar análise:', error);
    alert('Erro ao carregar análise: ' + error.message);
  }
}

// Função helper para obter token (disponível globalmente para viewAnalysis)
function getAuthToken() {
  if (window.auth && typeof window.auth.getToken === 'function') {
    return window.auth.getToken();
  }
  // Fallback para localStorage
  return localStorage.getItem('token');
}

// Carregar histórico quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  // Se estivermos na página de histórico
  if (document.getElementById('transaction-history')) {
    // Carregar transações por padrão (aba ativa)
    transactionHistory.loadTransactions();
  }
});
