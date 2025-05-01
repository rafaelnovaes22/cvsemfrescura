const axios = require('axios');
const cheerio = require('cheerio');

const SECTION_TITLES = [
  'atribuições', 'responsabilidades', 'atividades', 'requisitos',
  'qualificações', 'perfil', 'o que esperamos', 'o que buscamos',
  'responsibility', 'requirement', 'qualification', 'activities', 'profile'
];

function isRelevantTitle(text) {
  return SECTION_TITLES.some(title =>
    text.toLowerCase().includes(title)
  );
}

exports.extractRelevantSections = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let result = [];
    let foundSection = false;

    $('h1, h2, h3, h4, b, strong').each((_, elem) => {
      const title = $(elem).text();
      if (isRelevantTitle(title)) {
        foundSection = true;
        let sectionText = '';
        let next = $(elem).next();
        let count = 0;
        // Captura listas, parágrafos e divs após o título
        while (next.length && !/h1|h2|h3|h4|b|strong/i.test(next[0].tagName) && count < 20) {
          if (['ul', 'ol'].includes(next[0].tagName)) {
            sectionText += next.text() + ' ';
          } else if (['p', 'div', 'span', 'li'].includes(next[0].tagName)) {
            sectionText += next.text() + ' ';
          }
          next = next.next();
          count++;
        }
        result.push(`${title}: ${sectionText.trim()}`);
      }
    });
    // Fallback: se não encontrou nenhuma seção, retorna todo o texto visível do body
    if (!foundSection) {
      result.push($('body').text().replace(/\s+/g, ' ').trim());
    }
    return result.join('\n\n');
  } catch (e) {
    return '';
  }
};
