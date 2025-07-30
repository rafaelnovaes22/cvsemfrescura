const fs = require('fs');
const path = require('path');

// Função para gerar relatório HTML
function generateHTMLReport() {
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Template HTML do relatório
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Testes E2E - CV Sem Frescura</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.2s;
        }
        
        .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .summary-card h3 {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .summary-card.total { background: #f0f4ff; }
        .summary-card.passed .value { color: #10b981; }
        .summary-card.failed .value { color: #ef4444; }
        .summary-card.skipped .value { color: #f59e0b; }
        .summary-card.duration .value { color: #6366f1; font-size: 1.8em; }
        
        .test-suites {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .test-suites h2 {
            background: #f8fafc;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .test-suite {
            border-bottom: 1px solid #e5e7eb;
            padding: 20px;
        }
        
        .test-suite:last-child {
            border-bottom: none;
        }
        
        .test-suite-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .test-suite-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #1f2937;
        }
        
        .test-suite-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
        }
        
        .stat {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .stat-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .stat-icon.passed { background: #10b981; }
        .stat-icon.failed { background: #ef4444; }
        .stat-icon.skipped { background: #f59e0b; }
        
        .test-list {
            margin-left: 20px;
        }
        
        .test-item {
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.95em;
            color: #4b5563;
        }
        
        .test-status {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
        }
        
        .test-status.passed { background: #10b981; }
        .test-status.failed { background: #ef4444; }
        .test-status.skipped { background: #f59e0b; }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        .error-details {
            margin-top: 10px;
            padding: 15px;
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            border-radius: 4px;
            font-size: 0.85em;
            color: #991b1b;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        
        .screenshots {
            margin-top: 20px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
        }
        
        .screenshots h3 {
            font-size: 1.1em;
            margin-bottom: 10px;
            color: #374151;
        }
        
        .screenshot-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .screenshot-item {
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            color: #6b7280;
            border: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Testes E2E</h1>
            <p>CV Sem Frescura - ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total de Testes</h3>
                <div class="value" id="total-tests">0</div>
            </div>
            <div class="summary-card passed">
                <h3>Aprovados</h3>
                <div class="value" id="passed-tests">0</div>
            </div>
            <div class="summary-card failed">
                <h3>Falharam</h3>
                <div class="value" id="failed-tests">0</div>
            </div>
            <div class="summary-card skipped">
                <h3>Ignorados</h3>
                <div class="value" id="skipped-tests">0</div>
            </div>
            <div class="summary-card duration">
                <h3>Duração</h3>
                <div class="value" id="duration">0s</div>
            </div>
        </div>
        
        <div class="test-suites">
            <h2>📁 Suítes de Teste</h2>
            <div id="suites-container">
                <!-- Suítes serão inseridas aqui -->
            </div>
        </div>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema de testes E2E</p>
        </div>
    </div>
    
    <script>
        // Dados dos testes serão inseridos aqui
        const testData = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: "0s",
            suites: []
        };
        
        // Atualizar sumário
        document.getElementById('total-tests').textContent = testData.totalTests;
        document.getElementById('passed-tests').textContent = testData.passedTests;
        document.getElementById('failed-tests').textContent = testData.failedTests;
        document.getElementById('skipped-tests').textContent = testData.skippedTests;
        document.getElementById('duration').textContent = testData.duration;
        
        // Renderizar suítes
        const suitesContainer = document.getElementById('suites-container');
        
        if (testData.suites.length === 0) {
            suitesContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">Nenhum teste foi executado ainda.</p>';
        } else {
            testData.suites.forEach(suite => {
                const suiteHtml = createSuiteHtml(suite);
                suitesContainer.innerHTML += suiteHtml;
            });
        }
        
        function createSuiteHtml(suite) {
            const testsHtml = suite.tests.map(test => createTestHtml(test)).join('');
            
            return \`
                <div class="test-suite">
                    <div class="test-suite-header">
                        <div class="test-suite-title">\${suite.name}</div>
                        <div class="test-suite-stats">
                            <div class="stat">
                                <span class="stat-icon passed"></span>
                                <span>\${suite.passed}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-icon failed"></span>
                                <span>\${suite.failed}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-icon skipped"></span>
                                <span>\${suite.skipped}</span>
                            </div>
                        </div>
                    </div>
                    <div class="test-list">
                        \${testsHtml}
                    </div>
                </div>
            \`;
        }
        
        function createTestHtml(test) {
            const statusIcon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
            const errorHtml = test.error ? \`<div class="error-details">\${test.error}</div>\` : '';
            
            return \`
                <div class="test-item">
                    <div class="test-status \${test.status}">\${statusIcon}</div>
                    <div>
                        <div>\${test.name}</div>
                        \${errorHtml}
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>
    `;
    
    // Salvar o relatório
    const reportPath = path.join(__dirname, 'test-report.html');
    fs.writeFileSync(reportPath, htmlTemplate);
    
    console.log(`✅ Relatório HTML gerado: ${reportPath}`);
    return reportPath;
}

// Executar geração do relatório
generateHTMLReport();