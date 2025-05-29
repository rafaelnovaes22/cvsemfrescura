console.log('🔍 Testando modelos...');

try {
    console.log('1. Testando modelo User...');
    const userModel = require('./models/user');
    console.log('✅ User model carregado:', typeof userModel);

    console.log('2. Testando modelo Analysis...');
    const analysisModel = require('./models/Analysis');
    console.log('✅ Analysis model carregado:', typeof analysisModel);

    console.log('3. Testando modelo GiftCode...');
    const giftCodeModel = require('./models/giftCode');
    console.log('✅ GiftCode model carregado:', typeof giftCodeModel);

    console.log('4. Testando modelo Transaction...');
    const transactionModel = require('./models/Transaction');
    console.log('✅ Transaction model carregado:', typeof transactionModel);

    console.log('5. Testando modelo GiftCodeUsage...');
    const giftCodeUsageModel = require('./models/giftCodeUsage');
    console.log('✅ GiftCodeUsage model carregado:', typeof giftCodeUsageModel);

    console.log('6. Testando modelo PasswordReset...');
    const passwordResetModel = require('./models/PasswordReset');
    console.log('✅ PasswordReset model carregado:', typeof passwordResetModel);

    console.log('7. Testando index dos modelos...');
    const db = require('./models');
    console.log('✅ Models index carregado');

} catch (error) {
    console.error('❌ Erro ao testar modelos:', error);
} 