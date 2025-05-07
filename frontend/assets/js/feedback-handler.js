/**
 * Sistema de feedback do usuário para reportar alucinações e respostas incorretas
 * Interage com o sistema de coleta de feedback no backend
 */

class FeedbackSystem {
  constructor() {
    this.apiEndpoint = '/api/feedback';
    this.sessionId = this._generateSessionId();
    this.currentResponseId = null;
  }

  /**
   * Gera um ID de sessão único para o usuário atual
   * @returns {string} ID da sessão
   * @private
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  }

  /**
   * Configura o ID da resposta atual
   * @param {string} responseId ID da resposta
   */
  setCurrentResponseId(responseId) {
    this.currentResponseId = responseId;
  }

  /**
   * Envia feedback sobre uma resposta
   * @param {string} feedbackType Tipo de feedback (hallucination, incorrect_content, other_issues)
   * @param {string} details Detalhes do feedback
   * @param {string} problematicContent Conteúdo problemático
   * @param {string} suggestedCorrection Correção sugerida
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendFeedback(feedbackType, details, problematicContent = '', suggestedCorrection = '') {
    try {
      const feedbackData = {
        sessionId: this.sessionId,
        responseId: this.currentResponseId,
        feedbackType,
        details,
        problematicContent,
        suggestedCorrection,
        userAgent: navigator.userAgent
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar feedback: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      
      // Armazena o feedback localmente se falhar o envio
      this._storeFeedbackLocally(feedbackType, details, problematicContent, suggestedCorrection);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Armazena feedback localmente se falhar o envio para o servidor
   * @param {string} feedbackType Tipo de feedback
   * @param {string} details Detalhes do feedback
   * @param {string} problematicContent Conteúdo problemático
   * @param {string} suggestedCorrection Correção sugerida
   * @private
   */
  _storeFeedbackLocally(feedbackType, details, problematicContent, suggestedCorrection) {
    try {
      const storedFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
      
      storedFeedback.push({
        sessionId: this.sessionId,
        responseId: this.currentResponseId,
        feedbackType,
        details,
        problematicContent,
        suggestedCorrection,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      localStorage.setItem('pendingFeedback', JSON.stringify(storedFeedback));
      console.log('Feedback armazenado localmente para envio posterior');
    } catch (error) {
      console.error('Erro ao armazenar feedback localmente:', error);
    }
  }

  /**
   * Tenta reenviar feedbacks armazenados localmente
   * @returns {Promise<boolean>} Sucesso do reenvio
   */
  async retrySendingStoredFeedback() {
    try {
      const storedFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
      
      if (storedFeedback.length === 0) {
        return true;
      }
      
      let allSuccess = true;
      const failedFeedback = [];
      
      for (const feedback of storedFeedback) {
        try {
          const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
          });
          
          if (!response.ok) {
            failedFeedback.push(feedback);
            allSuccess = false;
          }
        } catch (error) {
          console.error('Erro ao reenviar feedback armazenado:', error);
          failedFeedback.push(feedback);
          allSuccess = false;
        }
      }
      
      // Atualiza os itens pendentes com apenas os que falharam
      localStorage.setItem('pendingFeedback', JSON.stringify(failedFeedback));
      
      return allSuccess;
    } catch (error) {
      console.error('Erro ao processar feedbacks armazenados:', error);
      return false;
    }
  }

  /**
   * Inicializa o widget de feedback na página
   * @param {string} containerId ID do elemento HTML que conterá o widget
   */
  initFeedbackWidget(containerId = 'feedback-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Elemento com ID ${containerId} não encontrado`);
      return;
    }
    
