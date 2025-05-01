const relevantScraper = require('./relevantJobScraper');

exports.extractMultiple = async (links) => {
  const texts = [];
  for (const url of links) {
    try {
      const relevant = await relevantScraper.extractRelevantSections(url);
      texts.push(relevant);
    } catch (e) {
      texts.push('');
    }
  }
  return texts.join('\n---\n');
};
