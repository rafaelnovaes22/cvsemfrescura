const db = require('../models');
const GiftCode = db.GiftCode;
const User = db.User;
const GiftCodeUsage = db.GiftCodeUsage;

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

    console.log('🎁 [GIFT CODE] Aplicando código:', code, 'para usuário:', userId);
    console.log('🔍 [GIFT CODE] Dados recebidos:', { code, userId, userObject: req.user });

    if (!userId) {
      console.log('❌ [GIFT CODE] Usuário não autenticado - ID não encontrado');
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!code) {
      console.log('❌ [GIFT CODE] Código não fornecido');
      return res.status(400).json({ error: 'Código de presente é obrigatório.' });
    }

    // Verificar se o código existe e é válido
    console.log('🔍 [GIFT CODE] Buscando código no banco:', code);
    const giftCode = await GiftCode.findOne({ where: { code } });

    if (!giftCode) {
      console.log('❌ [GIFT CODE] Código não encontrado no banco:', code);
      return res.status(400).json({
        success: false,
        error: 'Código de presente não encontrado.'
      });
    }

    console.log('✅ [GIFT CODE] Código encontrado:', {
      id: giftCode.id,
      code: giftCode.code,
      isActive: giftCode.isActive,
      usedCount: giftCode.usedCount,
      maxUses: giftCode.maxUses,
      expiresAt: giftCode.expiresAt
    });

    // Verificar se o código está ativo
    if (!giftCode.isActive) {
      console.log('❌ [GIFT CODE] Código inativo:', code);
      return res.status(400).json({
        success: false,
        error: 'Código de presente inativo.'
      });
    }

    // Verificar se ainda há usos disponíveis
    if (giftCode.usedCount >= giftCode.maxUses) {
      console.log('❌ [GIFT CODE] Código esgotado:', code, `(${giftCode.usedCount}/${giftCode.maxUses})`);
      return res.status(400).json({
        success: false,
        error: 'Código de presente esgotado.'
      });
    }

    // Verificar se o código expirou
    if (giftCode.expiresAt && new Date() > giftCode.expiresAt) {
      console.log('❌ [GIFT CODE] Código expirado:', code, 'em:', giftCode.expiresAt);
      return res.status(400).json({
        success: false,
        error: 'Código de presente expirado.'
      });
    }

    // Verificar se o usuário já usou este código antes
    console.log('🔍 [GIFT CODE] Verificando uso anterior do código pelo usuário...');
    const existingUsage = await GiftCodeUsage.findOne({
      where: {
        giftCodeId: giftCode.id,
        userId: userId
      }
    });

    if (existingUsage) {
      console.log('❌ [GIFT CODE] Usuário já usou este código:', {
        userId,
        giftCodeId: giftCode.id,
        usedAt: existingUsage.usedAt
      });
      return res.status(400).json({
        success: false,
        error: 'Você já utilizou este código de presente anteriormente.'
      });
    }

    // Buscar o usuário
    console.log('🔍 [GIFT CODE] Buscando dados do usuário:', userId);
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ [GIFT CODE] Usuário não encontrado no banco:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    console.log('✅ [GIFT CODE] Usuário encontrado:', {
      id: user.id,
      email: user.email,
      creditsAntes: user.credits
    });

    // INICIAR TRANSAÇÃO PARA GARANTIR CONSISTÊNCIA
    const transaction = await db.sequelize.transaction();

    try {
      console.log('🔄 [GIFT CODE] Iniciando transação...');

      // Registrar o uso do código por este usuário
      console.log('📝 [GIFT CODE] Registrando uso do código...');
      const usage = await GiftCodeUsage.create({
        giftCodeId: giftCode.id,
        userId: userId
      }, { transaction });

      console.log('✅ [GIFT CODE] Uso registrado:', usage.id);

      // Incrementar o contador de uso do código
      console.log('🔄 [GIFT CODE] Incrementando contador do código...');
      const [updatedRowsCode] = await GiftCode.update(
        { usedCount: giftCode.usedCount + 1 },
        {
          where: { id: giftCode.id },
          transaction
        }
      );

      console.log('✅ [GIFT CODE] Contador incrementado. Linhas afetadas:', updatedRowsCode);

      // Adicionar um crédito ao usuário
      const newCredits = (user.credits || 0) + 1;
      console.log('💳 [GIFT CODE] Atualizando créditos:', {
        creditosAtuais: user.credits || 0,
        novosCreditos: newCredits
      });

      const [updatedRowsUser] = await User.update(
        { credits: newCredits },
        {
          where: { id: userId },
          transaction
        }
      );

      console.log('✅ [GIFT CODE] Créditos atualizados. Linhas afetadas:', updatedRowsUser);

      // Confirmar transação
      await transaction.commit();
      console.log('✅ [GIFT CODE] Transação confirmada com sucesso!');

      console.log('🎉 [GIFT CODE] Código aplicado com sucesso! Usuário agora tem', newCredits, 'créditos');

      return res.status(200).json({
        success: true,
        message: 'Código aplicado com sucesso! Você recebeu 1 crédito.',
        credits: newCredits
      });

    } catch (transactionError) {
      // Reverter transação em caso de erro
      await transaction.rollback();
      console.error('❌ [GIFT CODE] Erro na transação, revertendo:', transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ [GIFT CODE] Erro geral ao aplicar código de presente:', error);
    console.error('❌ [GIFT CODE] Stack trace:', error.stack);
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
