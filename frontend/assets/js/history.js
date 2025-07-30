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
        historyContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Você precisa estar logado para ver o histórico.</p>', ['p']);
        return;
      }

      // Exibir mensagem de carregamento
      historyContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="loading">Carregando histórico de transações...</p>', ['p']);

      const apiBaseUrl = (() => {
        // CONFIG sempre está disponível - usar sempre
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          console.log('🔧 Usando CONFIG.api.baseUrl:', window.CONFIG.api.baseUrl || 'URL relativa');
          return window.CONFIG.api.baseUrl;
        }

        // Se por algum motivo CONFIG não estiver disponível, falhar explicitamente
        console.error('❌ CONFIG não disponível! Isso não deveria acontecer.');
        throw new Error('Configuração não disponível');
      })();
      const response = await fetch(`${apiBaseUrl}/api/payment/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          historyContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Sessão expirada. Faça login novamente.</p>', ['p']);
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
        historyContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="empty-state">Você ainda não possui transações.</p>', ['p']);
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

      historyContainer.innerHTML = Sanitizer.sanitizeHtml(tableHtml, ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'i']);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      document.getElementById('transaction-history').innerHTML = Sanitizer.sanitizeHtml(
        '<p class="error-state">Erro ao carregar histórico. Tente novamente mais tarde.</p>',
        ['p']
      );
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
        analysisContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Você precisa estar logado para ver o histórico.</p>', ['p']);
        return;
      }

      // Exibir mensagem de carregamento
      analysisContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="loading">Carregando histórico de análises...</p>', ['p']);

      const apiBaseUrl = (() => {
        // CONFIG sempre está disponível - usar sempre
        if (window.CONFIG && window.CONFIG.api && typeof window.CONFIG.api.baseUrl === 'string') {
          console.log('🔧 Usando CONFIG.api.baseUrl:', window.CONFIG.api.baseUrl || 'URL relativa');
          return window.CONFIG.api.baseUrl;
        }

        // Se por algum motivo CONFIG não estiver disponível, falhar explicitamente
        console.error('❌ CONFIG não disponível! Isso não deveria acontecer.');
        throw new Error('Configuração não disponível');
      })();
      const response = await fetch(`${apiBaseUrl}/api/ats/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          analysisContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Sessão expirada. Faça login novamente.</p>', ['p']);
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
        analysisContainer.innerHTML = Sanitizer.sanitizeHtml(`
          <p class="empty-state">
            <i class="fas fa-file-alt" style="font-size: 48px; color: #e0e0e0; margin-bottom: 16px;"></i>
            <br>
            Você ainda não realizou nenhuma análise.
            <br>
            <a href="/analisar.html" style="color: #10b981; text-decoration: none; font-weight: 500; margin-top: 8px; display: inline-block;">
              Fazer primeira análise →
            </a>
          </p>
        `, ['p', 'i', 'br', 'a']);
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

      analysisContainer.innerHTML = Sanitizer.sanitizeHtml(tableHtml, ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'button', 'i', 'a']);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      document.getElementById('analysis-history').innerHTML = Sanitizer.sanitizeHtml(
        '<p class="error-state">Erro ao carregar histórico. Tente novamente mais tarde.</p>',
        ['p']
      );
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

      // Se CONFIG não estiver disponível, falhar explicitamente
      console.error('❌ CONFIG não disponível em viewAnalysis! Isso não deveria acontecer.');
      throw new Error('Configuração não disponível');
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
