const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'DEFINIDA' : 'NAO DEFINIDA');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDA' : 'NAO DEFINIDA');

if (process.env.STRIPE_SECRET_KEY) {
    console.log('STRIPE KEY Preview:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
} 