import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

# Configure logger
logger = logging.getLogger(__name__)

class EmailService:
    """
    Service class for sending emails
    """
    
    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        """
        Send an email
        
        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            html_content (str): HTML content of the email
            text_content (str, optional): Plain text content of the email
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Get email configuration from environment variables
            smtp_server = os.environ.get('SMTP_SERVER')
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
            smtp_user = os.environ.get('SMTP_USER')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            sender_email = os.environ.get('SENDER_EMAIL')
            sender_name = os.environ.get('SENDER_NAME')
            
            # Validate configuration
            if not all([smtp_server, smtp_port, smtp_user, smtp_password, sender_email]):
                logger.error("Email configuration is incomplete")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = formataddr((sender_name, sender_email))
            msg['To'] = to_email
            
            # Add text content if provided
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            
            # Add HTML content
            msg.attach(MIMEText(html_content, 'html'))
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def send_payment_success_email(user_email, user_name, payment_amount, credits_added):
        """
        Send a payment success email
        
        Args:
            user_email (str): User's email address
            user_name (str): User's name
            payment_amount (float): Payment amount
            credits_added (int): Number of credits added
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = "Pagamento Confirmado - CV Sem Frescura"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #583819; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
                .button {{ display: inline-block; background-color: #583819; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .details {{ background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Pagamento Confirmado</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>{user_name}</strong>!</p>
                    
                    <p>Seu pagamento de <strong>R$ {payment_amount:.2f}</strong> foi confirmado com sucesso.</p>
                    
                    <div class="details">
                        <h3>Detalhes da Compra:</h3>
                        <p>Pacote: Análise de Currículo</p>
                        <p>Valor: R$ {payment_amount:.2f}</p>
                        <p>Créditos adicionados: {credits_added}</p>
                    </div>
                    
                    <p>Seus créditos já estão disponíveis em sua conta. Você pode utilizá-los para analisar seu currículo a qualquer momento.</p>
                    
                    <a href="http://cvsemfrescura.com.br" class="button">Acessar Minha Conta</a>
                    
                    <p>Agradecemos pela confiança!</p>
                </div>
                <div class="footer">
                    <p>Este é um email automático, por favor não responda.</p>
                    <p>&copy; 2025 CV Sem Frescura. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Pagamento Confirmado - CV Sem Frescura
        
        Olá, {user_name}!
        
        Seu pagamento de R$ {payment_amount:.2f} foi confirmado com sucesso.
        
        Detalhes da Compra:
        - Pacote: Análise de Currículo
        - Valor: R$ {payment_amount:.2f}
        - Créditos adicionados: {credits_added}
        
        Seus créditos já estão disponíveis em sua conta. Você pode utilizá-los para analisar seu currículo a qualquer momento.
        
        Acesse sua conta em: http://cvsemfrescura.com.br
        
        Agradecemos pela confiança!
        
        Este é um email automático, por favor não responda.
        © 2025 CV Sem Frescura. Todos os direitos reservados.
        """
        
        return EmailService.send_email(user_email, subject, html_content, text_content)
    
    @staticmethod
    def send_payment_failed_email(user_email, user_name, payment_amount, payment_method):
        """
        Send a payment failed email
        
        Args:
            user_email (str): User's email address
            user_name (str): User's name
            payment_amount (float): Payment amount
            payment_method (str): Payment method (pix, boleto, card)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = "Falha no Pagamento - CV Sem Frescura"
        
        payment_method_name = {
            'pix': 'PIX',
            'boleto': 'Boleto Bancário',
            'card': 'Cartão de Crédito'
        }.get(payment_method, payment_method.capitalize())
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #d32f2f; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
                .button {{ display: inline-block; background-color: #583819; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .details {{ background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Falha no Pagamento</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>{user_name}</strong>!</p>
                    
                    <p>Infelizmente, houve uma falha no processamento do seu pagamento de <strong>R$ {payment_amount:.2f}</strong>.</p>
                    
                    <div class="details">
                        <h3>Detalhes da Tentativa:</h3>
                        <p>Pacote: Análise de Currículo</p>
                        <p>Valor: R$ {payment_amount:.2f}</p>
                        <p>Método de pagamento: {payment_method_name}</p>
                    </div>
                    
                    <p>Possíveis motivos para a falha:</p>
                    <ul>
                        <li>Problemas com o cartão de crédito (fundos insuficientes, cartão expirado, etc.)</li>
                        <li>Problemas temporários com o processador de pagamentos</li>
                        <li>Informações de pagamento incorretas</li>
                    </ul>
                    
                    <p>Por favor, tente novamente com outro método de pagamento ou entre em contato conosco se precisar de ajuda.</p>
                    
                    <a href="http://cvsemfrescura.com.br/payment.html" class="button">Tentar Novamente</a>
                </div>
                <div class="footer">
                    <p>Este é um email automático, por favor não responda.</p>
                    <p>&copy; 2025 CV Sem Frescura. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Falha no Pagamento - CV Sem Frescura
        
        Olá, {user_name}!
        
        Infelizmente, houve uma falha no processamento do seu pagamento de R$ {payment_amount:.2f}.
        
        Detalhes da Tentativa:
        - Pacote: Análise de Currículo
        - Valor: R$ {payment_amount:.2f}
        - Método de pagamento: {payment_method_name}
        
        Possíveis motivos para a falha:
        - Problemas com o cartão de crédito (fundos insuficientes, cartão expirado, etc.)
        - Problemas temporários com o processador de pagamentos
        - Informações de pagamento incorretas
        
        Por favor, tente novamente com outro método de pagamento ou entre em contato conosco se precisar de ajuda.
        
        Tente novamente em: http://cvsemfrescura.com.br/payment.html
        
        Este é um email automático, por favor não responda.
        © 2025 CV Sem Frescura. Todos os direitos reservados.
        """
        
        return EmailService.send_email(user_email, subject, html_content, text_content)
    
    @staticmethod
    def send_low_credits_email(user_email, user_name, credits_remaining):
        """
        Send a low credits alert email
        
        Args:
            user_email (str): User's email address
            user_name (str): User's name
            credits_remaining (int): Number of credits remaining
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = "Seus créditos estão acabando - CV Sem Frescura"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #ff9800; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
                .button {{ display: inline-block; background-color: #583819; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .credits {{ font-size: 24px; font-weight: bold; color: #ff9800; text-align: center; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Seus créditos estão acabando!</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>{user_name}</strong>!</p>
                    
                    <p>Notamos que seus créditos para análise de currículo estão acabando.</p>
                    
                    <div class="credits">
                        Créditos restantes: {credits_remaining}
                    </div>
                    
                    <p>Para continuar aproveitando nosso serviço de análise de currículo, recomendamos que você adquira mais créditos.</p>
                    
                    <p>Com o CV Sem Frescura, você pode:</p>
                    <ul>
                        <li>Receber feedback personalizado sobre seu currículo</li>
                        <li>Identificar pontos de melhoria</li>
                        <li>Aumentar suas chances de conseguir entrevistas</li>
                    </ul>
                    
                    <a href="http://cvsemfrescura.com.br/payment.html" class="button">Adquirir Mais Créditos</a>
                </div>
                <div class="footer">
                    <p>Este é um email automático, por favor não responda.</p>
                    <p>&copy; 2025 CV Sem Frescura. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Seus créditos estão acabando - CV Sem Frescura
        
        Olá, {user_name}!
        
        Notamos que seus créditos para análise de currículo estão acabando.
        
        Créditos restantes: {credits_remaining}
        
        Para continuar aproveitando nosso serviço de análise de currículo, recomendamos que você adquira mais créditos.
        
        Com o CV Sem Frescura, você pode:
        - Receber feedback personalizado sobre seu currículo
        - Identificar pontos de melhoria
        - Aumentar suas chances de conseguir entrevistas
        
        Adquira mais créditos em: http://cvsemfrescura.com.br/payment.html
        
        Este é um email automático, por favor não responda.
        © 2025 CV Sem Frescura. Todos os direitos reservados.
        """
        
        return EmailService.send_email(user_email, subject, html_content, text_content)
