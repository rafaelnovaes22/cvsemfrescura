from flask import Blueprint, request, jsonify
import logging
import sys
import os

# Add the parent directory to sys.path to allow imports from the backend package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from modules.payment import PaymentService

# Configure logger
logger = logging.getLogger(__name__)

# Create Blueprint
payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')

@payment_bp.route('/pix', methods=['POST'])
def create_pix_payment():
    """
    Create a PIX payment
    
    Request body:
    {
        "amount": 39.97,
        "email": "customer@example.com",
        "description": "Pacote de 4 análises de currículo",
        "metadata": {
            "package_id": "pkg_4_analysis",
            "user_id": "user123"
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'email', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Create PIX payment
        result = PaymentService.create_pix_payment(
            amount=data['amount'],
            customer_email=data['email'],
            description=data['description'],
            metadata=data.get('metadata', {})
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating PIX payment: {str(e)}")
        return jsonify({'success': False, 'error': 'An unexpected error occurred'}), 500

@payment_bp.route('/boleto', methods=['POST'])
def create_boleto_payment():
    """
    Create a Boleto payment
    
    Request body:
    {
        "amount": 39.97,
        "customer": {
            "name": "João Silva",
            "email": "joao@example.com",
            "tax_id": "12345678909",  # CPF
            "address": {
                "street": "Rua Exemplo, 123",
                "city": "São Paulo",
                "state": "SP",
                "postal_code": "01234-567"
            }
        },
        "description": "Pacote de 4 análises de currículo",
        "metadata": {
            "package_id": "pkg_4_analysis",
            "user_id": "user123"
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'amount' not in data:
            return jsonify({'success': False, 'error': 'Missing required field: amount'}), 400
            
        if 'customer' not in data:
            return jsonify({'success': False, 'error': 'Missing required field: customer'}), 400
            
        customer = data['customer']
        required_customer_fields = ['name', 'email', 'tax_id']
        for field in required_customer_fields:
            if field not in customer:
                return jsonify({'success': False, 'error': f'Missing required customer field: {field}'}), 400
        
        # Create Boleto payment
        result = PaymentService.create_boleto_payment(
            amount=data['amount'],
            customer_data=customer,
            description=data.get('description', 'Pacote de análises de currículo'),
            metadata=data.get('metadata', {})
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating Boleto payment: {str(e)}")
        return jsonify({'success': False, 'error': 'An unexpected error occurred'}), 500

@payment_bp.route('/card', methods=['POST'])
def create_card_payment():
    """
    Create a credit card payment
    
    Request body:
    {
        "amount": 39.97,
        "payment_method_id": "pm_...",
        "email": "customer@example.com",
        "description": "Pacote de 4 análises de currículo",
        "metadata": {
            "package_id": "pkg_4_analysis",
            "user_id": "user123"
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'payment_method_id', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Create card payment
        result = PaymentService.create_card_payment(
            amount=data['amount'],
            payment_method_id=data['payment_method_id'],
            customer_email=data['email'],
            description=data.get('description', 'Pacote de análises de currículo'),
            metadata=data.get('metadata', {})
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating card payment: {str(e)}")
        return jsonify({'success': False, 'error': 'An unexpected error occurred'}), 500

@payment_bp.route('/webhook', methods=['POST'])
def webhook():
    """
    Handle Stripe webhook events
    """
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    if not sig_header:
        return jsonify({'success': False, 'error': 'Missing Stripe-Signature header'}), 400
    
    result = PaymentService.handle_webhook(payload, sig_header)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@payment_bp.route('/config', methods=['GET'])
def get_config():
    """
    Get Stripe public key and other configuration
    """
    import os
    
    return jsonify({
        'publishableKey': os.environ.get('STRIPE_PUBLISHABLE_KEY'),
        'packagePrice': 39.97,
        'pixDiscount': 0.05,  # 5% discount for PIX
        'currency': 'brl'
    })

@payment_bp.route('/status/<payment_intent_id>', methods=['GET'])
def get_payment_status(payment_intent_id):
    """
    Get the status of a payment intent
    
    This endpoint is used to check if a payment (especially PIX or boleto)
    has been completed.
    """
    try:
        import stripe
        import os
        
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        
        # Retrieve payment intent from Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        return jsonify({
            'success': True,
            'status': payment_intent.status,
            'amount': payment_intent.amount / 100,  # Convert from cents to currency
            'currency': payment_intent.currency,
            'payment_method_types': payment_intent.payment_method_types
        })
    except Exception as e:
        logger.error(f"Error retrieving payment status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error retrieving payment status'
        }), 400
