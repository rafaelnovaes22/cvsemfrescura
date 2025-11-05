/**
 * Utilitário de sanitização para prevenir XSS
 */

const Sanitizer = {
    /**
     * Escapa caracteres HTML perigosos
     * @param {string} str - String a ser sanitizada
     * @returns {string} String sanitizada
     */
    escapeHtml(str) {
        if (!str) return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitiza HTML permitindo apenas tags seguras
     * @param {string} html - HTML a ser sanitizado
     * @param {Array} allowedTags - Tags permitidas (padrão: tags de formatação básica)
     * @returns {string} HTML sanitizado
     */
    sanitizeHtml(html, allowedTags = ['b', 'i', 'em', 'strong', 'span', 'br', 'p']) {
        if (!html) return '';

        // Criar um elemento temporário
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Função recursiva para limpar elementos
        const cleanElement = (element) => {
            const children = Array.from(element.children);

            children.forEach(child => {
                // Se a tag não é permitida, substituir pelo conteúdo de texto
                if (!allowedTags.includes(child.tagName.toLowerCase())) {
                    const textNode = document.createTextNode(child.textContent);
                    child.parentNode.replaceChild(textNode, child);
                } else {
                    // Remover todos os atributos exceto class e style limitados
                    const attributes = Array.from(child.attributes);
                    attributes.forEach(attr => {
                        if (attr.name === 'class') {
                            // Permitir classes específicas para diferentes elementos
                            const allowedClasses = [
                                'highlight', 'keyword', 'badge',
                                'view-analysis-btn', 'analysis-date', 'job-count-badge',
                                'analysis-table', 'transaction-table',
                                'error-state', 'loading', 'empty-state',
                                'status-completed', 'status-failed', 'status-refunded'
                            ];
                            const classes = attr.value.split(' ').filter(cls => allowedClasses.includes(cls));
                            if (classes.length > 0) {
                                child.setAttribute('class', classes.join(' '));
                            } else {
                                child.removeAttribute('class');
                            }
                        } else if (attr.name === 'style') {
                            // Permitir apenas estilos seguros
                            const safeStyles = this.sanitizeStyles(attr.value);
                            if (safeStyles) {
                                child.setAttribute('style', safeStyles);
                            } else {
                                child.removeAttribute('style');
                            }
                        } else if (attr.name.startsWith('data-') && child.tagName.toLowerCase() === 'button') {
                            // Permitir atributos data-* APENAS em botões para funcionalidade
                            // Manter o atributo data-*
                        } else if (attr.name === 'title') {
                            // Permitir atributo title para tooltips
                            // Manter o atributo title
                        } else {
                            // Remover outros atributos
                            child.removeAttribute(attr.name);
                        }
                    });

                    // Limpar elementos filhos recursivamente
                    cleanElement(child);
                }
            });
        };

        cleanElement(temp);
        return temp.innerHTML;
    },

    /**
     * Sanitiza estilos CSS
     * @param {string} styles - String de estilos CSS
     * @returns {string} Estilos sanitizados
     */
    sanitizeStyles(styles) {
        if (!styles) return '';

        const allowedProperties = [
            'color', 'background-color', 'font-size', 'font-weight',
            'text-align', 'padding', 'margin', 'border-radius'
        ];

        const styleObj = {};
        styles.split(';').forEach(style => {
            const [prop, value] = style.split(':').map(s => s.trim());
            if (prop && value && allowedProperties.includes(prop)) {
                // Validar valores para prevenir injeção
                if (!value.includes('javascript:') && !value.includes('expression(')) {
                    styleObj[prop] = value;
                }
            }
        });

        return Object.entries(styleObj)
            .map(([prop, value]) => `${prop}: ${value}`)
            .join('; ');
    },

    /**
     * Cria elemento DOM seguro com conteúdo sanitizado
     * @param {string} tag - Nome da tag
     * @param {string} content - Conteúdo (será escapado)
     * @param {Object} attributes - Atributos seguros
     * @returns {HTMLElement} Elemento DOM
     */
    createElement(tag, content = '', attributes = {}) {
        const element = document.createElement(tag);

        if (content) {
            element.textContent = content; // textContent é seguro contra XSS
        }

        // Adicionar apenas atributos seguros
        const safeAttributes = ['class', 'id', 'data-id', 'data-value'];
        Object.entries(attributes).forEach(([key, value]) => {
            if (safeAttributes.includes(key)) {
                element.setAttribute(key, String(value));
            }
        });

        return element;
    }
};

// Exportar para uso global
window.Sanitizer = Sanitizer;

// Se estiver usando módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sanitizer;
}