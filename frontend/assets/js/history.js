// Script para gerenciar o histórico de transações e análises
window.transactionHistory = (() => {
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
      const token = window.getAuthToken();
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
      console.log('🔄 loadAnalyses: Iniciando carregamento das análises...');

      const analysisContainer = document.getElementById('analysis-history');
      if (!analysisContainer) {
        console.error('❌ loadAnalyses: Container #analysis-history não encontrado!');
        return;
      }
      console.log('✅ loadAnalyses: Container encontrado');

      // Verificar autenticação antes de fazer a requisição
      const token = window.getAuthToken();
      console.log('🔑 loadAnalyses: Token obtido:', !!token);

      if (!token) {
        console.error('❌ loadAnalyses: Token não encontrado');
        analysisContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Você precisa estar logado para ver o histórico.</p>', ['p']);
        return;
      }

      // Exibir mensagem de carregamento
      console.log('📝 loadAnalyses: Exibindo mensagem de carregamento...');
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

      const url = `${apiBaseUrl}/api/ats/history`;
      console.log('📡 loadAnalyses: Fazendo requisição para:', url);
      console.log('🔑 loadAnalyses: Usando token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 loadAnalyses: Status da resposta:', response.status);
      console.log('📊 loadAnalyses: Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ loadAnalyses: Erro na resposta:', response.status, errorText);

        if (response.status === 401) {
          analysisContainer.innerHTML = Sanitizer.sanitizeHtml('<p class="error-state">Sessão expirada. Faça login novamente.</p>', ['p']);
          // Limpar dados de autenticação inválidos
          if (window.auth && window.auth.clearAuth) {
            window.auth.clearAuth();
          }
          return;
        }
        throw new Error(`Falha ao carregar histórico de análises: ${response.status} - ${errorText}`);
      }

      const analyses = await response.json();
      console.log('📋 loadAnalyses: Análises recebidas:', analyses.length);

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
      console.log('🏗️ loadAnalyses: Construindo tabela HTML...');
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
      console.log('📝 loadAnalyses: Adicionando análises à tabela...');
      analyses.forEach((analysis, index) => {
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
              <button class="view-analysis-btn" data-analysis-id="${analysis.id}">
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

      console.log('🔄 loadAnalyses: Inserindo HTML no container...');
      analysisContainer.innerHTML = Sanitizer.sanitizeHtml(tableHtml, ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'button', 'i', 'a']);
      console.log('✅ loadAnalyses: HTML inserido com sucesso');

      // Adicionar event listeners para os botões "Ver Análise"
      const viewButtons = analysisContainer.querySelectorAll('.view-analysis-btn');
      console.log('🔧 loadAnalyses: Configurando', viewButtons.length, 'botões "Ver Análise"');

      viewButtons.forEach((button, index) => {
        button.addEventListener('click', function (event) {
          event.preventDefault(); // Prevenir comportamento padrão

          const analysisId = this.getAttribute('data-analysis-id');
          console.log('🎯 Botão "Ver Análise" clicado!');
          console.log('  - Index:', index);
          console.log('  - Analysis ID:', analysisId);
          console.log('  - Button element:', this);

          if (!analysisId) {
            console.error('❌ ID da análise não encontrado no botão!');
            alert('Erro: ID da análise não encontrado. Tente recarregar a página.');
            return;
          }

          // Verificar se a função existe antes de chamar
          if (typeof window.viewAnalysis === 'function') {
            console.log('✅ Chamando window.viewAnalysis...');
            window.viewAnalysis(analysisId);
          } else if (typeof viewAnalysis === 'function') {
            console.log('✅ Chamando viewAnalysis...');
            viewAnalysis(analysisId);
          } else {
            console.error('❌ Função viewAnalysis não encontrada!');
            console.error('❌ window.viewAnalysis:', typeof window.viewAnalysis);
            console.error('❌ viewAnalysis:', typeof viewAnalysis);
            alert('Erro: Função de visualização não carregada. Recarregue a página.');
          }
        });
        console.log('✅ Event listener adicionado ao botão', index + 1, 'com ID:', button.getAttribute('data-analysis-id'));
      });

      console.log('🎉 loadAnalyses: Carregamento completo! Tudo funcionando.');
    } catch (error) {
      console.error('❌ loadAnalyses: Erro ao carregar análises:', error);
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
    window.transactionHistory.loadTransactions();
  } else if (tabName === 'analyses') {
    window.transactionHistory.loadAnalyses();
  }
}

