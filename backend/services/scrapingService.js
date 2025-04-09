const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrai texto de forma segura de um seletor Cheerio, tratando casos nulos/vazios.
 * @param {Function} $ - A instância do Cheerio carregada.
 * @param {cheerio.Cheerio<cheerio.Element>} $element - O elemento Cheerio.
 * @param {number} [maxLength=15000] - Comprimento máximo da string.
 * @returns {string} Texto extraído e limpo, ou string vazia.
 */
function safeExtractText($, $element, maxLength = 15000) {
    if ($element && $element.length > 0) {
        // Tentar obter texto de múltiplos elementos se necessário e concatenar
        let text = '';
        $element.each((i, el) => {
            text += $(el).text() + '\n'; // Adiciona nova linha entre elementos
        });
        return text.trim().replace(/\s+/g, ' ').substring(0, maxLength);
    }
    return '';
}

/**
 * Tenta buscar e extrair detalhes de uma vaga de uma URL.
 * Inclui lógica específica para páginas da Gupy.
 * @param {string} url - A URL da página da vaga.
 * @returns {Promise<{title: string|null, company: string|null, description: string|null, url: string}>} Detalhes extraídos ou dados indicando falha.
 */
async function scrapeJobDetails(url) {
    console.log(`[Scraping Service] Tentando buscar detalhes da vaga em: ${url}`);
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const { data: html } = await axios.get(url, { headers, timeout: 15000 }); // Aumenta timeout para 15s
        const $ = cheerio.load(html);

        let title, company, description;
        const isGupy = url.includes('.gupy.io');

        if (isGupy) {
            console.log(`[Scraping Service] Detectada página Gupy. Usando seletores específicos.`);
            // Seletores Gupy (podem precisar de ajuste fino)
            title = safeExtractText($, $('h1[data-testid="job-title"], header h1, h1').first());
            company = safeExtractText($, $('a[data-testid="header-company-name-link"] span, header a > span').first());

            // Se não encontrou empresa no header, tenta extrair do subdomínio
            if (!company) {
                try {
                    const urlParts = new URL(url);
                    const hostnameParts = urlParts.hostname.split('.');
                    if (hostnameParts.length >= 3 && hostnameParts[1] === 'gupy' && hostnameParts[2] === 'io') {
                        // Capitaliza a primeira letra e remove traços/números se necessário
                        company = hostnameParts[0].replace(/-/g, ' ').replace(/\d+/g, '');
                        company = company.charAt(0).toUpperCase() + company.slice(1);
                        // Remove termos comuns como 'vemprotime' ou 'vemser' se forem prefixos
                        company = company.replace(/^(vemprotime|vemser)\s*/i, '').trim();
                    }
                } catch (e) {
                    console.warn(`[Scraping Service] Não foi possível extrair empresa do subdomínio Gupy: ${e.message}`);
                }
            }

            // Concatena seções relevantes da descrição Gupy
            let descParts = [];
            // Busca seções por ID ou texto do título (h2/h3) e pega o conteúdo seguinte
            $('h2, h3').each((i, header) => {
                const headerText = $(header).text().trim().toLowerCase();
                // Lista de títulos de seção relevantes
                const relevantSections = [
                    'responsabilidades e atribuições',
                    'requisitos e qualificações'
                    // Adicionar outros títulos se necessário
                ];
                if (relevantSections.includes(headerText)) {
                    // Pega todo o texto até o próximo h2/h3 ou fim do container principal
                    let content = '';
                    let nextElement = $(header).next();
                    while (nextElement.length && !nextElement.is('h2, h3')) {
                        // Evita pegar texto de botões ou elementos interativos dentro da descrição
                        if (!nextElement.is('button, a[href*="apply"], script, style')) {
                            content += nextElement.text() + '\n';
                        }
                        nextElement = nextElement.next();
                    }
                    if (content) {
                        descParts.push(content.trim());
                    }
                }
            });
            // Se a busca por títulos falhar, tenta pegar um container geral
            if (descParts.length === 0) {
                descParts.push(safeExtractText($, $('section[aria-label*="descrição da vaga"], #job-description, .job-description-section, [data-testid="job-description"]')));
            }

            description = descParts.join('\n\n---\n\n'); // Junta as partes com separador

        } else {
            console.log(`[Scraping Service] Página não Gupy. Usando seletores genéricos.`);
            // --- Fallback para seletores genéricos (lógica anterior) ---
            title =
                safeExtractText($, $('meta[property="og:title"]').first()) ||
                safeExtractText($, $('title').first()) ||
                safeExtractText($, $('h1').first());

            company =
                safeExtractText($, $('meta[property="og:site_name"]').first()) ||
                safeExtractText($, $('.employer-name, .company-name, [class*="company"]').first()) || // Classes comuns
                safeExtractText($, $('a[href*="/company/"], a[href*="/employer/"]').first()); // Links comuns

            description =
                safeExtractText($, $('.job-details, .job-description, #job-details, #jobDescription, [class*="description"], [id*="description"], article').first()); // Seletores genéricos amplos
        }

        // Limpeza final e validação
        title = title || 'Título não encontrado';
        company = company || 'Empresa não encontrada';
        description = description || 'Descrição não encontrada';

        if (description.length < 50 || description === 'Descrição não encontrada') { // Limite um pouco menor
            console.warn(`[Scraping Service] Descrição final não encontrada ou muito curta para: ${url}. Descrição: ${description.substring(0, 100)}...`);
            // Retornar o que foi encontrado mesmo assim, mas marcar como potencialmente incompleto?
            // Poderíamos adicionar um flag no objeto retornado
        } else {
            console.log(`[Scraping Service] Detalhes extraídos com sucesso para: ${url}`);
        }

        return {
            title,
            company,
            description,
            url
        };

    } catch (error) {
        console.error(`[Scraping Service] Erro ao processar URL ${url}:`, error.message);
        // Retorna um objeto indicando a falha, mas mantendo a URL
        return {
            title: 'Erro ao buscar vaga',
            company: 'N/A',
            description: `Falha ao buscar conteúdo da URL: ${error.message}`,
            url
        };
    }
}

module.exports = { scrapeJobDetails }; 