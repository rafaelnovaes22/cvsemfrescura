/**
 * Gerenciador de erros para o frontend
 * Lida com diferentes tipos de erros, incluindo alucinações de IA
 */

class ErrorHandler {
  /**
   * Manipula a resposta HTTP e detecta erros específicos
   * @param {Response} response - Objeto de resposta HTTP
   * @returns {Promise<Object>} - Dados da resposta ou lança erro
   */
  static async handleFetchResponse(response) {
    if (response.ok) {
      return await response.json();
    }
    
    // Tentar obter detalhes do erro
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Se não for possível converter para JSON, usa o texto da resposta
      errorData = { 
        error: await response.text() || 'Erro desconhecido',
        message: 'Não foi possível processar sua solicitação' 
      };
    }
    
    // Se for um erro de alucinação (código 428)
    if (response.status === 428 && errorData.isHallucination) {
      this.handleHallucinationError(errorData);
      // Não propaga o erro para permitir que o código de redirecionamento funcione
      return null;
    }
    
    // Para outros erros, lança um erro com os detalhes
    const error = new Error(errorData.message || 'Erro no processamento da requisição');
    error.response = response;
    error.data = errorData;
    throw error;
  }
  
  /**
   * Manipula erros de alucinação especificamente
   * @param {Object} errorData - Dados do erro de alucinação
   */
  static handleHallucinationError(errorData) {
    console.warn('Alucinação de IA detectada:', errorData);
    
    // Armazenar dados de erro na sessionStorage para exibi-los na página de erro
    sessionStorage.setItem('hallucinationError', JSON.stringify(errorData));
    
    // Verificar se há um URL de redirecionamento nos dados do erro
    if (errorData.redirectTo) {
      window.location.href = errorData.redirectTo;
    } else {
      // Fallback para página inicial se não houver um URL específico
      window.location.href = '/hallucination-error.html';
    }
  }
  
  /**
   * Exibe mensagem de erro na UI
   * @param {string} message - Mensagem de erro
   * @param {string} containerId - ID do elemento contentor (opcional)
   */
  static showErrorMessage(message, containerId = 'error-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      // Se o contentor não existir, criar um dinamicamente
      const newContainer = document.createElement('div');
      newContainer.id = containerId;
      newContainer.className = 'error-container';
      document.body.insertBefore(newContainer, document.body.firstChild);
      this.showErrorMessage(message, containerId);
      return;
    }
    
    // Limpar qualquer erro anterior
    container.innerHTML = '';
    
    // Criar elemento de mensagem de erro
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <p>${message}</p>
        <button class="error-dismiss">Fechar</button>
      </div>
    `;
    
    // Adicionar estilos se ainda não existirem
    if (!document.getElementById('error-handler-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-handler-styles';
      styles.textContent = `
        .error-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: 80%;
          max-width: 500px;
        }
        .error-message {
          background-color: #fff;
          border-left: 4px solid #e74c3c;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          animation: errorFadeIn 0.3s ease-out;
        }
        .error-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        .error-content {
          flex: 1;
        }
        .error-content p {
          margin: 0 0 8px;
          color: #333;
        }
        .error-dismiss {
          background: none;
          border: 1px solid #ccc;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .error-dismiss:hover {
          background-color: #f8f8f8;
        }
        @keyframes errorFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Adicionar manipulador para botão de fechar
    container.appendChild(errorEl);
    container.querySelector('.error-dismiss').addEventListener('click', () => {
      errorEl.style.display = 'none';
    });
    
    // Auto-ocultar após 10 segundos
    setTimeout(() => {
      if (errorEl && errorEl.parentNode) {
        errorEl.style.display = 'none';
      }
    }, 10000);
  }
}

// Exportar para uso global
window.ErrorHandler = ErrorHandler;
