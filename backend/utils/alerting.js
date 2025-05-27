const nodemailer = require('nodemailer');
const { logger } = require('./logger');

class AlertingSystem {
    constructor() {
        this.transporter = null;
        this.lastAlerts = new Map(); // Para evitar spam de alertas
        this.cooldownPeriod = 15 * 60 * 1000; // 15 minutos
        this.setupTransporter();
    }

    setupTransporter() {
        try {
            if (process.env.SMTP_HOST && process.env.SMTP_PASS) {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER || 'apikey',
                        pass: process.env.SMTP_PASS
                    }
                });
                console.log('✅ Sistema de alertas por email configurado');
            } else {
                console.log('⚠️ Sistema de alertas: SMTP não configurado');
            }
        } catch (error) {
            console.error('❌ Erro ao configurar alertas por email:', error);
        }
    }

    // Verificar se devemos enviar alerta (cooldown)
    shouldSendAlert(alertKey) {
        const lastSent = this.lastAlerts.get(alertKey);
        const now = Date.now();

        if (!lastSent || (now - lastSent) > this.cooldownPeriod) {
            this.lastAlerts.set(alertKey, now);
            return true;
        }

        return false;
    }

    // Enviar email de alerta
    async sendEmailAlert(alert) {
        if (!this.transporter) return false;

        try {
            const htmlContent = this.generateAlertHTML(alert);

            const mailOptions = {
                from: process.env.FROM_EMAIL || 'alerts@cvsemfrescura.com.br',
                to: process.env.ALERT_EMAIL || process.env.FROM_EMAIL,
                subject: `🚨 ALERTA CV Sem Frescura: ${alert.type.toUpperCase()}`,
                html: htmlContent,
                text: `ALERTA: ${alert.message}\nSeveridade: ${alert.severity}\nTimestamp: ${alert.timestamp}`
            };

            await this.transporter.sendMail(mailOptions);
            logger.info('Email de alerta enviado com sucesso', { alert });
            return true;

        } catch (error) {
            logger.error('Erro ao enviar email de alerta', { error, alert });
            return false;
        }
    }

    // Gerar HTML para email de alerta
    generateAlertHTML(alert) {
        const severityColors = {
            critical: '#dc2626',
            warning: '#d97706',
            info: '#2563eb'
        };

        const severityIcons = {
            critical: '🔴',
            warning: '⚠️',
            info: 'ℹ️'
        };

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${severityIcons[alert.severity]} Alerta do Sistema</h1>
            <p>CV Sem Frescura - Monitoramento</p>
          </div>
          
          <div class="content">
            <h2>Detalhes do Alerta</h2>
            
            <div class="alert-details">
              <p><strong>Tipo:</strong> ${alert.type.toUpperCase()}</p>
              <p><strong>Severidade:</strong> ${alert.severity.toUpperCase()}</p>
              <p><strong>Mensagem:</strong> ${alert.message}</p>
              <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString('pt-BR')}</p>
            </div>

            <h3>Ações Recomendadas:</h3>
            <ul>
              ${this.getRecommendedActions(alert.type).map(action => `<li>${action}</li>`).join('')}
            </ul>

            <p>
              <a href="https://cvsemfrescura.com.br/monitoring.html" class="btn">
                Ver Dashboard de Monitoramento
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Este é um alerta automático do sistema de monitoramento CV Sem Frescura</p>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    // Ações recomendadas por tipo de alerta
    getRecommendedActions(alertType) {
        const actions = {
            memory: [
                'Verificar aplicações que estão consumindo muita memória',
                'Considerar reiniciar o serviço se necessário',
                'Monitorar logs para vazamentos de memória',
                'Avaliar necessidade de upgrade de recursos'
            ],
            error_rate: [
                'Verificar logs de erro para identificar causa raiz',
                'Verificar status dos serviços externos (APIs)',
                'Monitorar latência e performance',
                'Considerar rollback se foi um deploy recente'
            ],
            database: [
                'Verificar conectividade com o banco de dados',
                'Verificar espaço em disco do banco',
                'Monitorar queries lentas',
                'Verificar pool de conexões'
            ],
            uptime: [
                'Verificar status dos serviços',
                'Verificar conectividade de rede',
                'Verificar recursos do servidor',
                'Considerar restart dos serviços'
            ]
        };

        return actions[alertType] || ['Verificar dashboard de monitoramento para mais detalhes'];
    }

    // Enviar alerta via webhook (Slack, Discord, etc.)
    async sendWebhookAlert(alert, webhookUrl) {
        if (!webhookUrl) return false;

        try {
            const payload = {
                text: `🚨 Alerta CV Sem Frescura`,
                attachments: [{
                    color: alert.severity === 'critical' ? 'danger' : 'warning',
                    fields: [
                        { title: 'Tipo', value: alert.type.toUpperCase(), short: true },
                        { title: 'Severidade', value: alert.severity.toUpperCase(), short: true },
                        { title: 'Mensagem', value: alert.message, short: false },
                        { title: 'Timestamp', value: new Date(alert.timestamp).toLocaleString('pt-BR'), short: true }
                    ]
                }]
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                logger.info('Webhook de alerta enviado com sucesso', { alert });
                return true;
            } else {
                logger.error('Erro ao enviar webhook de alerta', { status: response.status, alert });
                return false;
            }

        } catch (error) {
            logger.error('Erro ao enviar webhook de alerta', { error, alert });
            return false;
        }
    }

    // Método principal para processar alertas
    async processAlert(alert) {
        const alertKey = `${alert.type}_${alert.severity}`;

        // Verificar se devemos enviar (cooldown)
        if (!this.shouldSendAlert(alertKey)) {
            console.log(`Alerta em cooldown: ${alertKey}`);
            return;
        }

        console.log(`🚨 Processando alerta: ${alert.type} (${alert.severity})`);

        // Enviar email se configurado
        if (alert.severity === 'critical' || alert.severity === 'warning') {
            await this.sendEmailAlert(alert);
        }

        // Enviar webhook se configurado
        const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl && alert.severity === 'critical') {
            await this.sendWebhookAlert(alert, webhookUrl);
        }

        // Log do alerta
        logger.warn('Alerta do sistema processado', { alert });
    }

    // Verificar métricas e gerar alertas
    checkMetricsAndAlert(metrics) {
        const alerts = [];

        // Verificar uso de memória
        const memoryUsage = metrics.system.memory.heapUsed / metrics.system.memory.heapTotal;
        if (memoryUsage > 0.9) {
            alerts.push({
                type: 'memory',
                severity: 'critical',
                message: `Memory usage is critically high: ${(memoryUsage * 100).toFixed(1)}%`,
                timestamp: new Date().toISOString()
            });
        } else if (memoryUsage > 0.8) {
            alerts.push({
                type: 'memory',
                severity: 'warning',
                message: `Memory usage is high: ${(memoryUsage * 100).toFixed(1)}%`,
                timestamp: new Date().toISOString()
            });
        }

        // Verificar taxa de erro
        const errorRate = metrics.requests.total > 0 ? metrics.requests.errors / metrics.requests.total : 0;
        if (errorRate > 0.2) { // > 20%
            alerts.push({
                type: 'error_rate',
                severity: 'critical',
                message: `Error rate is critically high: ${(errorRate * 100).toFixed(1)}%`,
                timestamp: new Date().toISOString()
            });
        } else if (errorRate > 0.1) { // > 10%
            alerts.push({
                type: 'error_rate',
                severity: 'warning',
                message: `Error rate is elevated: ${(errorRate * 100).toFixed(1)}%`,
                timestamp: new Date().toISOString()
            });
        }

        // Processar alertas
        alerts.forEach(alert => {
            this.processAlert(alert);
        });

        return alerts;
    }
}

// Instância global
const alertingSystem = new AlertingSystem();

module.exports = {
    AlertingSystem,
    alertingSystem
}; 