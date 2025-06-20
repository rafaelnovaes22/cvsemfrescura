# 🚀 CV Sem Frescura - Sistema ATS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D12.0-blue)](https://www.postgresql.org/)

Sistema completo para análise e otimização de currículos para sistemas ATS (Applicant Tracking System) utilizando IA avançada. Ajuda profissionais a maximizarem suas chances de contratação através de análise inteligente de compatibilidade com vagas.

## ✨ Funcionalidades

- 🤖 **Análise com IA**: Comparação inteligente de currículos com requisitos de vagas
- 🎯 **Compatibilidade ATS**: Otimização específica para sistemas como Gupy
- 💳 **Pagamentos Stripe**: Sistema de créditos com pagamento seguro
- 📊 **Relatórios Detalhados**: Feedback específico e sugestões de melhoria
- 🔐 **Sistema de Usuários**: Autenticação e controle de créditos
- 🎓 **Códigos Promocionais**: Sistema de cupons para cursos e parcerias

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** (18+) - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** (12+) - Banco de dados
- **OpenAI API** - Inteligência artificial
- **Stripe API** - Processamento de pagamentos
- **JWT** - Autenticação segura

### Frontend
- **HTML5/CSS3** - Interface moderna e responsiva
- **JavaScript Vanilla** - Sem dependências desnecessárias
- **Stripe Elements** - Pagamentos seguros no frontend
- **Design System** - Interface consistente e acessível

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior
- Conta Stripe (teste e produção)
- Chave da API OpenAI

### 1. Clonagem e Dependências

```bash
# Clone o repositório
git clone https://github.com/rafaelnovaes22/cv-sem-frescura.git
cd cv-sem-frescura

# Instale as dependências do backend
cd backend
npm install
```

### 2. Configuração do Banco de Dados

```sql
-- Crie o banco de dados PostgreSQL
CREATE DATABASE cv_sem_frescura;

-- O sistema criará as tabelas automaticamente na primeira execução
```

### 3. Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

**Exemplo de .env para desenvolvimento:**

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/cv_sem_frescura

# Segurança
JWT_SECRET=sua_chave_jwt_super_secreta_minimo_32_caracteres

# APIs
OPENAI_API_KEY=sk-sua_chave_openai

# Stripe - TESTE (usar chaves de teste primeiro)
STRIPE_SECRET_KEY=sk_test_sua_chave_stripe
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_stripe

# Servidor
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### 4. Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🧪 Testes com Stripe

### Cartões de Teste

Para testar pagamentos, use os cartões de teste do Stripe:

- **✅ Sucesso**: `4242 4242 4242 4242`
- **❌ Falha**: `4000 0000 0000 0002`
- **🔒 3D Secure**: `4000 0025 0000 3155`
- **CVV**: Qualquer 3 dígitos
- **Data**: Qualquer data futura

### Fluxo de Teste

1. Acesse `http://localhost:3000`
2. Teste o pagamento com cartão de teste
3. Verifique no dashboard do Stripe
4. Teste o processo de análise

## 🏭 Deploy para Produção

### 1. Servidor (Recomendado: PM2)

```bash
# Instale PM2 globalmente
npm install -g pm2

# Configure para produção
export NODE_ENV=production

# Inicie com PM2
pm2 start server.js --name "cv-sem-frescura"
pm2 save
pm2 startup
```

### 2. Variáveis para Produção

```env
# Atualize para chaves de produção
STRIPE_SECRET_KEY=sk_live_sua_chave_stripe_producao
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe_producao
NODE_ENV=production
FRONTEND_URL=https://seudominio.com
```

### 3. Nginx (Opcional)

```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📁 Estrutura do Projeto

```
cv-sem-frescura/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── routes/                # Rotas da API
│   ├── controllers/           # Lógica de negócio
│   ├── models/                # Modelos do banco
│   ├── services/              # Serviços (OpenAI, Stripe)
│   ├── config/                # Configurações
│   └── package.json
├── frontend/
│   ├── index.html             # Página inicial
│   ├── landing.html           # Landing page
│   ├── payment.html           # Página de pagamento
│   ├── analisar.html          # Interface de análise
│   └── assets/
│       ├── css/               # Estilos
│       ├── js/                # Scripts
│       └── img/               # Imagens
├── .env.example               # Exemplo de configuração
├── .gitignore                 # Arquivos ignorados
└── README.md                  # Este arquivo
```

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ Sanitização de dados
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ CORS configurado
- ✅ Headers de segurança

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
pm2 logs cv-sem-frescura

# Ver status
pm2 status
```

### Health Check

```bash
# Verificar saúde da API
curl http://localhost:3000/health
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Rafael Novaes**
- 📧 Email: rafaeldenovaes@gmail.com
- 💼 LinkedIn: [linkedin.com/in/rafaeldenovaes](https://www.linkedin.com/in/rafaeldenovaes/)
- 💻 GitHub: [github.com/rafaelnovaes22](https://github.com/rafaelnovaes22)

---

⭐ **Gostou do projeto? Deixe uma estrela!** ⭐