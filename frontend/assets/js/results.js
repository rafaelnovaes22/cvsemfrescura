// Exibição dos resultados da análise
document.addEventListener('DOMContentLoaded', function() {
    // Elementos para exibir resultados
    const technicalTermsDiv = document.getElementById('technicalTerms');
    const softSkillsDiv = document.getElementById('softSkills');
    const criticalKeywordsDiv = document.getElementById('criticalKeywords');
    const recommendationsDiv = document.getElementById('recommendations');
    const consolidatedKeywordsContainer = document.getElementById('consolidatedKeywordsContainer');
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    const jobAnalysisContainer = document.getElementById('jobAnalysisContainer');
    const motivationalConclusion = document.getElementById('motivationalConclusion');
    
    // Botões
    const backButton = document.getElementById('backButton');
    const downloadButton = document.getElementById('downloadButton');
    
    // Recupera os resultados do localStorage
    const analysisResults = JSON.parse(localStorage.getItem('analysisResults'));
    
    // Se não houver resultados, volta para a página inicial
    if (!analysisResults) {
        window.location.href = 'index.html';
        return;
    }
    
    // Exibe os resultados
    displayResults(analysisResults);
    
    // Botão de voltar
    backButton.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Botão de download PDF
    downloadButton.addEventListener('click', function() {
        // Criar um elemento para conter o conteúdo a ser impresso
        const printContent = document.createElement('div');
        printContent.className = 'print-content';
        
        // Clonar o conteúdo da página de resultados
        const resultsContainer = document.querySelector('.results-container').cloneNode(true);
        
        // Adicionar estilos inline para impressão
        printContent.innerHTML = `
            <style>
                body {
                    font-family: 'IBM Plex Sans', sans-serif;
                    color: #333;
                    line-height: 1.5;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #583819;
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .result-section {
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .result-section h3 {
                    color: #583819;
                    font-size: 18px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #ECD9B5;
                    padding-bottom: 5px;
                }
                .keyword-tag {
                    display: inline-block;
                    background: #ECD9B5;
                    padding: 3px 8px;
                    border-radius: 4px;
                    margin: 0 5px 5px 0;
                    color: #583819;
                    font-size: 12px;
                }
                .keyword-high {
                    border-left: 3px solid #2a9d8f;
                }
                .keyword-medium {
                    border-left: 3px solid #e9c46a;
                }
                .keyword-low {
                    border-left: 3px solid #e76f51;
                }
                .keyword-missing {
                    background: #f0f0f0;
                    color: #888;
                    border-left: 3px solid #d62828;
                }
                .recommendation {
                    background: #f9f5eb;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }
                .motivational-conclusion {
                    padding: 15px;
                    background-color: rgba(0, 71, 171, 0.05);
                    border-left: 4px solid #0047AB;
                    margin-top: 20px;
                }
                .conclusion-text {
                    font-size: 14px;
                    line-height: 1.5;
                }
                @media print {
                    body {
                        font-size: 12px;
                    }
                    .result-section {
                        page-break-inside: avoid;
                    }
                }
            </style>
            <div class="print-header">
                <h1>Análise do Currículo</h1>
                <p>Data: ${new Date().toLocaleDateString()}</p>
            </div>
        `;
        
        // Adicionar o conteúdo clonado
        printContent.appendChild(resultsContainer);
        
        // Criar um iframe para imprimir
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
        
        // Escrever o conteúdo no iframe
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(printContent.outerHTML);
        frameDoc.close();
        
        // Esperar que o iframe carregue completamente
        setTimeout(function() {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            // Remover o iframe após a impressão
            setTimeout(function() {
                document.body.removeChild(printFrame);
            }, 1000);
        }, 500);
    });
    
    // Função para exibir os resultados
    function displayResults(data) {
        console.log('Exibindo resultados:', data);
        
        // Termos técnicos
        technicalTermsDiv.innerHTML = '';
        
        if (data.termos_tecnicos && Object.keys(data.termos_tecnicos).length > 0) {
            Object.values(data.termos_tecnicos).forEach(term => {
                const termTag = document.createElement('div');
                termTag.classList.add('keyword-tag');
                
                // Adicionar classe baseada na relevância
                if (term.relevancia === 'Alta') {
                    termTag.classList.add('keyword-high');
                } else if (term.relevancia === 'Média') {
                    termTag.classList.add('keyword-medium');
                } else {
                    termTag.classList.add('keyword-low');
                }
                
                termTag.textContent = `${term.termo} (${term.frequencia}x)`;
                technicalTermsDiv.appendChild(termTag);
            });
        } else {
            technicalTermsDiv.innerHTML = '<p>Nenhum termo técnico identificado.</p>';
        }
        
        // Competências comportamentais
        softSkillsDiv.innerHTML = '';
        
        if (data.competencias_comportamentais && data.competencias_comportamentais.length > 0) {
            data.competencias_comportamentais.forEach(skill => {
                const skillTag = document.createElement('div');
                skillTag.classList.add('keyword-tag');
                skillTag.textContent = skill;
                softSkillsDiv.appendChild(skillTag);
            });
        } else {
            softSkillsDiv.innerHTML = '<p>Nenhuma competência comportamental identificada.</p>';
        }
        
        // Palavras-chave críticas (todas as palavras-chave das vagas)
        criticalKeywordsDiv.innerHTML = '';
        
        if (data.all_job_keywords && data.all_job_keywords.length > 0) {
            data.all_job_keywords.forEach(keyword => {
                const keywordTag = document.createElement('div');
                keywordTag.classList.add('keyword-tag');
                
                const presente = data.keywords_found && data.keywords_found.includes(keyword);
                
                if (presente) {
                    keywordTag.classList.add('keyword-high');
                } else {
                    keywordTag.classList.add('keyword-missing');
                }
                
                keywordTag.textContent = keyword + (presente ? ' ✓' : ' ✗');
                criticalKeywordsDiv.appendChild(keywordTag);
            });
        } else if (data.palavras_chave_criticas && data.palavras_chave_criticas.length > 0) {
            // Fallback para o formato antigo
            data.palavras_chave_criticas.forEach(keyword => {
                const keywordTag = document.createElement('div');
                keywordTag.classList.add('keyword-tag');
                
                if (keyword.presente) {
                    keywordTag.classList.add('keyword-high');
                } else {
                    keywordTag.classList.add('keyword-missing');
                }
                
                keywordTag.textContent = keyword.termo + (keyword.presente ? ' ✓' : ' ✗');
                criticalKeywordsDiv.appendChild(keywordTag);
            });
        } else {
            criticalKeywordsDiv.innerHTML = '<p>Nenhuma palavra-chave crítica identificada.</p>';
        }
        
        // Recomendações ATS
        recommendationsDiv.innerHTML = '';
        
        if (data.ats_recommendations && data.ats_recommendations.length > 0) {
            data.ats_recommendations.forEach(recommendation => {
                const recDiv = document.createElement('div');
                recDiv.classList.add('recommendation');
                recDiv.textContent = recommendation;
                recommendationsDiv.appendChild(recDiv);
            });
        } else if (data.ajustes_prioritarios && data.ajustes_prioritarios.length > 0) {
            // Fallback para o formato antigo
            data.ajustes_prioritarios.forEach(recommendation => {
                const recDiv = document.createElement('div');
                recDiv.classList.add('recommendation');
                recDiv.textContent = recommendation;
                recommendationsDiv.appendChild(recDiv);
            });
        } else {
            recommendationsDiv.innerHTML = '<p>Nenhuma recomendação de melhoria identificada.</p>';
        }
        
        // Palavras-chave consolidadas (todas as palavras-chave das vagas)
        consolidatedKeywordsContainer.innerHTML = '';
        
        if (data.all_job_keywords && data.all_job_keywords.length > 0) {
            data.all_job_keywords.forEach(keyword => {
                const keywordTag = document.createElement('div');
                keywordTag.classList.add('keyword-tag');
                keywordTag.textContent = keyword;
                consolidatedKeywordsContainer.appendChild(keywordTag);
            });
        } else if (data.consolidated_keywords && data.consolidated_keywords.length > 0) {
            // Fallback para o formato antigo
            data.consolidated_keywords.forEach(keyword => {
                const keywordTag = document.createElement('div');
                keywordTag.classList.add('keyword-tag');
                keywordTag.textContent = keyword;
                consolidatedKeywordsContainer.appendChild(keywordTag);
            });
        } else {
            consolidatedKeywordsContainer.innerHTML = '<p>Nenhuma palavra-chave consolidada identificada.</p>';
        }
        
        // Recomendações específicas
        recommendationsContainer.innerHTML = '';
        
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach(recommendation => {
                const recDiv = document.createElement('div');
                recDiv.classList.add('recommendation');
                recDiv.textContent = recommendation;
                recommendationsContainer.appendChild(recDiv);
            });
        } else {
            recommendationsContainer.innerHTML = '<p>Nenhuma recomendação específica identificada.</p>';
        }
        
        // Análise de vagas
        jobAnalysisContainer.innerHTML = '';
        
        // Vaga 1
        if (data.job1) {
            const job1Div = document.createElement('div');
            job1Div.classList.add('job-analysis');
            
            const job1Title = document.createElement('h4');
            job1Title.textContent = 'Vaga 1: ' + (data.job1.jobUrl || 'Sem URL');
            job1Div.appendChild(job1Title);
            
            // Palavras-chave presentes
            const presentTitle = document.createElement('h5');
            presentTitle.textContent = 'Palavras-chave presentes no currículo:';
            job1Div.appendChild(presentTitle);
            
            const presentContainer = document.createElement('div');
            if (data.job1.present && data.job1.present.length > 0) {
                data.job1.present.forEach(keyword => {
                    const keywordTag = document.createElement('div');
                    keywordTag.classList.add('keyword-tag', 'keyword-high');
                    keywordTag.textContent = keyword + ' ✓';
                    presentContainer.appendChild(keywordTag);
                });
            } else {
                presentContainer.innerHTML = '<p>Nenhuma palavra-chave presente.</p>';
            }
            job1Div.appendChild(presentContainer);
            
            // Palavras-chave ausentes
            const absentTitle = document.createElement('h5');
            absentTitle.textContent = 'Palavras-chave ausentes no currículo:';
            job1Div.appendChild(absentTitle);
            
            const absentContainer = document.createElement('div');
            if (data.job1.absent && data.job1.absent.length > 0) {
                data.job1.absent.forEach(keyword => {
                    const keywordTag = document.createElement('div');
                    keywordTag.classList.add('keyword-tag', 'keyword-missing');
                    keywordTag.textContent = keyword + ' ✗';
                    absentContainer.appendChild(keywordTag);
                });
            } else {
                absentContainer.innerHTML = '<p>Nenhuma palavra-chave ausente.</p>';
            }
            job1Div.appendChild(absentContainer);
            
            jobAnalysisContainer.appendChild(job1Div);
        }
        
        // Vaga 2
        if (data.job2) {
            const job2Div = document.createElement('div');
            job2Div.classList.add('job-analysis');
            job2Div.style.marginTop = '20px';
            
            const job2Title = document.createElement('h4');
            job2Title.textContent = 'Vaga 2: ' + (data.job2.jobUrl || 'Sem URL');
            job2Div.appendChild(job2Title);
            
            // Palavras-chave presentes
            const presentTitle = document.createElement('h5');
            presentTitle.textContent = 'Palavras-chave presentes no currículo:';
            job2Div.appendChild(presentTitle);
            
            const presentContainer = document.createElement('div');
            if (data.job2.present && data.job2.present.length > 0) {
                data.job2.present.forEach(keyword => {
                    const keywordTag = document.createElement('div');
                    keywordTag.classList.add('keyword-tag', 'keyword-high');
                    keywordTag.textContent = keyword + ' ✓';
                    presentContainer.appendChild(keywordTag);
                });
            } else {
                presentContainer.innerHTML = '<p>Nenhuma palavra-chave presente.</p>';
            }
            job2Div.appendChild(presentContainer);
            
            // Palavras-chave ausentes
            const absentTitle = document.createElement('h5');
            absentTitle.textContent = 'Palavras-chave ausentes no currículo:';
            job2Div.appendChild(absentTitle);
            
            const absentContainer = document.createElement('div');
            if (data.job2.absent && data.job2.absent.length > 0) {
                data.job2.absent.forEach(keyword => {
                    const keywordTag = document.createElement('div');
                    keywordTag.classList.add('keyword-tag', 'keyword-missing');
                    keywordTag.textContent = keyword + ' ✗';
                    absentContainer.appendChild(keywordTag);
                });
            } else {
                absentContainer.innerHTML = '<p>Nenhuma palavra-chave ausente.</p>';
            }
            job2Div.appendChild(absentContainer);
            
            jobAnalysisContainer.appendChild(job2Div);
        }
        
        if (!data.job1 && !data.job2) {
            jobAnalysisContainer.innerHTML = '<p>Nenhuma análise de vaga disponível.</p>';
        }
        
        // Conclusão motivacional
        if (data.motivational_conclusion) {
            motivationalConclusion.innerHTML = `<p class="conclusion-text">${data.motivational_conclusion}</p>`;
        } else {
            motivationalConclusion.innerHTML = '<p class="conclusion-text">Continue aprimorando seu currículo para aumentar suas chances de sucesso!</p>';
        }
    }
});
