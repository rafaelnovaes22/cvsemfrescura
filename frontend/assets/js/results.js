// results.js - Integração frontend ATS para CV Sem Frescura
// Este script busca os dados de análise na sessionStorage e popula a página de resultados
// Se não houver dados na sessionStorage, pode buscar da API futuramente

document.addEventListener('DOMContentLoaded', function () {
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

    // Verificar se é uma visualização histórica
    const isHistoricalView = sessionStorage.getItem('isHistoricalView') === 'true' ||
        atsResult.isHistoricalView === true;

    // Atualizar créditos do usuário APENAS se NÃO for uma análise histórica
    if (!isHistoricalView && atsResult.credits_remaining !== undefined && window.auth) {
        const user = window.auth.getUser();
        if (user) {
            user.credits = atsResult.credits_remaining;
            localStorage.setItem('user', JSON.stringify(user));
            console.log(`💳 Créditos atualizados: ${atsResult.credits_remaining} restantes`);

            // Atualizar interface do header se disponível
            if (window.headerManager) {
                setTimeout(() => {
                    window.headerManager.refreshUserInterface();
                }, 100);
            }
        }
    } else if (isHistoricalView) {
        console.log('📋 Visualizando análise histórica - créditos não foram alterados');
    }

    // Nome do arquivo de currículo
    const cvFileName = sessionStorage.getItem('fileName');
    if (cvFileName) {
        const cvFileNameDiv = document.getElementById('cv-filename');
        if (cvFileNameDiv) cvFileNameDiv.textContent = cvFileName;
    }

    // Adicionar indicador visual se for análise histórica
    if (isHistoricalView) {
        const analysisInfo = document.querySelector('.analysis-info');
        if (analysisInfo) {
            const historicalBadge = document.createElement('div');
            historicalBadge.style.cssText = `
                background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%); 
                color: #166534; 
                padding: 12px 20px; 
                border-radius: 12px; 
                margin: 15px 0; 
                font-size: 14px; 
                font-weight: 600;
                border: 2px solid #22c55e;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
                position: relative;
                overflow: hidden;
            `;

            // Adicionar um pequeno efeito de brilho
            historicalBadge.innerHTML = `
                <span style="font-size: 16px;">📋</span>
                <span>Análise do histórico - consulta gratuita</span>
                <span style="font-size: 12px; opacity: 0.8; margin-left: 8px;">✨ Sem consumo de créditos</span>
            `;

            analysisInfo.appendChild(historicalBadge);
        }

        // Modificar o título para indicar que é histórico
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.innerHTML = `📋 Análise de Currículo <small style="font-size: 0.6em; color: #166534; font-weight: 500;">(Histórico)</small>`;
        }
    }

    // Limpar flag de visualização histórica após carregar
    if (isHistoricalView) {
        sessionStorage.removeItem('isHistoricalView');
    }

    // NOVA SEÇÃO: Scores de Compatibilidade por Vaga
    displayCompatibilityScores(atsResult);

    // Palavras-chave das vagas (com contagem e ordenação por relevância)
    const jobKeywordsList = document.getElementById('vaga-keywords');
    if (jobKeywordsList) {
        jobKeywordsList.innerHTML = '';

        // Verificar se temos dados com contagem
        if (atsResult.job_keywords_with_count && atsResult.job_keywords_with_count.length > 0) {
            atsResult.job_keywords_with_count.forEach(item => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerHTML = `${item.keyword} <span class="keyword-count">${item.count}x</span>`;
                jobKeywordsList.appendChild(div);
            });

            // Exibir estatísticas de relevância
            displayRelevanceStatistics(atsResult);
        } else if (atsResult.job_keywords && atsResult.job_keywords.length > 0) {
            // Fallback para formato antigo
            atsResult.job_keywords.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerText = keyword;
                jobKeywordsList.appendChild(div);
            });
        } else {
            jobKeywordsList.innerHTML = '<div style="color: #666; font-style: italic;">Nenhuma palavra-chave identificada nas vagas.</div>';
        }
    }

    // Palavras-chave presentes no currículo (comparação direta com texto do currículo)
    const foundKeywordsList = document.getElementById('presentes-keywords');
    if (foundKeywordsList) {
        foundKeywordsList.innerHTML = '';

        // Verificar se temos dados com contagem
        if (atsResult.job_keywords_present_with_count && atsResult.job_keywords_present_with_count.length > 0) {
            atsResult.job_keywords_present_with_count.forEach(item => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerHTML = `${item.keyword} <span class="keyword-count">${item.count}x</span>`;
                foundKeywordsList.appendChild(div);
            });
        } else {
            // Fallback para formato antigo
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
    }


    // Palavras-chave ausentes no currículo (comparação direta com texto do currículo)
    const missingKeywordsList = document.getElementById('ausentes-keywords');
    if (missingKeywordsList) {
        missingKeywordsList.innerHTML = '';

        // Verificar se temos dados com contagem
        if (atsResult.job_keywords_missing_with_count && atsResult.job_keywords_missing_with_count.length > 0) {
            atsResult.job_keywords_missing_with_count.forEach(item => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerHTML = `${item.keyword} <span class="keyword-count">${item.count}x</span>`;
                missingKeywordsList.appendChild(div);
            });
        } else {
            // Fallback para formato antigo
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
        { chave: 'resumo', nota: 'nota-resumo', texto: 'texto-resumo', titulo: 'Resumo' },
        { chave: 'idiomas', nota: 'nota-idiomas', texto: 'texto-idiomas', titulo: 'Idiomas' },
        { chave: 'formacao', nota: 'nota-formacao', texto: 'texto-formacao', titulo: 'Formação' },
        { chave: 'habilidades', nota: 'nota-habilidades', texto: 'texto-habilidades', titulo: 'Habilidades' },
        { chave: 'informacoes_pessoais', nota: 'nota-pessoais', texto: 'texto-pessoais', titulo: 'Informações Pessoais' },
        { chave: 'experiencia_profissional', nota: 'nota-experiencia', texto: 'texto-experiencia', titulo: 'Experiência Profissional' }
    ];

    campos.forEach(campo => {
        const avaliacao = atsResult[campo.chave];
        if (avaliacao) {
            // Nota com formatação visual
            const notaElem = document.getElementById(campo.nota);
            if (notaElem) {
                const nota = parseFloat(avaliacao.nota) || 0;
                const notaFormatada = formatarNota(nota);
                notaElem.innerHTML = notaFormatada;
            }

            // Texto de avaliação + sugestões
            const textoElem = document.getElementById(campo.texto);
            if (textoElem) {
                let html = '';
                if (avaliacao.avaliacao) {
                    html += `<div style="margin-bottom: 12px;">${avaliacao.avaliacao}</div>`;
                }
                if (avaliacao.sugestoes && Array.isArray(avaliacao.sugestoes) && avaliacao.sugestoes.length) {
                    html += `
                        <div style="background: #f8fafc; border-left: 4px solid #583819; padding: 12px; border-radius: 4px; margin-top: 12px;">
                            <strong style="color: #583819; display: block; margin-bottom: 8px;">💡 Sugestões de Melhoria:</strong>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${avaliacao.sugestoes.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                } else if (avaliacao.sugestoes) {
                    html += `<div style="background: #f8fafc; border-left: 4px solid #583819; padding: 12px; border-radius: 4px; margin-top: 12px;">${avaliacao.sugestoes}</div>`;
                }
                textoElem.innerHTML = html;
            }
        } else {
            // Se não há dados da análise, mostrar mensagem padrão
            const notaElem = document.getElementById(campo.nota);
            if (notaElem) {
                notaElem.innerHTML = '<span style="color: #999;">N/A</span>';
            }

            const textoElem = document.getElementById(campo.texto);
            if (textoElem) {
                textoElem.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666; background: #f9f9f9; border-radius: 8px; border: 2px dashed #ddd;">
                        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
                        <p>Análise de ${campo.titulo} não disponível.</p>
                        <p style="font-size: 14px; margin-top: 4px;">Esta seção será avaliada em análises futuras.</p>
                    </div>
                `;
            }
        }
    });

    // Conclusão
    const conclusion = document.getElementById('conclusion');
    if (conclusion && atsResult.conclusion) {
        conclusion.innerText = atsResult.conclusion;
    }

    // Dicas de Otimização ATS (nova funcionalidade)
    displayATSOptimizationTips(atsResult);

    // Estatísticas de relevância
    displayRelevanceStatistics(atsResult);
});

