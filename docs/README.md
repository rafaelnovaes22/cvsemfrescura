# CV Sem Frescura

> Sistema inteligente de análise de currículos com IA para otimização de candidaturas

## 🚀 Sobre o Projeto

O **CV Sem Frescura** é uma plataforma web que utiliza inteligência artificial para analisar currículos e fornecer insights personalizados para melhorar a adequação às vagas desejadas. O sistema oferece análise detalhada de compatibilidade, sugestões de melhorias e scores de adequação.

## ⚡ Tecnologias

### Frontend
- **HTML5, CSS3, JavaScript** - Interface responsiva e moderna
- **Stripe Elements** - Processamento seguro de pagamentos
- **API Integration** - Comunicação assíncrona com backend

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **MySQL** - Banco de dados relacional
- **OpenAI API** - Análise por inteligência artificial
- **Stripe API** - Gateway de pagamentos

## 🎯 Funcionalidades

- ✅ **Análise Inteligente** - Avaliação de currículos por IA
- ✅ **Matching com Vagas** - Comparação com até 7 vagas simultâneas
- ✅ **Checkout Rápido** - Compra sem necessidade de cadastro
- ✅ **Scores Detalhados** - Pontuação de compatibilidade
- ✅ **Recomendações** - Sugestões personalizadas de melhoria
- ✅ **Histórico** - Acompanhamento de análises anteriores

## 🏗️ Arquitetura

```
cv-sem-frescura/
├── frontend/           # Interface do usuário
│   ├── assets/        # CSS, JS, imagens
│   ├── *.html         # Páginas da aplicação
│   └── index.html     # Página inicial
├── backend/           # API e lógica de negócio
│   ├── controllers/   # Controladores
│   ├── models/        # Modelos de dados
│   ├── routes/        # Rotas da API
│   ├── services/      # Serviços externos
│   └── server.js      # Servidor principal
├── docs/              # Documentação
└── README.md          # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- MySQL 8.0+
- Chaves de API (OpenAI, Stripe)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/cv-sem-frescura.git
cd cv-sem-frescura
```

2. **Configure o backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure suas variáveis no arquivo .env
```

3. **Configure o banco de dados**
```bash
# Execute as migrations
npm run migrate
```

4. **Inicie o servidor**
```bash
npm start
```

5. **Acesse a aplicação**
```
Frontend: http://localhost:3000
API: http://localhost:3000/api
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Banco de Dados
DB_HOST=localhost
DB_NAME=cv_sem_frescura
DB_USER=seu_usuario
DB_PASS=sua_senha

# APIs
OPENAI_API_KEY=sua_chave_openai
STRIPE_SECRET_KEY=sua_chave_stripe

# Segurança
JWT_SECRET=seu_jwt_secret_seguro
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token

### Análise
- `POST /api/analysis/create` - Nova análise
- `GET /api/analysis/history` - Histórico
- `GET /api/analysis/:id` - Detalhes da análise

### Pagamentos
- `POST /api/payment/create-intent` - Criar intenção de pagamento
- `POST /api/payment/confirm` - Confirmar pagamento
- `GET /api/payment/history` - Histórico de pagamentos

## 🛡️ Segurança

- ✅ Autenticação JWT
- ✅ Validação de dados
- ✅ Rate limiting
- ✅ Sanitização de inputs
- ✅ HTTPS obrigatório
- ✅ Headers de segurança

## 📈 Performance

- ✅ Lazy loading
- ✅ Compressão gzip
- ✅ Cache de assets
- ✅ Otimização de imagens
- ✅ Minificação de recursos

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

## 📦 Deploy

### Produção
```bash
# Build da aplicação
npm run build

# Deploy automatizado
npm run deploy
```

### Ambientes Suportados
- ✅ Heroku
- ✅ AWS
- ✅ Vercel (Frontend)
- ✅ DigitalOcean

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

- **Website**: [cvsemfrescura.com](https://cvsemfrescura.com)
- **Email**: contato@cvsemfrescura.com
- **LinkedIn**: [CV Sem Frescura](https://linkedin.com/company/cv-sem-frescura)

---

<div align="center">
  <strong>Desenvolvido com ❤️ para ajudar profissionais a conquistarem suas vagas dos sonhos</strong>
</div> 