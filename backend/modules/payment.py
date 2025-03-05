import os
import stripe
from datetime import datetime, timedelta
from flask import jsonify, request, current_app
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Initialize Stripe with the API key from environment variables
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

class PaymentService:
    """
    Service class for handling payment operations using Stripe
    """
    
    @staticmethod
    def create_pix_payment(amount, customer_email, description, metadata=None):
        """
        Create a PIX payment intent
        
        Args:
            amount (float): Amount in BRL
            customer_email (str): Customer email for receipt
            description (str): Payment description
            metadata (dict, optional): Additional metadata
            
        Returns:
            dict: Payment intent details including PIX QR code
        """
        try:
            # Convert amount to cents (Stripe requires integer amounts)
            amount_cents = int(amount * 100)
            
            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='brl',
                payment_method_types=['pix'],
                receipt_email=customer_email,
                description=description,
                metadata=metadata or {},
                expires_at=int((datetime.now() + timedelta(hours=24)).timestamp())
            )
            
            # Get PIX details
            pix_info = payment_intent.next_action.pix_display_qr_code
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'pix': {
                    'qr_code': pix_info.image_url_png,
                    'qr_code_text': pix_info.data
                },
                'expires_at': payment_intent.expires_at
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PIX payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating PIX payment: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }
    
    @staticmethod
    def create_boleto_payment(amount, customer_data, description, metadata=None):
        """
        Create a Boleto payment intent
        
        Args:
            amount (float): Amount in BRL
            customer_data (dict): Customer information including name, email, tax_id, address
            description (str): Payment description
            metadata (dict, optional): Additional metadata
            
        Returns:
            dict: Payment intent details including Boleto information
        """
        try:
            # Convert amount to cents
            amount_cents = int(amount * 100)
            
            # Create payment method for boleto
            payment_method = stripe.PaymentMethod.create(
                type='boleto',
                boleto={
                    'tax_id': customer_data.get('tax_id')  # CPF or CNPJ
                },
                billing_details={
                    'name': customer_data.get('name'),
                    'email': customer_data.get('email'),
                    'address': {
                        'line1': customer_data.get('address', {}).get('street', ''),
                        'city': customer_data.get('address', {}).get('city', ''),
                        'state': customer_data.get('address', {}).get('state', ''),
                        'postal_code': customer_data.get('address', {}).get('postal_code', ''),
                        'country': 'BR'
                    }
                }
            )
            
            # Create payment intent with boleto payment method
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='brl',
                payment_method_types=['boleto'],
                payment_method=payment_method.id,
                description=description,
                metadata=metadata or {},
                confirm=True
            )
            
            # Get boleto details
            boleto_info = payment_intent.next_action.boleto_display_details
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'boleto': {
                    'pdf_url': boleto_info.hosted_voucher_url,
                    'number_line': boleto_info.number_line,
                    'expires_at': boleto_info.expires_at
                }
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating Boleto payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating Boleto payment: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }
    
    @staticmethod
    def create_card_payment(amount, payment_method_id, customer_email, description, metadata=None):
        """
        Create a credit card payment intent
        
        Args:
            amount (float): Amount in BRL
            payment_method_id (str): Stripe payment method ID
            customer_email (str): Customer email for receipt
            description (str): Payment description
            metadata (dict, optional): Additional metadata
            
        Returns:
            dict: Payment intent details
        """
        try:
            # Convert amount to cents
            amount_cents = int(amount * 100)
            
            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='brl',
                payment_method=payment_method_id,
                confirmation_method='manual',
                confirm=True,
                receipt_email=customer_email,
                description=description,
                metadata=metadata or {},
                return_url=f"{request.host_url.rstrip('/')}/payment/confirmation"
            )
            
            # Check if additional action is required (3D Secure)
            if payment_intent.status == 'requires_action':
                return {
                    'success': True,
                    'requires_action': True,
                    'payment_intent_id': payment_intent.id,
                    'client_secret': payment_intent.client_secret
                }
            elif payment_intent.status == 'succeeded':
                return {
                    'success': True,
                    'payment_intent_id': payment_intent.id,
                    'status': 'succeeded'
                }
            else:
                return {
                    'success': False,
                    'payment_intent_id': payment_intent.id,
                    'status': payment_intent.status,
                    'error': f"Payment not successful. Status: {payment_intent.status}"
                }
                
        except stripe.error.CardError as e:
            logger.error(f"Card error: {str(e)}")
            return {
                'success': False,
                'error': e.user_message
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating card payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating card payment: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }
    
    @staticmethod
    def handle_webhook(payload, sig_header):
        """
        Handle Stripe webhook events
        
        Args:
            payload (bytes): Request body
            sig_header (str): Stripe signature header
            
        Returns:
            dict: Response with status
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
            
            # Handle the event
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                PaymentService._handle_successful_payment(payment_intent)
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                PaymentService._handle_failed_payment(payment_intent)
            else:
                logger.info(f"Unhandled event type: {event['type']}")
                
            return {'success': True, 'message': 'Webhook received'}
            
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return {'success': False, 'error': 'Invalid signature'}
        except Exception as e:
            logger.error(f"Webhook error: {str(e)}")
            return {'success': False, 'error': 'Webhook processing error'}
    
    @staticmethod
    def _handle_successful_payment(payment_intent):
        """
        Handle successful payment
        
        Args:
            payment_intent (dict): Stripe payment intent object
        """
        try:
            # Get the package ID from metadata
            package_id = payment_intent.get('metadata', {}).get('package_id')
            user_id = payment_intent.get('metadata', {}).get('user_id')
            
            if not user_id:
                logger.error(f"Payment succeeded but no user_id in metadata: {payment_intent.id}")
                return
                
            logger.info(f"Payment succeeded: {payment_intent.id} for package {package_id} by user {user_id}")
            
            # Import database functions
            from database.database import register_payment, add_user_credits
            import sqlite3
            
            # Determine payment method
            payment_method = "unknown"
            if payment_intent.get('payment_method_types'):
                if 'pix' in payment_intent.get('payment_method_types'):
                    payment_method = "pix"
                elif 'boleto' in payment_intent.get('payment_method_types'):
                    payment_method = "boleto"
                elif 'card' in payment_intent.get('payment_method_types'):
                    payment_method = "card"
            
            # Register payment in database
            payment_amount = payment_intent.get('amount', 0) / 100  # Convert from cents to currency
            payment_id = register_payment(
                user_id=int(user_id),
                payment_intent_id=payment_intent.id,
                amount=payment_amount,
                status="succeeded",
                payment_method=payment_method
            )
            
            if not payment_id:
                logger.error(f"Failed to register payment in database: {payment_intent.id}")
                return
            
            # Credits to add based on package
            credits_to_add = 0
            if package_id == "pkg_4_analysis":
                credits_to_add = 4
            else:
                logger.warning(f"Unknown package ID: {package_id}")
                return
                
            # Grant access to the package (add credits)
            new_credits = add_user_credits(int(user_id), credits_to_add)
            logger.info(f"Added {credits_to_add} analysis credits to user {user_id}. New total: {new_credits}")
            
            # Get user information for email
            try:
                from database.database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                
                cursor.execute("SELECT email, name FROM users WHERE id = ?", (int(user_id),))
                user = cursor.fetchone()
                conn.close()
                
                if user:
                    user_email = user['email']
                    user_name = user['name'] or "Cliente"
                    
                    # Send confirmation email
                    from modules.email_service import EmailService
                    email_sent = EmailService.send_payment_success_email(
                        user_email=user_email,
                        user_name=user_name,
                        payment_amount=payment_amount,
                        credits_added=credits_to_add
                    )
                    
                    if email_sent:
                        logger.info(f"Payment confirmation email sent to {user_email}")
                    else:
                        logger.warning(f"Failed to send payment confirmation email to {user_email}")
                else:
                    logger.warning(f"User not found for ID: {user_id}")
            except Exception as e:
                logger.error(f"Error sending payment confirmation email: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error handling successful payment: {str(e)}")
        
    @staticmethod
    def _handle_failed_payment(payment_intent):
        """
        Handle failed payment
        
        Args:
            payment_intent (dict): Stripe payment intent object
        """
        try:
            # Get the package ID from metadata
            package_id = payment_intent.get('metadata', {}).get('package_id')
            user_id = payment_intent.get('metadata', {}).get('user_id')
            
            if not user_id:
                logger.error(f"Payment failed but no user_id in metadata: {payment_intent.id}")
                return
                
            logger.info(f"Payment failed: {payment_intent.id} for package {package_id} by user {user_id}")
            
            # Import database functions
            from database.database import register_payment
            
            # Determine payment method
            payment_method = "unknown"
            if payment_intent.get('payment_method_types'):
                if 'pix' in payment_intent.get('payment_method_types'):
                    payment_method = "pix"
                elif 'boleto' in payment_intent.get('payment_method_types'):
                    payment_method = "boleto"
                elif 'card' in payment_intent.get('payment_method_types'):
                    payment_method = "card"
            
            # Register failed payment in database
            payment_amount = payment_intent.get('amount', 0) / 100  # Convert from cents to currency
            payment_id = register_payment(
                user_id=int(user_id),
                payment_intent_id=payment_intent.id,
                amount=payment_amount,
                status="failed",
                payment_method=payment_method
            )
            
            if not payment_id:
                logger.error(f"Failed to register failed payment in database: {payment_intent.id}")
            
            # Get user information for email
            try:
                from database.database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                
                cursor.execute("SELECT email, name FROM users WHERE id = ?", (int(user_id),))
                user = cursor.fetchone()
                conn.close()
                
                if user:
                    user_email = user['email']
                    user_name = user['name'] or "Cliente"
                    
                    # Send payment failed email
                    from modules.email_service import EmailService
                    email_sent = EmailService.send_payment_failed_email(
                        user_email=user_email,
                        user_name=user_name,
                        payment_amount=payment_amount,
                        payment_method=payment_method
                    )
                    
                    if email_sent:
                        logger.info(f"Payment failed email sent to {user_email}")
                    else:
                        logger.warning(f"Failed to send payment failed email to {user_email}")
                else:
                    logger.warning(f"User not found for ID: {user_id}")
            except Exception as e:
                logger.error(f"Error sending payment failed email: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error handling failed payment: {str(e)}")
