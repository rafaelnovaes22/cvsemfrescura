// results.js - Versão corrigida
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔄 results.js: Carregando página de resultados...');

    // Log do carregamento da página
    if (window.historyLogger) {
        window.historyLogger.log('Results Page Loading', {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Date.now()
        }, 'info');
    }

    // Função para exibir erro na interface
    function displayError(message, details = null) {
        console.error('❌ results.js:', message, details);

        const conclusionElement = document.getElementById('conclusion');
        if (conclusionElement) {
            conclusionElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="color: #721c24; margin-bottom: 12px;">Erro ao Carregar Análise</h3>
                    <p style="margin-bottom: 16px;">${message}</p>
                    <div style="margin-top: 20px;">
                        <a href="history.html" style="background: #583819; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 12px;">← Voltar ao Histórico</a>
                        <a href="analisar.html" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Nova Análise</a>
                    </div>
                </div>
            `;
        }
    }

    // Função para validar estrutura dos dados
    function validateAnalysisData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Dados da análise são inválidos ou ausentes' };
        }

        // Verificar se tem pelo menos alguns dados úteis
        const hasUsefulData = data.conclusion ||
            data.resumo ||
            data.job_keywords_present ||
            data.jobs ||
            data.experiencia_profissional;

        if (!hasUsefulData) {
            return { valid: false, error: 'Análise não contém dados suficientes para exibição' };
        }

        return { valid: true };
    }

    // Debug do sessionStorage
    console.log('🔍 results.js: Verificando sessionStorage...');
    console.log('  - atsResult exists:', !!sessionStorage.getItem('atsResult'));
    console.log('  - fileName exists:', !!sessionStorage.getItem('fileName'));
    console.log('  - isHistoricalView exists:', !!sessionStorage.getItem('isHistoricalView'));

    let atsResult = null;
    try {
        const atsResultRaw = sessionStorage.getItem('atsResult');

        if (!atsResultRaw) {
            displayError(
                'Nenhum dado de análise encontrado no navegador.',
                'Possíveis causas:\n- Você acessou esta página diretamente\n- Os dados expiraram\n- Houve erro no carregamento da análise\n\nTente acessar através do histórico ou fazer uma nova análise.'
            );
            return;
        }

        console.log('📄 results.js: Raw atsResult length:', atsResultRaw.length);
        console.log('📄 results.js: Raw atsResult preview:', atsResultRaw.substring(0, 200) + '...');

        atsResult = JSON.parse(atsResultRaw);
        console.log('✅ results.js: atsResult parsed successfully');
        console.log('📊 results.js: atsResult structure:', Object.keys(atsResult || {}));

        // Validar dados
        const validation = validateAnalysisData(atsResult);
        if (!validation.valid) {
            displayError(validation.error, JSON.stringify(atsResult, null, 2));
            return;
        }

    } catch (e) {
        console.error('❌ results.js: Erro ao fazer parse do atsResult:', e);
        displayError(
            'Erro ao processar dados da análise.',
            `Erro técnico: ${e.message}\n\nOs dados podem estar corrompidos. Tente acessar a análise novamente através do histórico.`
        );
        return;
    }

    console.log('🎉 results.js: Dados encontrados, processando...');

    // Verificar se é uma visualização histórica
    const isHistoricalView = sessionStorage.getItem('isHistoricalView') === 'true' ||
        atsResult.isHistoricalView === true;

    // Atualizar créditos do usuário APENAS se NÃO for uma análise histórica
    if (!isHistoricalView && atsResult.credits_remaining !== undefined && window.auth) {
        const user = window.auth.getUser();
        if (user) {
            user.credits = atsResult.credits_remaining;
            localStorage.setItem('user', JSON.stringify(user));
            console.log('💳 Créditos atualizados: ' + atsResult.credits_remaining + ' restantes');

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

    // Nome do arquivo de currículo (priorizar o que vem dos dados da análise)
    const cvFileName = atsResult.fileName || sessionStorage.getItem('fileName') || 'Currículo analisado';
    console.log('📄 results.js: Nome do arquivo:', cvFileName);

    const cvFileNameDiv = document.getElementById('cv-filename');
    if (cvFileNameDiv) {
        cvFileNameDiv.textContent = cvFileName;
        console.log('✅ results.js: Nome do arquivo definido no elemento #cv-filename');
    } else {
        console.error('❌ results.js: Elemento #cv-filename não encontrado');
    }

    // Adicionar indicador visual se for análise histórica
    if (isHistoricalView) {
        const analysisInfo = document.querySelector('.analysis-info');
        if (analysisInfo) {
            const historicalBadge = document.createElement('div');
            historicalBadge.style.cssText = 'background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%); color: #166534; padding: 12px 20px; border-radius: 12px; margin: 15px 0; font-size: 14px; font-weight: 600; border: 2px solid #22c55e; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15); position: relative; overflow: hidden;';

            historicalBadge.innerHTML = '<span style="font-size: 16px;">📋</span><span>Análise do histórico - consulta gratuita</span><span style="font-size: 12px; opacity: 0.8; margin-left: 8px;">✨ Sem consumo de créditos</span>';

            analysisInfo.appendChild(historicalBadge);
        }

        // Modificar o título para indicar que é histórico
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.innerHTML = '📋 Análise de Currículo <small style="font-size: 0.6em; color: #166534; font-weight: 500;">(Histórico)</small>';
        }

        // Limpar flag de visualização histórica após carregar
        sessionStorage.removeItem('isHistoricalView');

        console.log('🎉 results.js: Processamento de análise histórica concluído com sucesso!');

        // Scores de Compatibilidade ATS
        displayCompatibilityScores(atsResult);

        // Palavras-chave das vagas
        const jobKeywordsList = document.getElementById('vaga-keywords');
        if (jobKeywordsList) {
            jobKeywordsList.innerHTML = '';
            if (atsResult.job_keywords && atsResult.job_keywords.length > 0) {
                atsResult.job_keywords.forEach(keyword => {
                    const div = document.createElement('div');
                    div.className = 'keyword-tag';
                    div.textContent = keyword;
                    jobKeywordsList.appendChild(div);
                });
            } else {
                jobKeywordsList.innerHTML = '<div style="color: #666; font-style: italic;">Nenhuma palavra-chave identificada nas vagas.</div>';
            }
        }

        // Recomendações
        const recommendationsList = document.getElementById('recommendations-list');
        if (recommendationsList && atsResult.recommendations) {
            recommendationsList.innerHTML = '';
            atsResult.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        }

        // Preencher elementos básicos
        const conclusion = document.getElementById('conclusion');
        if (conclusion) {
            if (atsResult.conclusion && atsResult.conclusion.trim()) {
                conclusion.textContent = atsResult.conclusion;
                console.log('✅ results.js: Conclusão preenchida com sucesso');
            } else {
                conclusion.innerHTML = `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 24px;">📋</span>
                            <strong style="color: #856404;">Análise Histórica</strong>
                        </div>
                        <p style="margin: 0; color: #856404;">Análise histórica carregada com sucesso.</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #6c757d;">
                            <em>Conclusão original não disponível. Esta é uma visualização histórica dos dados salvos.</em>
                        </p>
                    </div>
                `;
                console.log('⚠️ results.js: Conclusão gerada automaticamente');
            }
        } else {
            console.error('❌ results.js: Elemento #conclusion não encontrado no DOM');
        }

        // Palavras-chave presentes
        const foundKeywordsList = document.getElementById('presentes-keywords');
        if (foundKeywordsList && atsResult.job_keywords_present) {
            foundKeywordsList.innerHTML = '';
            atsResult.job_keywords_present.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.textContent = keyword;
                foundKeywordsList.appendChild(div);
            });
            console.log('✅ results.js: Palavras-chave presentes preenchidas');
        }

        // Palavras-chave ausentes
        const missingKeywordsList = document.getElementById('ausentes-keywords');
        if (missingKeywordsList && atsResult.job_keywords_missing) {
            missingKeywordsList.innerHTML = '';
            atsResult.job_keywords_missing.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.textContent = keyword;
                missingKeywordsList.appendChild(div);
            });
            console.log('✅ results.js: Palavras-chave ausentes preenchidas');
        }

        // Campos de avaliação
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
                // Nota
                const notaElem = document.getElementById(campo.nota);
                if (notaElem && avaliacao.nota) {
                    notaElem.textContent = avaliacao.nota + '/10';
                }

                // Texto de avaliação
                const textoElem = document.getElementById(campo.texto);
                if (textoElem) {
                    let html = '';
                    if (avaliacao.avaliacao) {
                        html += '<div style="margin-bottom: 12px;">' + avaliacao.avaliacao + '</div>';
                    }
                    if (avaliacao.sugestoes && Array.isArray(avaliacao.sugestoes) && avaliacao.sugestoes.length) {
                        html += '<div style="background: #f8fafc; border-left: 4px solid #583819; padding: 12px; border-radius: 4px; margin-top: 12px;">';
                        html += '<strong style="color: #583819; display: block; margin-bottom: 8px;">💡 Sugestões de Melhoria:</strong>';
                        html += '<ul style="margin: 0; padding-left: 20px;">';
                        avaliacao.sugestoes.forEach(s => {
                            html += '<li style="margin-bottom: 4px;">' + s + '</li>';
                        });
                        html += '</ul></div>';
                    }
                    textoElem.innerHTML = html;
                }
            }
        });

        console.log('🎉 results.js: Processamento concluído com sucesso!');
    }
});

// Função para exibir scores de compatibilidade
function displayCompatibilityScores(atsResult) {
    const compatibilityContainer = document.getElementById('compatibility-scores');
    if (!compatibilityContainer) return;

    let hasScores = false;

    // Verificar se há dados de jobs para criar scores
    if (atsResult.jobs && atsResult.jobs.length > 0) {
        compatibilityContainer.innerHTML = '';

        atsResult.jobs.forEach((job, index) => {
            // Calcular score baseado nas palavras-chave
            const presentCount = atsResult.job_keywords_present?.length || 0;
            const totalCount = atsResult.job_keywords?.length || 10;
            const score = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 50;

            const card = document.createElement('div');
            card.className = 'compatibility-card';
            card.innerHTML = `
                <div class="job-header">
                    <div>
                        <div class="job-title">${job.title || 'Vaga ' + (index + 1)}</div>
                    </div>
                    <div class="score-display">
                        <div class="score-number">${score}</div>
                        <div class="score-label">/ 100</div>
                    </div>
                </div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${score}%; background: ${score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#6b7280'}"></div>
                </div>
                <div style="text-align: center; margin: 12px 0; color: #666; font-size: 14px; font-weight: 600;">
                    ${score >= 70 ? '🎉 Boa compatibilidade' : score >= 50 ? '💪 Potencial em desenvolvimento' : '🌱 Começando a jornada'}
                </div>
            `;
            compatibilityContainer.appendChild(card);
            hasScores = true;
        });
    }

    // Se não houver jobs, criar um score geral
    if (!hasScores && (atsResult.job_keywords_present || atsResult.conclusion)) {
        const presentCount = atsResult.job_keywords_present?.length || 0;
        const missingCount = atsResult.job_keywords_missing?.length || 0;
        const totalCount = presentCount + missingCount || 10;
        const score = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 50;

        compatibilityContainer.innerHTML = `
            <div class="compatibility-card">
                <div class="job-header">
                    <div>
                        <div class="job-title">Análise Geral do Currículo</div>
                    </div>
                    <div class="score-display">
                        <div class="score-number">${score}</div>
                        <div class="score-label">/ 100</div>
                    </div>
                </div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${score}%; background: ${score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#6b7280'}"></div>
                </div>
                <div style="text-align: center; margin: 12px 0; color: #666; font-size: 14px; font-weight: 600;">
                    ${score >= 70 ? '🎉 Boa compatibilidade' : score >= 50 ? '💪 Potencial em desenvolvimento' : '🌱 Começando a jornada'}
                </div>
                <div style="margin: 16px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="font-size: 13px; color: #666; margin: 0; line-height: 1.4;">
                        <strong>Score de Compatibilidade ATS:</strong> Calculado com base na quantidade de palavras-chave presentes vs ausentes no seu currículo.
                    </p>
                </div>
            </div>
        `;
        hasScores = true;
    }

    // Se ainda não houver dados suficientes
    if (!hasScores) {
        compatibilityContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 12px; border: 2px dashed #ddd;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <h3 style="color: #583819; margin-bottom: 12px;">Score de Compatibilidade ATS</h3>
                <p>Os scores de compatibilidade serão exibidos quando houver dados de vagas disponíveis.</p>
            </div>
        `;
    }
}