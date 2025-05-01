// results.js - Integração frontend ATS para CV Sem Frescura
// Este script busca os dados de análise na sessionStorage e popula a página de resultados
// Se não houver dados na sessionStorage, pode buscar da API futuramente

document.addEventListener('DOMContentLoaded', function() {
    let atsResult = null;
    try {
        atsResult = JSON.parse(sessionStorage.getItem('atsResult'));
    } catch (e) {
        atsResult = null;
    }

    if (!atsResult) {
        document.getElementById('conclusion').innerText = 'Nenhum resultado de análise encontrado.';
        return;
    }

    // Nome do arquivo de currículo
    const cvFileName = sessionStorage.getItem('fileName');
    if (cvFileName) {
        const cvFileNameDiv = document.getElementById('cv-filename');
        if (cvFileNameDiv) cvFileNameDiv.textContent = cvFileName;
    }

    // Palavras-chave das vagas
    const jobKeywordsList = document.getElementById('vaga-keywords');
    if (jobKeywordsList && atsResult.job_keywords) {
        jobKeywordsList.innerHTML = '';
        atsResult.job_keywords.forEach(keyword => {
            const div = document.createElement('div');
            div.className = 'keyword-tag';
            div.innerText = keyword;
            jobKeywordsList.appendChild(div);
        });
    }

    // Palavras-chave presentes no currículo (comparação direta com texto do currículo)
    const foundKeywordsList = document.getElementById('presentes-keywords');
    // Exibir diretamente job_keywords_present ou fallback para found_keywords
    if (foundKeywordsList) {
        foundKeywordsList.innerHTML = '';
        const presentes = atsResult.job_keywords_present && atsResult.job_keywords_present.length
            ? atsResult.job_keywords_present
            : (atsResult.found_keywords && atsResult.found_keywords.length ? atsResult.found_keywords : []);
        if (presentes.length) {
            presentes.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerText = keyword;
                foundKeywordsList.appendChild(div);
            });
        } else {
            foundKeywordsList.innerHTML = '<div style="color:red">Nenhuma palavra-chave da vaga foi identificada no currículo ou resultado não disponível.</div>';
        }
    }


    // Palavras-chave ausentes no currículo (comparação direta com texto do currículo)
    const missingKeywordsList = document.getElementById('ausentes-keywords');
    // Exibir diretamente job_keywords_missing ou fallback para missing_keywords
    if (missingKeywordsList) {
        missingKeywordsList.innerHTML = '';
        const ausentes = atsResult.job_keywords_missing && atsResult.job_keywords_missing.length
            ? atsResult.job_keywords_missing
            : (atsResult.missing_keywords && atsResult.missing_keywords.length ? atsResult.missing_keywords : []);
        if (ausentes.length) {
            ausentes.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerText = keyword;
                missingKeywordsList.appendChild(div);
            });
        } else {
            missingKeywordsList.innerHTML = '<div style="color:red">Nenhuma palavra-chave ausente identificada ou resultado não disponível.</div>';
        }
    }


    // Recomendações
    const recommendationsList = document.getElementById('recommendations-list');
    if (recommendationsList && atsResult.recommendations) {
        recommendationsList.innerHTML = '';
        atsResult.recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.innerText = rec;
            recommendationsList.appendChild(li);
        });
    }

    // Campos de avaliação detalhada
    const campos = [
        { chave: 'resumo', nota: 'nota-resumo', texto: 'texto-resumo' },
        { chave: 'idiomas', nota: 'nota-idiomas', texto: 'texto-idiomas' },
        { chave: 'formacao', nota: 'nota-formacao', texto: 'texto-formacao' },
        { chave: 'habilidades', nota: 'nota-habilidades', texto: 'texto-habilidades' },
        { chave: 'informacoes_pessoais', nota: 'nota-pessoais', texto: 'texto-pessoais' },
        { chave: 'experiencia_profissional', nota: 'nota-experiencia', texto: 'texto-experiencia' }
    ];
    campos.forEach(campo => {
        const avaliacao = atsResult[campo.chave];
        if (avaliacao) {
            // Nota
            const notaElem = document.getElementById(campo.nota);
            if (notaElem) notaElem.textContent = avaliacao.nota !== undefined ? avaliacao.nota : '-';
            // Texto de avaliação + sugestões
            const textoElem = document.getElementById(campo.texto);
            if (textoElem) {
                let html = '';
                if (avaliacao.avaliacao) html += avaliacao.avaliacao + '<br>';
                if (avaliacao.sugestoes && Array.isArray(avaliacao.sugestoes) && avaliacao.sugestoes.length) {
                    html += '<ul>' + avaliacao.sugestoes.map(s => `<li>${s}</li>`).join('') + '</ul>';
                } else if (avaliacao.sugestoes) {
                    html += `<div>${avaliacao.sugestoes}</div>`;
                }
                textoElem.innerHTML = html;
            }
        }
    });

    // Conclusão
    const conclusion = document.getElementById('conclusion');
    if (conclusion && atsResult.conclusion) {
        conclusion.innerText = atsResult.conclusion;
    }
});