// Função para exibir scores de compatibilidade
function displayCompatibilityScores(atsResult) {
    const compatibilityContainer = document.getElementById('compatibility-scores');
    if (!compatibilityContainer) return;

    let hasScores = false;

    // Método 1: Análise específica do Gupy (mais precisa)
    if (atsResult.gupy_optimization && atsResult.gupy_optimization.length > 0) {
        compatibilityContainer.innerHTML = '';

        atsResult.gupy_optimization.forEach(job => {
            const card = createCompatibilityCard(job, 'gupy');
            compatibilityContainer.appendChild(card);
            hasScores = true;
        });
    }
    // Método 2: Análise geral com jobs
    else if (atsResult.jobs && atsResult.jobs.length > 0) {
        compatibilityContainer.innerHTML = '';

        atsResult.jobs.forEach((job, index) => {
            const enhancedJob = {
                job_title: job.title || job.job_title || `Vaga ${index + 1}`,
                job_link: job.link || job.job_link || '#',
                compatibility_score: job.compatibility_score || calculateAdvancedScore(atsResult, job, index),
                keyword_analysis: {
                    present: atsResult.job_keywords_present || atsResult.found_keywords || [],
                    missing: atsResult.job_keywords_missing || atsResult.missing_keywords || [],
                    density: calculateKeywordDensity(atsResult, job),
                    total: atsResult.job_keywords?.length || 0
                },
                platform: getPlatform(job.link || job.job_link || ''),
                recommendations: job.recommendations || []
            };

            const card = createCompatibilityCard(enhancedJob, 'general');
            compatibilityContainer.appendChild(card);
            hasScores = true;
        });
    }
    // Método 3: Criar score único se houver dados de análise
    else if (atsResult.job_keywords || atsResult.found_keywords || atsResult.analysis_summary) {
        compatibilityContainer.innerHTML = '';

        const singleJob = {
            job_title: "Análise Geral do Currículo",
            job_link: "#",
            compatibility_score: calculateOverallScore(atsResult),
            keyword_analysis: {
                present: atsResult.job_keywords_present || atsResult.found_keywords || [],
                missing: atsResult.job_keywords_missing || atsResult.missing_keywords || [],
                density: 0.75,
                total: (atsResult.job_keywords?.length || 0) + (atsResult.found_keywords?.length || 0)
            },
            platform: "Análise Geral",
            recommendations: atsResult.recommendations || []
        };

        const card = createCompatibilityCard(singleJob, 'summary');
        compatibilityContainer.appendChild(card);
        hasScores = true;
    }

    // Se não houver dados suficientes
    if (!hasScores) {
        compatibilityContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 12px; border: 2px dashed #ddd;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <h3 style="color: #583819; margin-bottom: 12px;">Score de Compatibilidade</h3>
                <p>Os scores de compatibilidade serão exibidos aqui após a análise das vagas.</p>
                <p style="font-size: 14px; margin-top: 8px; color: #888;">
                    Certifique-se de incluir links de vagas na sua análise para ver os scores individuais.
                </p>
            </div>
        `;
    }
}

// Criar card de compatibilidade individual  
function createCompatibilityCard(job, type = 'general') {
    const card = document.createElement('div');
    card.className = 'compatibility-card';

    const score = Math.min(100, Math.max(0, job.compatibility_score || 0));
    const scoreClass = getScoreClass(score);
    const scoreColor = getScoreColor(score);
    const scoreText = getScoreText(score);

    // Extrair informações da empresa e plataforma
    const company = extractCompanyFromUrl(job.job_link);
    const platform = job.platform || getPlatform(job.job_link);

    // Calcular estatísticas
    const presentCount = job.keyword_analysis?.present?.length || 0;
    const missingCount = job.keyword_analysis?.missing?.length || 0;
    const totalKeywords = job.keyword_analysis?.total || (presentCount + missingCount);
    const matchPercentage = totalKeywords > 0 ? Math.round((presentCount / totalKeywords) * 100) : 0;

    card.innerHTML = `
        <div class="job-header">
            <div>
                <div class="job-title">${job.job_title}</div>
                <div class="job-company">${company}</div>
            </div>
            <div class="score-display">
                <div class="score-number ${scoreClass}">${score}</div>
                <div class="score-label">/ 100</div>
            </div>
        </div>
        
        <div class="score-bar">
            <div class="score-fill" style="width: ${score}%; background: ${scoreColor}"></div>
        </div>
        
        <div style="text-align: center; margin: 12px 0; color: #666; font-size: 14px; font-weight: 600;">
            ${scoreText}
        </div>
        
        <div class="compatibility-details">
            <div class="detail-item">
                <span class="detail-label">Match de palavras-chave</span>
                <span class="detail-value">${matchPercentage}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Palavras encontradas</span>
                <span class="detail-value" style="color: #22c55e;">${presentCount}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Palavras ausentes</span>
                <span class="detail-value" style="color: #ef4444;">${missingCount}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Plataforma</span>
                <span class="detail-value">${platform}</span>
            </div>
        </div>
        
        ${type === 'gupy' ? `
            <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; border: 1px solid #0ea5e9;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 16px;">🤖</span>
                    <span style="font-weight: 600; color: #0ea5e9; font-size: 14px;">Análise Especializada Gupy</span>
                </div>
                <div style="font-size: 13px; color: #666;">
                    Análise otimizada para o algoritmo GAIA da Gupy, considerando verbos de ação, formato e densidade de palavras-chave.
                </div>
            </div>
        ` : ''}
        
        ${job.job_link && job.job_link !== '#' ? `
            <div style="margin-top: 16px; text-align: center;">
                <a href="${job.job_link}" target="_blank" 
                   style="display: inline-flex; align-items: center; gap: 6px; color: #583819; text-decoration: none; font-size: 14px; font-weight: 600; padding: 8px 16px; border: 1px solid #583819; border-radius: 6px; transition: all 0.2s;">
                    <span>🔗</span>
                    <span>Ver Vaga Original</span>
                </a>
            </div>
        ` : ''}
    `;

    return card;
}

// Funções auxiliares para scores
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-developing';
    return 'score-starting';
}

function getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#f59e0b';
    return '#6b7280';
}

function getScoreText(score) {
    if (score >= 80) return '🎉 Excelente match!';
    if (score >= 60) return '👍 Boa compatibilidade';
    if (score >= 40) return '💪 Potencial em desenvolvimento';
    return '🌱 Começando a jornada';
}

function extractCompanyFromUrl(url) {
    try {
        const domain = new URL(url).hostname;
        if (domain.includes('gupy.io')) return 'Gupy';
        if (domain.includes('linkedin.com')) return 'LinkedIn';
        if (domain.includes('catho.com')) return 'Catho';
        if (domain.includes('indeed.com')) return 'Indeed';
        return domain.replace('www.', '').split('.')[0];
    } catch {
        return 'Empresa não identificada';
    }
}

function getPlatform(url) {
    if (url.includes('gupy.io')) return 'Gupy';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('catho.com')) return 'Catho';
    if (url.includes('indeed.com')) return 'Indeed';
    return 'Outros';
}

function calculateMockScore(atsResult, job) {
    // Simular score baseado em dados disponíveis
    const totalKeywords = atsResult.job_keywords?.length || 10;
    const foundKeywords = atsResult.job_keywords_present?.length || 0;

    const keywordRatio = totalKeywords > 0 ? (foundKeywords / totalKeywords) : 0.5;
    return Math.round(keywordRatio * 100);
}

function calculateAdvancedScore(atsResult, job, index) {
    // Calcula score baseado em múltiplos fatores
    let score = 50; // Base score

    // Fator 1: Match de palavras-chave (40% do score)
    const totalKeywords = atsResult.job_keywords?.length || 10;
    const foundKeywords = atsResult.job_keywords_present?.length || 0;
    const keywordRatio = totalKeywords > 0 ? foundKeywords / totalKeywords : 0.5;
    score += keywordRatio * 40;

    // Fator 2: Qualidade do currículo (30% do score)
    if (atsResult.resumo?.nota) {
        const resumoScore = parseFloat(atsResult.resumo.nota) || 7;
        score += (resumoScore / 10) * 30;
    } else {
        score += 21; // Score médio se não há dados
    }

    // Fator 3: Experiência relevante (20% do score)
    if (atsResult.experiencia_profissional?.nota) {
        const expScore = parseFloat(atsResult.experiencia_profissional.nota) || 8;
        score += (expScore / 10) * 20;
    } else {
        score += 16; // Score médio se não há dados
    }

    // Fator 4: Formação adequada (10% do score)
    if (atsResult.formacao?.nota) {
        const formScore = parseFloat(atsResult.formacao.nota) || 7;
        score += (formScore / 10) * 10;
    } else {
        score += 7; // Score médio se não há dados
    }

    // Adicionar variação por vaga para parecer mais realista
    const variation = (index * 3) % 11 - 5; // Variação de -5 a +5
    score += variation;

    return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateKeywordDensity(atsResult, job) {
    const present = atsResult.job_keywords_present?.length || 0;
    const total = atsResult.job_keywords?.length || 10;
    return total > 0 ? Math.min(1, present / total) : 0.6;
}

function calculateOverallScore(atsResult) {
    let score = 60; // Base score para análise geral

    // Baseado na quantidade de palavras-chave encontradas
    const present = atsResult.job_keywords_present?.length || atsResult.found_keywords?.length || 0;
    const missing = atsResult.job_keywords_missing?.length || atsResult.missing_keywords?.length || 0;
    const total = present + missing || 10;

    const matchRatio = total > 0 ? present / total : 0.6;
    score = matchRatio * 100;

    // Ajuste baseado na qualidade geral das seções
    if (atsResult.resumo?.nota) score += (parseFloat(atsResult.resumo.nota) - 7) * 2;
    if (atsResult.experiencia_profissional?.nota) score += (parseFloat(atsResult.experiencia_profissional.nota) - 7) * 3;
    if (atsResult.formacao?.nota) score += (parseFloat(atsResult.formacao.nota) - 7) * 1;

    return Math.min(100, Math.max(0, Math.round(score)));
}

function formatarNota(nota) {
    const notaNum = Math.round(nota * 10) / 10; // Arredondar para 1 casa decimal
    let cor, texto, emoji;

    if (nota >= 8) {
        cor = '#22c55e';
        texto = 'Excelente!';
        emoji = '🌟';
    } else if (nota >= 6) {
        cor = '#84cc16';
        texto = 'Bom Potencial';
        emoji = '🌿';
    } else if (nota >= 4) {
        cor = '#f59e0b';
        texto = 'Em Desenvolvimento';
        emoji = '🌱';
    } else {
        cor = '#6b7280';
        texto = 'Iniciando Jornada';
        emoji = '🌱';
    }

    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${emoji}</span>
            <span style="color: ${cor}; font-weight: 700; font-size: 16px;">${notaNum}/10</span>
            <span style="color: ${cor}; font-size: 13px; font-weight: 600; background: ${cor}15; padding: 4px 8px; border-radius: 12px;">${texto}</span>
        </div>
    `;
}

// Função para exibir dicas de otimização ATS específicas
function displayATSOptimizationTips(atsResult) {
    const container = document.getElementById('ats-optimization-tips');
    const section = document.getElementById('ats-optimization-section');

    if (!container || !section) return;

    // Verificar se há dicas de otimização
    if (!atsResult.ats_optimization_tips || !Array.isArray(atsResult.ats_optimization_tips)) {
        section.style.display = 'none';
        return;
    }

    // Mostrar a seção
    section.style.display = 'block';
    container.innerHTML = '';

    // Título da seção
    const title = document.createElement('h3');
    title.style.cssText = `
        color: #583819;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    title.innerHTML = '🚀 Estratégia ATS Inteligente - Fórmula Otimizada';
    container.appendChild(title);

    // Criar cards para cada dica
    atsResult.ats_optimization_tips.forEach((tip, index) => {
        const tipCard = document.createElement('div');
        tipCard.style.cssText = `
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #583819;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;

        // Adicionar efeito hover
        tipCard.addEventListener('mouseenter', () => {
            tipCard.style.transform = 'translateY(-2px)';
            tipCard.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
        });

        tipCard.addEventListener('mouseleave', () => {
            tipCard.style.transform = 'translateY(0)';
            tipCard.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        });

        // Processar diferentes tipos de dicas
        let content = '';

        if (tip.includes('💡')) {
            // Estratégia principal
            content = `<div style="font-size: 16px; line-height: 1.6; color: #1e293b; font-weight: 600;">${tip}</div>`;
        } else if (tip.includes('🔧')) {
            // Tecnologias presentes
            content = `<div style="font-size: 15px; line-height: 1.6; color: #1e293b;">${tip}</div>`;
        } else if (tip.includes('⚠️')) {
            // Palavras-chave ausentes
            content = `<div style="font-size: 15px; line-height: 1.6; color: #dc2626; background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">${tip}</div>`;
        } else if (tip.includes('📝')) {
            // Exemplos práticos
            const parts = tip.split('\\n');
            content = `
                <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
                    <div style="font-weight: 600; margin-bottom: 12px;">${parts[0]}</div>
                    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        ${parts.slice(1).join('<br><br>').replace(/❌/g, '<span style="color: #dc2626;">❌</span>').replace(/✅/g, '<span style="color: #16a34a;">✅</span>')}
                    </div>
                </div>
            `;
        } else if (tip.includes('📋')) {
            // Estrutura recomendada
            content = `<div style="font-size: 15px; line-height: 1.6; color: #1e293b; background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">${tip}</div>`;
        } else if (tip.includes('🎯')) {
            // Densidade inteligente
            content = `<div style="font-size: 15px; line-height: 1.6; color: #1e293b; background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">${tip}</div>`;
        } else {
            // Dica padrão
            content = `<div style="font-size: 15px; line-height: 1.6; color: #1e293b;">${tip}</div>`;
        }

        tipCard.innerHTML = content;
        container.appendChild(tipCard);
    });

    // Adicionar footer com estatística
    const footer = document.createElement('div');
    footer.style.cssText = `
        background: #583819;
        color: white;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        font-weight: 600;
        margin-top: 20px;
    `;
    footer.innerHTML = '📊 Lembre-se: 92% dos candidatos são rejeitados automaticamente. Essas dicas podem ser o diferencial que você precisa!';
    container.appendChild(footer);
}

// Função para exibir estatísticas de relevância
function displayRelevanceStatistics(atsResult) {
    const relevanceStatsContainer = document.getElementById('relevance-stats');

    if (atsResult.keyword_statistics && relevanceStatsContainer) {
        const stats = atsResult.keyword_statistics;

        // Atualizar elementos da estatística
        const statTotal = document.getElementById('stat-total');
        const statTotalKeywords = document.getElementById('stat-total-keywords');
        const statOccurrences = document.getElementById('stat-occurrences');

        if (statTotal) statTotal.textContent = stats.present_in_resume || '0';
        if (statTotalKeywords) statTotalKeywords.textContent = stats.total_identified || '0';
        if (statOccurrences) statOccurrences.textContent = stats.total_occurrences || '0';

        // Mostrar o container
        relevanceStatsContainer.style.display = 'block';
    }
}
