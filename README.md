# Sistema ATS - Análise Inteligente de Currículos

Sistema completo de análise de currículos utilizando inteligência artificial, desenvolvido com Node.js e integração OpenAI para otimização de processos de recrutamento.

## 🚀 Funcionalidades Principais

- **Análise Inteligente**: Processamento de currículos em PDF/DOC com IA
- **Sistema ATS**: Compatibilidade e otimização para sistemas de rastreamento
- **Dashboard Administrativo**: Interface completa para gestão
- **Sistema de Pagamentos**: Integração com Stripe
- **Autenticação Segura**: JWT com criptografia avançada
- **API RESTful**: Endpoints documentados e seguros

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + **Express.js**
- **Sequelize ORM** (SQLite/PostgreSQL)
- **OpenAI API** para análise de texto
- **Stripe** para processamento de pagamentos
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **Winston** para logging

### Frontend
- **HTML5/CSS3/JavaScript** (Vanilla)
- **Design Responsivo**
- **PWA** (Progressive Web App)
- **Service Worker** para cache

### DevOps & Infraestrutura
- **Docker** com multi-stage builds
- **Railway** para deploy em produção
- **Nginx** como proxy reverso
- **GitHub Actions** para CI/CD

## 📁 Estrutura do Projeto

```
├── backend/
│   ├── controllers/     # Controladores da API
│   ├── models/         # Modelos do banco de dados
│   ├── routes/         # Rotas da API
│   ├── services/       # Lógica de negócio
│   ├── utils/          # Utilitários e middlewares
│   ├── config/         # Configurações
│   └── migrations/     # Migrations do banco
├── frontend/
│   ├── assets/         # CSS, JS e imagens
│   ├── *.html          # Páginas da aplicação
│   └── manifest.json   # Configuração PWA
├── docs/               # Documentação do projeto
├── scripts/            # Scripts de deploy e automação
└── tests/              # Testes automatizados
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- SQLite3 ou PostgreSQL
- Conta OpenAI com API key
- Conta Stripe (para pagamentos)

### Instalação Local

```bash
# Clone o repositório
git clone [url-do-repositorio]
cd repository

# Instale as dependências do backend
cd backend
npm install

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações
npm run migrate

# Inicie o servidor
npm start
```

### Docker

```bash
# Build e execução com Docker Compose
docker-compose up --build
```

## 🚀 Deploy em Produção

O projeto está configurado para deploy automático no Railway:

```bash
# Deploy via Railway CLI
railway deploy
```

Consulte `docs/deployment/` para instruções detalhadas.

## 📋 Principais Endpoints da API

```
POST /api/auth/login       # Autenticação de usuário
POST /api/auth/register    # Registro de novo usuário
POST /api/analysis/upload  # Upload e análise de currículo
GET  /api/analysis/history # Histórico de análises
POST /api/payment/create   # Criar sessão de pagamento
GET  /api/admin/users      # Gestão de usuários (admin)
```

## 🔐 Segurança

- Criptografia AES-256 para dados sensíveis
- Validação e sanitização de inputs
- Rate limiting para APIs
- CORS configurado adequadamente
- Headers de segurança com Helmet
- Logs de auditoria completos

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes específicos
npm run test:api
npm run test:auth
npm run test:integration
```

## 📊 Monitoramento

- Logs estruturados com Winston
- Métricas de performance
- Alertas de erro automáticos
- Dashboard de monitoramento

## 🤝 Contribuição

Este projeto segue as melhores práticas de desenvolvimento:

- Código limpo e bem documentado
- Testes automatizados
- Commits semânticos
- Code review obrigatório
- CI/CD automatizado

## 📄 Licença

MIT

---

**Desenvolvido por:** Rafael de Novaes

**Contato:** rafaeldenovaes@gmail.com

**LinkedIn:** https://www.linkedin.com/in/rafaeldenovaes/
