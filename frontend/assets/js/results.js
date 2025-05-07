// results.js - Integração frontend ATS para CV Sem Frescura
// Este script busca os dados de análise na sessionStorage e popula a página de resultados
// Versão atualizada para o novo formato de resposta com análise avançada para sistemas ATS

document.addEventListener('DOMContentLoaded', function() {
    let atsResult = null;
    try {
        atsResult = JSON.parse(sessionStorage.getItem('atsResult'));
        
        // Extrair e expor metadados da resposta para o sistema de feedback
        if (atsResult && atsResult._meta) {
            window.responseMetadata = atsResult._meta;
            console.log('Metadados de resposta disponíveis:', window.responseMetadata);
        }
    } catch (e) {
        atsResult = null;
        console.error('Erro ao carregar resultado:', e);
    }
    
    // Verificar se existem dados multivaga - modelo novo
    function hasMultiJobData() {
        return atsResult && 
               (atsResult.job_matches && Array.isArray(atsResult.job_matches) && atsResult.job_matches.length > 0);
    }

    if (!atsResult) {
        document.getElementById('conclusion').innerText = 'Nenhum resultado de análise encontrado.';
        return;
    }
    
    // Função para exibir múltiplas vagas
    function displayMultipleJobs() {
        if (!hasMultiJobData()) {
            return;
        }
        
        const jobsContainer = document.getElementById('job-matches-container');
        if (!jobsContainer) {
            return;
        }
        
        // Limpa o container
        jobsContainer.innerHTML = '';
        
        // Adiciona estilos CSS dinamicamente
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .job-matches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            
            .job-match-item {
                background-color: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                padding: 20px;
                transition: transform 0.2s ease;
            }
            
            .job-match-item:hover {
                transform: translateY(-5px);
            }
            
            .job-match-item h3 {
                color: #583819;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid #ECD9B5;
                padding-bottom: 10px;
            }
            
            .compatibility-meter {
                height: 12px;
                background-color: #f3f3f3;
                border-radius: 6px;
                margin: 15px 0;
                position: relative;
                overflow: hidden;
            }
            
            .compatibility-fill {
                height: 100%;
                background-color: #4CAF50;
                border-radius: 6px;
            }
            
            .compatibility-meter span {
                display: block;
                margin-top: 5px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .requirements-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .present-requirements, .missing-requirements {
                background-color: #f9f9f9;
                border-radius: 8px;
                padding: 12px;
            }
            
            .present-requirements h4 {
                color: #4CAF50;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .missing-requirements h4 {
                color: #F44336;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .present-requirements ul, .missing-requirements ul {
                list-style-type: none;
                padding: 0;
                margin: 0;
            }
            
            .present-requirements li {
                padding: 5px 0;
                font-size: 13px;
                color: #4CAF50;
                position: relative;
                padding-left: 18px;
            }
            
            .missing-requirements li {
                padding: 5px 0;
                font-size: 13px;
                color: #F44336;
                position: relative;
                padding-left: 18px;
            }
            
            .present-requirements li:before {
                content: '\\2713';
                position: absolute;
                left: 0;
                top: 4px;
            }
            
            .missing-requirements li:before {
                content: '\\2717';
                position: absolute;
                left: 0;
                top: 4px;
            }
        `;
        document.head.appendChild(styleEl);
        
        // Cria um elemento para cada vaga
        atsResult.job_matches.forEach((job, index) => {
            const jobElement = document.createElement('div');
            jobElement.classList.add('job-match-item');
            
            jobElement.innerHTML = `
                <h3>${job.title || 'Vaga ' + (index + 1)}</h3>
                <div class="compatibility-meter">
                    <div class="compatibility-fill" style="width: ${job.compatibility || 0}%"></div>
                    <span>Compatibilidade: ${job.compatibility || 0}%</span>
                </div>
                <div class="requirements-container">
                    <div class="present-requirements">
                        <h4>Requisitos Presentes</h4>
                        <ul>
                            ${(job.present_requirements || []).map(req => `<li>${req}</li>`).join('')}
                            ${(job.present_requirements || []).length === 0 ? '<li>Nenhum requisito identificado</li>' : ''}
                        </ul>
                    </div>
                    <div class="missing-requirements">
                        <h4>Requisitos Ausentes</h4>
                        <ul>
                            ${(job.missing_requirements || []).map(req => `<li>${req}</li>`).join('')}
                            ${(job.missing_requirements || []).length === 0 ? '<li>Nenhum requisito ausente</li>' : ''}
                        </ul>
                    </div>
                </div>
            `;
            
            jobsContainer.appendChild(jobElement);
        });
        
        // Exibe o container
        document.getElementById('job-matches-section').style.display = 'block';
    }

    // Nome do arquivo de currículo
    const cvFileName = sessionStorage.getItem('fileName');
    if (cvFileName) {
        const cvFileNameDiv = document.getElementById('cv-filename');
        if (cvFileNameDiv) cvFileNameDiv.textContent = cvFileName;
    }
    
    // Executa a exibição de múltiplas vagas se disponível
    displayMultipleJobs();

    // Resumo de compatibilidade no topo da página
    const analysisDiv = document.getElementById('analysis-summary');
    if (analysisDiv && atsResult.avaliacao) {
        const taxa = atsResult.avaliacao.taxa_correspondencia_geral || 0;
        const taxaObrigatorios = atsResult.avaliacao.taxa_correspondencia_obrigatorios || 0;
        
        let resumoHTML = `<strong>Compatibilidade geral:</strong> ${taxa}%<br>`;
        resumoHTML += `<strong>Compatibilidade com requisitos obrigatórios:</strong> ${taxaObrigatorios}%<br><br>`;
        
        // Se existem perfis de vagas, mostra informações sobre elas
        if (atsResult.perfil_vagas && atsResult.perfil_vagas.length) {
            resumoHTML += '<strong>Vagas analisadas:</strong><br>';
            atsResult.perfil_vagas.forEach(vaga => {
                resumoHTML += `• ${vaga.cargo} - ${vaga.area} (${vaga.nivel}) - Compatibilidade: ${vaga.compatibilidade_percentual}%<br>`;
            });
        }
        
        analysisDiv.innerHTML = resumoHTML;
    }

    // --- EXIBIÇÃO DE PALAVRAS-CHAVE ---
    
    // Hard skills técnicos
    const jobKeywordsList = document.getElementById('vaga-keywords');
    if (jobKeywordsList && atsResult.hard_skills && atsResult.hard_skills.tecnicos) {
        jobKeywordsList.innerHTML = '';
        atsResult.hard_skills.tecnicos.forEach(keyword => {
            const div = document.createElement('div');
            div.className = 'keyword-tag';
            div.innerText = keyword;
            jobKeywordsList.appendChild(div);
        });
    }
    
    // Soft skills
    const softSkillsSection = document.getElementById('soft-skills-section');
    const softSkillsList = document.getElementById('soft-skills-keywords');
    if (softSkillsSection && softSkillsList && atsResult.soft_skills) {
        softSkillsList.innerHTML = '';
        
        // Combinar todas as categorias de soft skills
        const allSoftSkills = [];
        
        if (atsResult.soft_skills.comportamental && Array.isArray(atsResult.soft_skills.comportamental)) {
            allSoftSkills.push(...atsResult.soft_skills.comportamental);
        }
        
        if (atsResult.soft_skills.gestao && Array.isArray(atsResult.soft_skills.gestao)) {
            allSoftSkills.push(...atsResult.soft_skills.gestao);
        }
        
        // Checar se temos soft skills para exibir
        if (allSoftSkills.length > 0) {
            allSoftSkills.forEach(skill => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.style.backgroundColor = '#e8f5e9'; // Fundo verde claro para soft skills
                div.style.color = '#2e7d32'; // Texto verde escuro
                div.style.borderLeft = '3px solid #2e7d32';
                div.innerText = skill;
                softSkillsList.appendChild(div);
            });
            
            // Mostrar a seção
            softSkillsSection.style.display = 'block';
        } else {
            softSkillsList.innerHTML = '<div>Nenhuma soft skill foi identificada explicitamente nas vagas analisadas.</div>';
            
            // Decidir se mostra ou esconde a seção
            if (atsResult.soft_skills.comportamental || atsResult.soft_skills.gestao) {
                softSkillsSection.style.display = 'block';
            } else {
                softSkillsSection.style.display = 'none';
            }
        }
    }
    
    // Responsabilidades e Atribuições
    const responsabilidadesSection = document.getElementById('responsabilidades-section');
    const responsabilidadesList = document.getElementById('responsabilidades-keywords');
    if (responsabilidadesSection && responsabilidadesList && atsResult.responsabilidades) {
        responsabilidadesList.innerHTML = '';
        
        if (atsResult.responsabilidades && Array.isArray(atsResult.responsabilidades) && atsResult.responsabilidades.length > 0) {
            atsResult.responsabilidades.forEach(resp => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.style.backgroundColor = '#fff3e0'; // Fundo amarelo claro para responsabilidades
                div.style.color = '#e65100'; // Texto laranja escuro
                div.style.borderLeft = '3px solid #e65100';
                div.innerText = resp;
                responsabilidadesList.appendChild(div);
            });
            
            // Mostrar a seção
            responsabilidadesSection.style.display = 'block';
        } else {
            responsabilidadesList.innerHTML = '<div>Nenhuma responsabilidade foi identificada explicitamente nas vagas analisadas.</div>';
            responsabilidadesSection.style.display = 'none';
        }
    }
    
    // Diferenciais
    const diferenciaisSection = document.getElementById('diferenciais-section');
    const diferenciaisList = document.getElementById('diferenciais-keywords');
    if (diferenciaisSection && diferenciaisList && atsResult.diferenciais) {
        diferenciaisList.innerHTML = '';
        
        if (atsResult.diferenciais && Array.isArray(atsResult.diferenciais) && atsResult.diferenciais.length > 0) {
            atsResult.diferenciais.forEach(dif => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.style.backgroundColor = '#e1f5fe'; // Fundo azul claro para diferenciais
                div.style.color = '#0277bd'; // Texto azul escuro
                div.style.borderLeft = '3px solid #0277bd';
                div.innerText = dif;
                diferenciaisList.appendChild(div);
            });
            
            // Mostrar a seção
            diferenciaisSection.style.display = 'block';
        } else {
            diferenciaisList.innerHTML = '<div>Nenhum diferencial foi identificado explicitamente nas vagas analisadas.</div>';
            diferenciaisSection.style.display = 'none';
        }
    }

    // Palavras-chave presentes no currículo
    const foundKeywordsList = document.getElementById('presentes-keywords');
    if (foundKeywordsList) {
        foundKeywordsList.innerHTML = '';
        const presentes = atsResult.resume_keywords_present || [];
        
        if (presentes.length) {
            presentes.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerText = keyword;
                foundKeywordsList.appendChild(div);
            });
        } else {
            foundKeywordsList.innerHTML = '<div style="color:red">Nenhuma palavra-chave da vaga foi identificada no currículo.</div>';
        }
    }

    // Palavras-chave ausentes no currículo
    const missingKeywordsList = document.getElementById('ausentes-keywords');
    if (missingKeywordsList) {
        missingKeywordsList.innerHTML = '';
        const ausentes = atsResult.resume_keywords_missing || [];
        
        if (ausentes.length) {
            ausentes.forEach(keyword => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.innerText = keyword;
                missingKeywordsList.appendChild(div);
            });
        } else {
            missingKeywordsList.innerHTML = '<div style="color:green">Todas as palavras-chave foram encontradas no currículo!</div>';
        }
    }

    // --- EXIBIÇÃO DE FILTROS ELIMINATÓRIOS E CLASSIFICATÓRIOS ---
    
    // Exibir filtros eliminatórios
    const filtrosEliminatoriosSection = document.getElementById('filtros-eliminatorios-section');
    const filtrosEliminatoriosList = document.getElementById('filtros-eliminatorios');
    
    if (filtrosEliminatoriosSection && filtrosEliminatoriosList && atsResult.filtros_eliminatorios) {
        filtrosEliminatoriosList.innerHTML = '';
        
        if (atsResult.filtros_eliminatorios && atsResult.filtros_eliminatorios.length) {
            // Mostrar a seção
            filtrosEliminatoriosSection.style.display = 'block';
            
            atsResult.filtros_eliminatorios.forEach(filtro => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.style.backgroundColor = '#ffd2d2'; // Fundo levemente vermelho para destacar
                div.style.color = '#d32f2f';
                div.style.borderLeft = '3px solid #d32f2f';
                div.innerText = filtro;
                filtrosEliminatoriosList.appendChild(div);
            });
        } else {
            filtrosEliminatoriosList.innerHTML = '<div>Nenhum filtro eliminatório identificado nas vagas analisadas.</div>';
            
            // Verificar se deve exibir ou não a seção
            if (atsResult.filtros_eliminatorios && atsResult.filtros_eliminatorios.length === 0) {
                filtrosEliminatoriosSection.style.display = 'block';
            } else {
                filtrosEliminatoriosSection.style.display = 'none';
            }
        }
    }
    
    // Exibir filtros classificatórios
    const filtrosClassificatoriosSection = document.getElementById('filtros-classificatorios-section');
    const filtrosClassificatoriosList = document.getElementById('filtros-classificatorios');
    
    if (filtrosClassificatoriosSection && filtrosClassificatoriosList && atsResult.filtros_classificatorios) {
        filtrosClassificatoriosList.innerHTML = '';
        
        if (atsResult.filtros_classificatorios && atsResult.filtros_classificatorios.length) {
            // Mostrar a seção
            filtrosClassificatoriosSection.style.display = 'block';
            
            atsResult.filtros_classificatorios.forEach(filtro => {
                const div = document.createElement('div');
                div.className = 'keyword-tag';
                div.style.backgroundColor = '#e3f2fd'; // Fundo levemente azul para destacar
                div.style.color = '#0d47a1';
                div.style.borderLeft = '3px solid #0d47a1';
                div.innerText = filtro;
                filtrosClassificatoriosList.appendChild(div);
            });
        } else {
            filtrosClassificatoriosList.innerHTML = '<div>Nenhum filtro classificatório identificado nas vagas analisadas.</div>';
            
            // Verificar se deve exibir ou não a seção
            if (atsResult.filtros_classificatorios && atsResult.filtros_classificatorios.length === 0) {
                filtrosClassificatoriosSection.style.display = 'block';
            } else {
                filtrosClassificatoriosSection.style.display = 'none';
            }
        }
    }

    // --- RECOMENDAÇÕES ---
    
    // Recomendações gerais
    const recommendationsList = document.getElementById('recommendations-list');
    if (recommendationsList && atsResult.recomendacoes) {
        recommendationsList.innerHTML = '';
        
        // Recomendações de alterações
        if (atsResult.recomendacoes.alteracoes && atsResult.recomendacoes.alteracoes.length) {
            const alteracoesLi = document.createElement('li');
            alteracoesLi.innerHTML = '<strong>Alterações necessárias:</strong>';
            const alteracoesUl = document.createElement('ul');
            atsResult.recomendacoes.alteracoes.forEach(rec => {
                const li = document.createElement('li');
                li.innerText = rec;
                alteracoesUl.appendChild(li);
            });
            alteracoesLi.appendChild(alteracoesUl);
            recommendationsList.appendChild(alteracoesLi);
        }
        
        // Recomendações de ênfase
        if (atsResult.recomendacoes.enfase && atsResult.recomendacoes.enfase.length) {
            const enfaseLi = document.createElement('li');
            enfaseLi.innerHTML = '<strong>Elementos para dar ênfase:</strong>';
            const enfaseUl = document.createElement('ul');
            atsResult.recomendacoes.enfase.forEach(rec => {
                const li = document.createElement('li');
                li.innerText = rec;
                enfaseUl.appendChild(li);
            });
            enfaseLi.appendChild(enfaseUl);
            recommendationsList.appendChild(enfaseLi);
        }
        
        // Recomendações de formatação
        if (atsResult.recomendacoes.formatacao && atsResult.recomendacoes.formatacao.length) {
            const formatacaoLi = document.createElement('li');
            formatacaoLi.innerHTML = '<strong>Formatação recomendada:</strong>';
            const formatacaoUl = document.createElement('ul');
            atsResult.recomendacoes.formatacao.forEach(rec => {
                const li = document.createElement('li');
                li.innerText = rec;
                formatacaoUl.appendChild(li);
            });
            formatacaoLi.appendChild(formatacaoUl);
            recommendationsList.appendChild(formatacaoLi);
        }
    }

    // --- AVALIAÇÃO DETALHADA ---
    
    // Mapeamento dos novos campos de avaliação para os elementos HTML existentes
    const campos = [
        { chave: 'resumo', nota: 'nota-resumo', texto: 'texto-resumo', fonte: 'avaliacao.resumo' },
        { chave: 'idiomas', nota: 'nota-idiomas', texto: 'texto-idiomas', fonte: 'avaliacao.idiomas' },
        { chave: 'formacao', nota: 'nota-formacao', texto: 'texto-formacao', fonte: 'avaliacao.formacao' },
        { chave: 'habilidades', nota: 'nota-habilidades', texto: 'texto-habilidades', fonte: 'avaliacao.habilidades' },
        { chave: 'experiencia', nota: 'nota-experiencia', texto: 'texto-experiencia', fonte: 'avaliacao.experiencia' },
        { chave: 'informacoes_pessoais', nota: 'nota-pessoais', texto: 'texto-pessoais' }
    ];
    
    campos.forEach(campo => {
        // Buscar avaliação na nova estrutura ou fallback para a estrutura antiga
        let avaliacao;
        if (campo.fonte && campo.fonte.includes('.')) {
            const [parent, child] = campo.fonte.split('.');
            avaliacao = atsResult[parent] && atsResult[parent][child] ? atsResult[parent][child] : null;
        } else {
            avaliacao = atsResult[campo.chave];
        }
        
        if (avaliacao) {
            // Nota
            const notaElem = document.getElementById(campo.nota);
            if (notaElem) {
                const notaValue = avaliacao.nota !== undefined ? avaliacao.nota : 
                    (avaliacao.analise ? avaliacao.nota : '-');
                notaElem.textContent = notaValue;
            }
            
            // Texto de avaliação + sugestões
            const textoElem = document.getElementById(campo.texto);
            if (textoElem) {
                let html = '';
                
                // Verificar diferentes formatos possíveis do texto de avaliação
                if (avaliacao.avaliacao) {
                    html += avaliacao.avaliacao + '<br>';
                } else if (avaliacao.analise) {
                    html += avaliacao.analise + '<br>';
                }
                
                // Verificar diferentes formatos possíveis das sugestões
                if (avaliacao.sugestoes && Array.isArray(avaliacao.sugestoes) && avaliacao.sugestoes.length) {
                    html += '<ul>' + avaliacao.sugestoes.map(s => `<li>${s}</li>`).join('') + '</ul>';
                } else if (avaliacao.sugestoes) {
                    html += `<div>${avaliacao.sugestoes}</div>`;
                }
                
                textoElem.innerHTML = html || 'Nenhuma avaliação disponível para esta seção.';
            }
        }
    });

    // --- CONCLUSÃO ---
    
    // Conclusão - usar a conclusão do novo formato ou fallback para o formato antigo
    const conclusion = document.getElementById('conclusion');
    if (conclusion) {
        if (atsResult.recomendacoes && atsResult.recomendacoes.conclusao) {
            conclusion.innerText = atsResult.recomendacoes.conclusao;
        } else if (atsResult.conclusion) {
            conclusion.innerText = atsResult.conclusion;
        } else {
            conclusion.innerText = 'Avaliação concluída. Siga as recomendações acima para otimizar seu currículo para os sistemas ATS.';
        }
    }
    
    // --- CRIAÇÃO DINÂMICA DE SEÇÃO PARA PRIORIDADE DE VAGAS ---
    
    // Verificar se existem recomendações de prioridade de vagas
    if (atsResult.recomendacoes && atsResult.recomendacoes.prioridade_vagas && atsResult.recomendacoes.prioridade_vagas.length) {
        // Encontrar a seção de conclusão para inserir após ela
        const conclusionSection = conclusion ? conclusion.closest('.section') : null;
        
        if (conclusionSection) {
            const prioridadeSection = document.createElement('section');
            prioridadeSection.className = 'section';
            prioridadeSection.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Prioridade de Candidatura</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="prioridade-vagas-container"></div>
            `;
            
            conclusionSection.parentNode.insertBefore(prioridadeSection, conclusionSection.nextSibling);
            
            const container = prioridadeSection.querySelector('.prioridade-vagas-container');
            atsResult.recomendacoes.prioridade_vagas.forEach(rec => {
                const div = document.createElement('div');
                div.className = 'avaliacao-box';
                div.innerHTML = `<p>${rec}</p>`;
                container.appendChild(div);
            });
        }
    }
});
