const GiftCode = require('../models/giftCode');
const User = require('../models/user');
const GiftCodeUsage = require('../models/giftCodeUsage');

// Verificar e aplicar um código de presente
exports.validateCode = async (req, res) => {
  try {
    const { code } = req.body;

    console.log('🔍 Validando código:', code);

    if (!code) {
      return res.status(400).json({ error: 'Código de presente é obrigatório.' });
    }

    const giftCode = await GiftCode.findOne({ where: { code } });

    if (!giftCode) {
      console.log('❌ Código não encontrado:', code);
      return res.status(400).json({
        valid: false,
        error: 'Código de presente inválido.'
      });
    }

    // Verificar se o código está ativo
    if (!giftCode.isActive) {
      console.log('❌ Código inativo:', code);
      return res.status(400).json({
        valid: false,
        error: 'Código de presente inativo.'
      });
    }

    // Verificar se ainda há usos disponíveis
    if (giftCode.usedCount >= giftCode.maxUses) {
      console.log('❌ Código esgotado:', code, 'usado', giftCode.usedCount, 'de', giftCode.maxUses);
      return res.status(400).json({
        valid: false,
        error: 'Código de presente esgotado.'
      });
    }

    // Verificar se o código expirou
    if (giftCode.expiresAt && new Date() > giftCode.expiresAt) {
      console.log('❌ Código expirado:', code);
      return res.status(400).json({
        valid: false,
        error: 'Código de presente expirado.'
      });
    }

    console.log('✅ Código válido:', code);
    res.json({
      valid: true,
      credits: 1, // Cada código dá 1 crédito
      remainingUses: giftCode.maxUses - giftCode.usedCount
    });
  } catch (error) {
    console.error('❌ Erro ao validar código de presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Aplicar um código de presente ao usuário (incrementar crédito)
exports.applyCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    console.log('🎁 Aplicando código:', code, 'para usuário:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Código de presente é obrigatório.' });
    }

    // Verificar se o código existe e é válido
    const giftCode = await GiftCode.findOne({ where: { code } });

    if (!giftCode) {
      return res.status(400).json({
        success: false,
        error: 'Código de presente não encontrado.'
      });
    }

    // Verificar se o código está ativo
    if (!giftCode.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Código de presente inativo.'
      });
    }

    // Verificar se ainda há usos disponíveis
    if (giftCode.usedCount >= giftCode.maxUses) {
      return res.status(400).json({
        success: false,
        error: 'Código de presente esgotado.'
      });
    }

    // Verificar se o código expirou
    if (giftCode.expiresAt && new Date() > giftCode.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Código de presente expirado.'
      });
    }

    // Verificar se o usuário já usou este código antes
    const existingUsage = await GiftCodeUsage.findOne({
      where: {
        giftCodeId: giftCode.id,
        userId: userId
      }
    });

    if (existingUsage) {
      return res.status(400).json({
        success: false,
        error: 'Você já utilizou este código de presente anteriormente.'
      });
    }

    // Buscar o usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Registrar o uso do código por este usuário
    await GiftCodeUsage.create({
      giftCodeId: giftCode.id,
      userId: userId
    });

    // Incrementar o contador de uso do código
    await giftCode.update({ usedCount: giftCode.usedCount + 1 });

    // Adicionar um crédito ao usuário
    const newCredits = (user.credits || 0) + 1;
    await user.update({ credits: newCredits });

    console.log('✅ Código aplicado com sucesso! Usuário agora tem', newCredits, 'créditos');

    return res.status(200).json({
      success: true,
      message: 'Código aplicado com sucesso! Você recebeu 1 crédito.',
      credits: newCredits,
      creditsAdded: 1,
      totalCredits: newCredits
    });
  } catch (error) {
    console.error('❌ Erro ao aplicar código de presente:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor.'
    });
  }
};

// Criar um novo código de presente (apenas para administradores)
exports.createCode = async (req, res) => {
  try {
    const { code, maxUses, expiresAt } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({ error: 'Código de presente obrigatório.' });
    }

    // Verificar se o código já existe
    const existingCode = await GiftCode.findOne({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: 'Este código já existe.' });
    }

    // Criar o novo código
    const giftCode = await GiftCode.create({
      code,
      maxUses: maxUses || 1,
      expiresAt: expiresAt || null,
      isActive: true,
      usedCount: 0,
      createdById: userId
    });

    return res.status(201).json({
      success: true,
      message: 'Código de presente criado com sucesso!',
      giftCode
    });
  } catch (error) {
    console.error('❌ Erro ao criar código de presente:', error);
    return res.status(500).json({ error: 'Erro ao criar código de presente.' });
  }
};
