// Script para gerenciar o histórico de análises
const analysisHistory = (() => {
  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para carregar histórico de análises
  const loadAnalyses = async () => {
    try {
      const historyContainer = document.getElementById('analysis-history');
      if (!historyContainer) return;

      // Exibir mensagem de carregamento
      historyContainer.innerHTML = '<p class="loading">Carregando histórico de análises...</p>';

      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/analysis/history`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar histórico');
      }

      const data = await response.json();
      const analyses = data.analyses || [];

      if (analyses.length === 0) {
        historyContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>Nenhuma análise encontrada</h3>
            <p>Você ainda não realizou nenhuma análise de currículo.</p>
            <a href="analisar.html" class="btn-primary">Fazer primeira análise</a>
          </div>
        `;
        return;
      }

      // Construir lista de análises
      let analysesHtml = '<div class="analyses-grid">';

      analyses.forEach(analysis => {
        const scoreColor = getScoreColor(analysis.average_score);
        const statusLabel = getStatusLabel(analysis.status);

        analysesHtml += `
          <div class="analysis-card" data-id="${analysis.id}">
            <div class="analysis-header">
              <div class="analysis-file">
                <span class="file-icon">📄</span>
                <span class="file-name">${analysis.filename}</span>
              </div>
              <div class="analysis-score" style="color: ${scoreColor}">
                ${analysis.average_score.toFixed(1)}%
              </div>
            </div>
            
            <div class="analysis-info">
              <div class="analysis-summary">${analysis.summary}</div>
              <div class="analysis-meta">
                <span class="jobs-count">${analysis.jobs_analyzed} vaga${analysis.jobs_analyzed > 1 ? 's' : ''}</span>
                <span class="analysis-date">${analysis.formatted_date}</span>
              </div>
            </div>
            
            <div class="analysis-actions">
              <button class="btn-view" onclick="viewAnalysis(${analysis.id})">
                Ver Detalhes
              </button>
              <button class="btn-delete" onclick="deleteAnalysis(${analysis.id})">
                Deletar
              </button>
            </div>
          </div>
        `;
      });

      analysesHtml += '</div>';

      historyContainer.innerHTML = analysesHtml;
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      document.getElementById('analysis-history').innerHTML =
        `<p class="error-state">Erro ao carregar histórico: ${error.message}</p>`;
    }
  };

  // Função para visualizar uma análise
  const viewAnalysis = async (analysisId) => {
    try {
      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/analysis/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar análise');
      }

      const analysis = await response.json();

      // Salvar dados na sessionStorage e redirecionar para results.html
      sessionStorage.setItem('atsResult', JSON.stringify(analysis.result_data));
      sessionStorage.setItem('fileName', analysis.filename);

      window.location.href = 'results.html';

    } catch (error) {
      console.error('Erro ao visualizar análise:', error);
      alert('Erro ao carregar análise. Tente novamente.');
    }
  };

  // Função para deletar uma análise
  const deleteAnalysis = async (analysisId) => {
    if (!confirm('Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar análise');
      }

      // Recarregar histórico
      loadAnalyses();

    } catch (error) {
      console.error('Erro ao deletar análise:', error);
      alert('Erro ao deletar análise. Tente novamente.');
    }
  };

  // Função auxiliar para cor do score
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#ef4444';
    return '#6b7280';
  };

  // Função auxiliar para label do status
  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Concluída',
      'processing': 'Processando',
      'failed': 'Falhou'
    };
    return labels[status] || status;
  };

  // Expor funções globalmente
  window.viewAnalysis = viewAnalysis;
  window.deleteAnalysis = deleteAnalysis;

  // Inicializa e retorna função pública
  return {
    loadAnalyses
  };
})();

// Carregar histórico quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  // Se estivermos na página de histórico
  if (document.getElementById('analysis-history')) {
    analysisHistory.loadAnalyses();
  }
});
