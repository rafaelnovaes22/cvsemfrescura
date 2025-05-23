const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Importação direta do modelo User
const User = require('../models/user');
// Registra o modelo para debug
console.log('Modelo User importado:', User ? 'OK' : 'Não encontrado');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    
    // Atualizar a data do último login
    await user.update({ last_login: new Date() });
    
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        onboarding_completed: user.onboarding_completed,
        job_area: user.job_area,
        experience_level: user.experience_level,
        preferences: user.preferences || {}
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email'] });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Retorna os créditos disponíveis do usuário autenticado
exports.getCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    // Se o campo credits não existir, assume-se 0
    // Em produção, isso deveria ser obtido de uma tabela específica ou modelo de usuário
    const credits = user.credits || 0;
    
    res.json({ credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Salva as informações de onboarding do usuário
exports.completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { job_area, experience_level, preferences } = req.body;
    
    if (!job_area || !experience_level) {
      return res.status(400).json({ error: 'Área de atuação e nível de experiência são obrigatórios.' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    await user.update({
      job_area,
      experience_level,
      preferences: preferences || {},
      onboarding_completed: true
    });
    
    res.json({ 
      message: 'Onboarding concluído com sucesso', 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboarding_completed: true,
        job_area,
        experience_level,
        preferences: preferences || {}
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Retorna o status de onboarding e informações do usuário
exports.getOnboardingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    // Retorna apenas os campos relevantes para o onboarding
    res.json({
      onboarding_completed: user.onboarding_completed || false,
      job_area: user.job_area,
      experience_level: user.experience_level,
      preferences: user.preferences || {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APENAS PARA AMBIENTE DE DESENVOLVIMENTO
// Permite resetar o status de onboarding para testes
exports.resetOnboardingStatus = async (req, res) => {
  // Confirmar que não estamos em produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Esta funcionalidade não está disponível em ambiente de produção' 
    });
  }
  
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    // Resetar campos de onboarding
    await user.update({
      onboarding_completed: false,
      job_area: null,
      experience_level: null,
      preferences: {}
    });
    
    res.json({ success: true, message: 'Status de onboarding resetado com sucesso' });
  } catch (err) {
    console.error('Erro ao resetar onboarding:', err);
    res.status(500).json({ error: err.message });
  }
};