    // Criar elementos do widget
    const widget = document.createElement('div');
    widget.className = 'feedback-widget';
    widget.innerHTML = `
      <div class="feedback-trigger">
        <button id="feedback-button" class="btn btn-outline-secondary btn-sm">
          <i class="fa fa-flag"></i> Reportar problema
        </button>
      </div>
      <div id="feedback-modal" class="feedback-modal" style="display: none;">
        <div class="feedback-modal-content">
          <div class="feedback-modal-header">
            <h5>Reportar problema na análise</h5>
            <span id="feedback-close" class="feedback-close">&times;</span>
          </div>
          <div class="feedback-modal-body">
            <form id="feedback-form">
              <div class="form-group mb-3">
                <label for="feedback-type">Tipo de problema:</label>
                <select id="feedback-type" class="form-control" required>
                  <option value="">Selecione o tipo de problema</option>
                  <option value="hallucination">Informação fabricada (alucinação)</option>
                  <option value="incorrect_content">Informação incorreta</option>
                  <option value="other_issues">Outro problema</option>
                </select>
              </div>
              <div class="form-group mb-3">
                <label for="feedback-details">Descreva o problema:</label>
                <textarea id="feedback-details" class="form-control" rows="3" required placeholder="Descreva o problema encontrado..."></textarea>
              </div>
              <div class="form-group mb-3">
                <label for="feedback-content">Conteúdo problemático (opcional):</label>
                <textarea id="feedback-content" class="form-control" rows="2" placeholder="Cole aqui o texto problemático..."></textarea>
              </div>
              <div class="form-group mb-3">
                <label for="feedback-correction">Sugestão de correção (opcional):</label>
                <textarea id="feedback-correction" class="form-control" rows="2" placeholder="Sugira uma correção..."></textarea>
              </div>
              <div class="form-group text-end">
                <button type="button" id="feedback-cancel" class="btn btn-secondary">Cancelar</button>
                <button type="submit" id="feedback-submit" class="btn btn-primary">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(widget);
    
    // Adicionar estilos do widget
    const styles = document.createElement('style');
    styles.textContent = `
      .feedback-widget {
        position: relative;
      }
      
      .feedback-trigger {
        margin: 10px 0;
      }
      
      .feedback-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .feedback-modal-content {
        background-color: #fff;
        border-radius: 5px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      .feedback-modal-header {
        padding: 15px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .feedback-close {
        font-size: 24px;
        cursor: pointer;
      }
      
      .feedback-modal-body {
        padding: 15px;
      }
      
      .feedback-success {
        background-color: #d4edda;
        color: #155724;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
      }
      
      .feedback-error {
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
      }
    `;
    
    document.head.appendChild(styles);
    
    // Adicionar event listeners
    document.getElementById('feedback-button').addEventListener('click', () => {
      document.getElementById('feedback-modal').style.display = 'flex';
    });
    
    document.getElementById('feedback-close').addEventListener('click', () => {
      document.getElementById('feedback-modal').style.display = 'none';
    });
    
    document.getElementById('feedback-cancel').addEventListener('click', () => {
      document.getElementById('feedback-modal').style.display = 'none';
    });
    
    document.getElementById('feedback-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const feedbackType = document.getElementById('feedback-type').value;
      const details = document.getElementById('feedback-details').value;
      const problematicContent = document.getElementById('feedback-content').value;
      const suggestedCorrection = document.getElementById('feedback-correction').value;
      
      const submitButton = document.getElementById('feedback-submit');
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
      
      try {
        const result = await this.sendFeedback(
          feedbackType,
          details,
          problematicContent,
          suggestedCorrection
        );
        
        // Remover qualquer mensagem anterior
        const previousMessages = document.querySelectorAll('.feedback-success, .feedback-error');
        previousMessages.forEach(msg => msg.remove());
        
        // Adicionar mensagem de sucesso ou erro
        const messageDiv = document.createElement('div');
        if (result.success !== false) {
          messageDiv.className = 'feedback-success';
          messageDiv.textContent = 'Feedback enviado com sucesso! Obrigado pela sua contribuição.';
          
          // Limpar o formulário
          document.getElementById('feedback-type').value = '';
          document.getElementById('feedback-details').value = '';
          document.getElementById('feedback-content').value = '';
          document.getElementById('feedback-correction').value = '';
          
          // Fechar o modal após 2 segundos
          setTimeout(() => {
            document.getElementById('feedback-modal').style.display = 'none';
          }, 2000);
        } else {
          messageDiv.className = 'feedback-error';
          messageDiv.textContent = `Erro ao enviar feedback: ${result.error || 'Erro desconhecido'}. Seu feedback foi salvo localmente e será enviado automaticamente quando possível.`;
        }
        
        document.querySelector('.feedback-modal-body').insertBefore(
          messageDiv,
          document.getElementById('feedback-form')
        );
      } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'feedback-error';
        messageDiv.textContent = `Erro ao enviar feedback: ${error.message}. Seu feedback foi salvo localmente e será enviado automaticamente quando possível.`;
        
        document.querySelector('.feedback-modal-body').insertBefore(
          messageDiv,
          document.getElementById('feedback-form')
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar';
      }
    });
    
    // Tentar reenviar feedbacks armazenados localmente
    this.retrySendingStoredFeedback();
  }
}

// Exportar a classe para uso global
window.FeedbackSystem = FeedbackSystem;
