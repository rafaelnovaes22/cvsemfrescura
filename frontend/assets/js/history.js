// Script para gerenciar o histórico de transações
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

  // Função para carregar histórico de transações
  const loadTransactions = async () => {
    try {
      const historyContainer = document.getElementById('transaction-history');
      if (!historyContainer) return;

      // Exibir mensagem de carregamento
      historyContainer.innerHTML = '<p class="loading">Carregando histórico de transações...</p>';

      const apiBaseUrl = (window.CONFIG && window.CONFIG.api && window.CONFIG.api.baseUrl) || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/payment/history`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
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
      transactions.forEach(transaction => {
        const statusClass = {
          'pending': 'status-pending',
          'completed': 'status-completed',
          'failed': 'status-failed',
          'refunded': 'status-refunded'
        }[transaction.status] || '';

        const statusLabel = {
          'pending': 'Pendente',
          'completed': 'Concluído',
          'failed': 'Falhou',
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

  // Inicializa e retorna função pública
  return {
    loadTransactions
  };
})();

// Carregar histórico quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  // Se estivermos na página de histórico
  if (document.getElementById('transaction-history')) {
    transactionHistory.loadTransactions();
  }
});
