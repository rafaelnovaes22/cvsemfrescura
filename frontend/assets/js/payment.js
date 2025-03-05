/**
 * Payment handling for CV Sem Frescura
 * This file handles the payment process using Stripe API
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const paymentMethods = document.querySelectorAll('.payment-method');
    const btnContinue = document.getElementById('btn-continue');
    const discountRow = document.getElementById('discount-row');
    const totalPrice = document.getElementById('total-price');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const paymentMethodSection = document.getElementById('payment-method-section');
    const paymentInfoSection = document.getElementById('payment-info-section');
    const paymentConfirmationSection = document.getElementById('payment-confirmation-section');
    const pixContainer = document.getElementById('pix-container');
    const boletoContainer = document.getElementById('boleto-container');
    const cardContainer = document.getElementById('card-container');
    const btnGeneratePix = document.getElementById('btn-generate-pix');
    const btnGenerateBoleto = document.getElementById('btn-generate-boleto');
    const btnPayCard = document.getElementById('btn-pay-card');
    const pixConfirmation = document.getElementById('pix-confirmation');
    const boletoConfirmation = document.getElementById('boleto-confirmation');
    const cardConfirmation = document.getElementById('card-confirmation');
    const pixQrCode = document.getElementById('pix-qr-code');
    const pixCodeText = document.getElementById('pix-code-text');
    const pixExpiryTime = document.getElementById('pix-expiry-time');
    const boletoLine = document.getElementById('boleto-line');
    const boletoPdfLink = document.getElementById('boleto-pdf-link');
    const boletoExpiryDate = document.getElementById('boleto-expiry-date');
    const btnCopyPix = document.getElementById('btn-copy-pix');
    const btnCopyBoleto = document.getElementById('btn-copy-boleto');
    
    // Variables
    let selectedMethod = null;
    let packagePrice = 39.97;
    let pixDiscount = 0.05; // 5%
    let stripe = null;
    let cardElement = null;
    
    // Initialize Stripe
    fetch('/api/payment/config')
        .then(response => response.json())
        .then(data => {
            stripe = Stripe(data.publishableKey);
            packagePrice = data.packagePrice;
            pixDiscount = data.pixDiscount;
            
            // Update prices in UI
            updatePrices();
            
            // Initialize card elements
            const elements = stripe.elements();
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });
            
            // Mount card element
            cardElement.mount('#card-element');
            
            // Handle card validation errors
            cardElement.on('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        })
        .catch(error => {
            console.error('Error loading Stripe configuration:', error);
        });
    
    // Select payment method
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove previous selection
            paymentMethods.forEach(m => m.classList.remove('selected'));
            
            // Select current method
            this.classList.add('selected');
            selectedMethod = this.dataset.method;
            
            // Update prices
            updatePrices();
        });
    });
    
    // Update prices based on selected method
    function updatePrices() {
        if (selectedMethod === 'pix') {
            // Apply discount for PIX
            const discountAmount = packagePrice * pixDiscount;
            const discountedPrice = packagePrice - discountAmount;
            
            // Update UI
            discountRow.style.display = 'flex';
            discountRow.querySelector('.summary-item-value').textContent = `-R$ ${discountAmount.toFixed(2)}`;
            totalPrice.textContent = `R$ ${discountedPrice.toFixed(2)}`;
        } else {
            // Regular price for other methods
            discountRow.style.display = 'none';
            totalPrice.textContent = `R$ ${packagePrice.toFixed(2)}`;
        }
    }
    
    // Continue to payment information
    btnContinue.addEventListener('click', function() {
        if (!selectedMethod) {
            alert('Por favor, selecione um método de pagamento.');
            return;
        }
        
        // Update steps
        step1.classList.remove('active');
        step1.classList.add('completed');
        step2.classList.add('active');
        
        // Show information section
        paymentMethodSection.style.display = 'none';
        paymentInfoSection.style.display = 'block';
        
        // Show form corresponding to selected method
        if (selectedMethod === 'pix') {
            pixContainer.classList.add('active');
        } else if (selectedMethod === 'boleto') {
            boletoContainer.classList.add('active');
        } else if (selectedMethod === 'card') {
            cardContainer.classList.add('active');
        }
    });
    
    // Generate PIX QR Code
    btnGeneratePix.addEventListener('click', function() {
        const name = document.getElementById('pix-name').value;
        const email = document.getElementById('pix-email').value;
        
        if (!name || !email) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        // Show loading indicator
        btnGeneratePix.disabled = true;
        btnGeneratePix.textContent = 'Gerando...';
        
        // Calculate discounted price
        const discountedPrice = packagePrice * (1 - pixDiscount);
        
        // Call API to generate PIX
        fetch('/api/payment/pix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: discountedPrice,
                email: email,
                description: 'Pacote de 4 análises de currículo',
                metadata: {
                    package_id: 'pkg_4_analysis',
                    customer_name: name,
                    user_id: getUserId()
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update steps
                step2.classList.remove('active');
                step2.classList.add('completed');
                step3.classList.add('active');
                
                // Show confirmation section
                paymentInfoSection.style.display = 'none';
                paymentConfirmationSection.style.display = 'block';
                
                // Show PIX confirmation
                pixConfirmation.classList.add('active');
                
                // Fill PIX data
                pixQrCode.src = data.pix.qr_code;
                pixCodeText.value = data.pix.qr_code_text;
                
                // Start expiry timer
                startExpiryTimer(data.expires_at);
                
                // Save payment intent ID for later verification
                localStorage.setItem('payment_intent_id', data.payment_intent_id);
            } else {
                alert('Erro ao gerar PIX: ' + data.error);
                btnGeneratePix.disabled = false;
                btnGeneratePix.textContent = 'Gerar QR Code PIX';
            }
        })
        .catch(error => {
            console.error('Erro ao gerar PIX:', error);
            alert('Erro ao gerar PIX. Por favor, tente novamente.');
            btnGeneratePix.disabled = false;
            btnGeneratePix.textContent = 'Gerar QR Code PIX';
        });
    });
    
    // Generate Boleto
    btnGenerateBoleto.addEventListener('click', function() {
        const name = document.getElementById('boleto-name').value;
        const email = document.getElementById('boleto-email').value;
        const cpf = document.getElementById('boleto-cpf').value;
        const address = document.getElementById('boleto-address').value;
        const city = document.getElementById('boleto-city').value;
        const state = document.getElementById('boleto-state').value;
        const postalCode = document.getElementById('boleto-postal-code').value;
        
        if (!name || !email || !cpf || !address || !city || !state || !postalCode) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        // Show loading indicator
        btnGenerateBoleto.disabled = true;
        btnGenerateBoleto.textContent = 'Gerando...';
        
        // Call API to generate boleto
        fetch('/api/payment/boleto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: packagePrice,
                customer: {
                    name: name,
                    email: email,
                    tax_id: cpf,
                    address: {
                        street: address,
                        city: city,
                        state: state,
                        postal_code: postalCode
                    }
                },
                description: 'Pacote de 4 análises de currículo',
                metadata: {
                    package_id: 'pkg_4_analysis',
                    user_id: getUserId()
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update steps
                step2.classList.remove('active');
                step2.classList.add('completed');
                step3.classList.add('active');
                
                // Show confirmation section
                paymentInfoSection.style.display = 'none';
                paymentConfirmationSection.style.display = 'block';
                
                // Show boleto confirmation
                boletoConfirmation.classList.add('active');
                
                // Fill boleto data
                boletoLine.value = data.boleto.number_line;
                boletoPdfLink.href = data.boleto.pdf_url;
                
                // Format expiry date
                const expiryDate = new Date(data.boleto.expires_at * 1000);
                boletoExpiryDate.textContent = expiryDate.toLocaleDateString('pt-BR');
                
                // Save payment intent ID for later verification
                localStorage.setItem('payment_intent_id', data.payment_intent_id);
            } else {
                alert('Erro ao gerar boleto: ' + data.error);
                btnGenerateBoleto.disabled = false;
                btnGenerateBoleto.textContent = 'Gerar Boleto';
            }
        })
        .catch(error => {
            console.error('Erro ao gerar boleto:', error);
            alert('Erro ao gerar boleto. Por favor, tente novamente.');
            btnGenerateBoleto.disabled = false;
            btnGenerateBoleto.textContent = 'Gerar Boleto';
        });
    });
    
    // Pay with Card
    btnPayCard.addEventListener('click', function() {
        const name = document.getElementById('card-name').value;
        const email = document.getElementById('card-email').value;
        
        if (!name || !email) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        // Show loading indicator
        btnPayCard.disabled = true;
        btnPayCard.textContent = 'Processando...';
        
        // Create payment method
        stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: name,
                email: email
            }
        }).then(function(result) {
            if (result.error) {
                // Show error
                const errorElement = document.getElementById('card-errors');
                errorElement.textContent = result.error.message;
                btnPayCard.disabled = false;
                btnPayCard.textContent = 'Pagar com Cartão';
            } else {
                // Send token to server
                processCardPayment(result.paymentMethod.id, name, email);
            }
        });
    });
    
    // Process card payment
    function processCardPayment(paymentMethodId, name, email) {
        fetch('/api/payment/card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: packagePrice,
                payment_method_id: paymentMethodId,
                email: email,
                description: 'Pacote de 4 análises de currículo',
                metadata: {
                    package_id: 'pkg_4_analysis',
                    customer_name: name,
                    user_id: getUserId()
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.requires_action) {
                    // 3D Secure authentication required
                    stripe.confirmCardPayment(data.client_secret).then(function(result) {
                        if (result.error) {
                            // Authentication failed
                            const errorElement = document.getElementById('card-errors');
                            errorElement.textContent = result.error.message;
                            btnPayCard.disabled = false;
                            btnPayCard.textContent = 'Pagar com Cartão';
                        } else {
                            // Payment approved
                            showCardSuccess();
                            
                            // Save payment intent ID for later verification
                            localStorage.setItem('payment_intent_id', data.payment_intent_id);
                        }
                    });
                } else {
                    // Payment approved without additional authentication
                    showCardSuccess();
                    
                    // Save payment intent ID for later verification
                    localStorage.setItem('payment_intent_id', data.payment_intent_id);
                }
            } else {
                // Payment error
                const errorElement = document.getElementById('card-errors');
                errorElement.textContent = data.error || 'Erro ao processar pagamento.';
                btnPayCard.disabled = false;
                btnPayCard.textContent = 'Pagar com Cartão';
            }
        })
        .catch(error => {
            console.error('Erro ao processar pagamento:', error);
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = 'Erro ao processar pagamento. Por favor, tente novamente.';
            btnPayCard.disabled = false;
            btnPayCard.textContent = 'Pagar com Cartão';
        });
    }
    
    // Show card payment success
    function showCardSuccess() {
        // Update steps
        step2.classList.remove('active');
        step2.classList.add('completed');
        step3.classList.add('active');
        
        // Show confirmation section
        paymentInfoSection.style.display = 'none';
        paymentConfirmationSection.style.display = 'block';
        
        // Show card confirmation
        cardConfirmation.classList.add('active');
    }
    
    // Start PIX expiry timer
    function startExpiryTimer(expiryTimestamp) {
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = expiryTimestamp - now;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                pixExpiryTime.textContent = '00:00';
                alert('O código PIX expirou. Por favor, gere um novo código.');
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            pixExpiryTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Copy PIX code
    btnCopyPix.addEventListener('click', function() {
        pixCodeText.select();
        document.execCommand('copy');
        btnCopyPix.textContent = 'Copiado!';
        setTimeout(() => {
            btnCopyPix.textContent = 'Copiar';
        }, 2000);
    });
    
    // Copy boleto line
    btnCopyBoleto.addEventListener('click', function() {
        boletoLine.select();
        document.execCommand('copy');
        btnCopyBoleto.textContent = 'Copiado!';
        setTimeout(() => {
            btnCopyBoleto.textContent = 'Copiar';
        }, 2000);
    });
    
    // Get user ID from localStorage or generate a new one
    function getUserId() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }
    
    // Check payment status periodically (for PIX and boleto)
    function checkPaymentStatus() {
        const paymentIntentId = localStorage.getItem('payment_intent_id');
        if (!paymentIntentId) return;
        
        fetch(`/api/payment/status/${paymentIntentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'succeeded') {
                    // Payment successful, redirect to success page
                    window.location.href = 'payment-success.html';
                }
            })
            .catch(error => {
                console.error('Error checking payment status:', error);
            });
    }
    
    // Check payment status every 5 seconds
    if (pixConfirmation && boletoConfirmation) {
        if (pixConfirmation.classList.contains('active') || boletoConfirmation.classList.contains('active')) {
            setInterval(checkPaymentStatus, 5000);
        }
    }
});