// Função para visualizar uma análise específica (global)
window.viewAnalysis = async function (analysisId) {
  try {
    // Log da ação do usuário
    if (window.historyLogger) {
      window.historyLogger.logUserAction('View Analysis Clicked', { analysisId });
    }

    console.log('🔍 Carregando análise:', analysisId);

    // Verificar autenticação antes de fazer a requisição
    const token = window.getAuthToken();
    console.log('🔑 Token disponível:', !!token);

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

    const endpoint = `${apiBaseUrl}/api/ats/analysis/${analysisId}`;
    console.log('📡 Fazendo requisição para:', endpoint);

    // Log da chamada da API
    if (window.historyLogger) {
      window.historyLogger.logApiCall(endpoint, 'GET');
    }

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const duration = Date.now() - startTime;

    console.log('📊 Status da resposta:', response.status);

    // Log da resposta da API
    if (window.historyLogger) {
      window.historyLogger.logApiResponse(endpoint, response.status, null, duration);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);

      // Log do erro
      if (window.historyLogger) {
        window.historyLogger.log('API Error', {
          endpoint,
          status: response.status,
          error: errorText,
          analysisId
        }, 'error');
      }

      if (response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        // Limpar dados de autenticação inválidos
        if (window.auth && window.auth.clearAuth) {
          window.auth.clearAuth();
        }
        return;
      }

      throw new Error(`Falha ao carregar análise: ${response.status} - ${errorText}`);
    }

    const analysisResult = await response.json();
    console.log('✅ Análise carregada com sucesso');
    console.log('📊 Dados da análise recebidos:', analysisResult);

    // Log dos dados recebidos
    if (window.historyLogger) {
      window.historyLogger.log('Analysis Data Received', {
        analysisId,
        dataKeys: Object.keys(analysisResult || {}),
        hasConclusion: !!analysisResult.conclusion,
        hasResumo: !!analysisResult.resumo,
        hasKeywords: !!(analysisResult.job_keywords_present && analysisResult.job_keywords_present.length > 0),
        dataSize: JSON.stringify(analysisResult).length
      }, 'success');
    }

    // Validar dados antes de salvar
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('Dados da análise são inválidos');
    }

    // Garantir que os dados essenciais estejam presentes
    if (!analysisResult.conclusion && !analysisResult.resumo && !analysisResult.job_keywords_present) {
      console.warn('⚠️ Análise pode estar incompleta, mas prosseguindo...');
    }

    // Salvar resultado na sessionStorage e redirecionar para results.html
    console.log('💾 Salvando no sessionStorage...');

    // Garantir que isHistoricalView está definido
    analysisResult.isHistoricalView = true;

    const analysisResultString = JSON.stringify(analysisResult);
    sessionStorage.setItem('atsResult', analysisResultString);

    // O fileName agora vem dentro do analysisResult
    const fileName = analysisResult.fileName || analysisResult.resumeFileName || 'análise-anterior.pdf';
    sessionStorage.setItem('fileName', fileName);
    sessionStorage.setItem('isHistoricalView', 'true');

    console.log('✅ Dados salvos no sessionStorage:');
    console.log('  - atsResult size:', analysisResultString.length, 'characters');
    console.log('  - fileName:', sessionStorage.getItem('fileName'));
    console.log('  - isHistoricalView:', sessionStorage.getItem('isHistoricalView'));
    console.log('  - analysisResult keys:', Object.keys(analysisResult));
    console.log('  - hasConclusion:', !!analysisResult.conclusion);
    console.log('  - hasResumo:', !!analysisResult.resumo);
    console.log('  - hasKeywords:', !!(analysisResult.job_keywords_present && analysisResult.job_keywords_present.length > 0));

    // Log do salvamento no sessionStorage
    if (window.historyLogger) {
      window.historyLogger.logSessionStorage('SET', 'atsResult', analysisResultString.length);
      window.historyLogger.logSessionStorage('SET', 'fileName', fileName.length);
      window.historyLogger.logSessionStorage('SET', 'isHistoricalView', 4);

      window.historyLogger.log('SessionStorage Data Saved', {
        analysisId,
        fileName,
        dataSize: analysisResultString.length,
        hasRequiredFields: {
          conclusion: !!analysisResult.conclusion,
          resumo: !!analysisResult.resumo,
          keywords: !!(analysisResult.job_keywords_present && analysisResult.job_keywords_present.length > 0)
        }
      }, 'success');
    }

    // Pequeno delay para garantir que os dados foram salvos
    setTimeout(() => {
      console.log('🔄 Redirecionando para results.html...');
      window.location.href = 'results.html';
    }, 100);
  } catch (error) {
    console.error('Erro ao carregar análise:', error);
    alert('Erro ao carregar análise: ' + error.message);
  }
}

// Função helper para obter token (disponível globalmente)
window.getAuthToken = function () {
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
    window.transactionHistory.loadTransactions();
  }
});
