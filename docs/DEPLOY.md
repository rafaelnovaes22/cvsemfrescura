# 🚀 Deploy em Produção - CV Sem Frescura

## 📋 Pré-requisitos

### 🖥️ Servidor
- **VPS/Cloud Instance** com mínimo 2GB RAM, 2 CPU cores, 20GB SSD
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 8+
- **Docker** e **Docker Compose** instalados
- **Domínio** apontando para o servidor (ex: cvsemfrescura.com.br)

### 🔑 Chaves e Configurações
- **Chaves Stripe** (live)
- **API Key OpenAI** 
- **Certificado SSL** (Let's Encrypt recomendado)
- **Backup strategy** configurada

## 🛠️ Passo a Passo

### 1. 📦 Preparação do Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. 🔐 Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot

# Obter certificado
sudo certbot certonly --standalone -d cvsemfrescura.com.br -d www.cvsemfrescura.com.br

# Copiar certificados para pasta ssl/
sudo mkdir -p /path/to/project/ssl
sudo cp /etc/letsencrypt/live/cvsemfrescura.com.br/fullchain.pem /path/to/project/ssl/
sudo cp /etc/letsencrypt/live/cvsemfrescura.com.br/privkey.pem /path/to/project/ssl/
```

### 3. ⚙️ Configurar Variáveis de Ambiente

```bash
# Copiar template
cp env.production.example .env

# Editar variáveis (IMPORTANTE!)
nano .env
```

**Variáveis obrigatórias:**
```env
NODE_ENV=production
DB_PASSWORD=senha_super_segura_aqui
JWT_SECRET=chave_jwt_256_bits_minimo
STRIPE_SECRET_KEY=sk_live_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
OPENAI_API_KEY=sk-sua_chave_openai_aqui
FRONTEND_URL=https://cvsemfrescura.com.br
```

### 4. 🚀 Deploy

```bash
# Executar script de deploy
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## 🔍 Verificação

### ✅ Health Checks
```bash
# Verificar containers
docker compose -f docker-compose.prod.yml ps

# Verificar logs
docker compose -f docker-compose.prod.yml logs -f

# Testar API
curl https://cvsemfrescura.com.br/health
curl https://cvsemfrescura.com.br/api/config/stripe-key
```

### 📊 Monitoramento
```bash
# Verificar recursos
docker stats

# Verificar logs em tempo real
docker compose -f docker-compose.prod.yml logs -f backend

# Verificar espaço em disco
df -h
```

## 🔄 Atualizações

### Deploy de nova versão:
```bash
# Puxar código novo
git pull origin main

# Deploy
./scripts/deploy-production.sh
```

### Rollback rápido:
```bash
# Parar produção
docker compose -f docker-compose.prod.yml down

# Voltar versão anterior
git checkout HEAD~1

# Deploy versão anterior
./scripts/deploy-production.sh
```

## 💾 Backup

### Backup automático do banco:
```bash
# Adicionar ao crontab
0 2 * * * /path/to/project/scripts/backup-db.sh
```

### Backup manual:
```bash
# Backup do banco
docker exec cv_postgres_prod pg_dump -U cvuser_prod cv_sem_frescura_prod > backup-$(date +%Y%m%d).sql

# Backup dos volumes
docker run --rm -v postgres_data_prod:/data -v $(pwd)/backups:/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 🚨 Troubleshooting

### Container não sobe:
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs backend

# Verificar configurações
docker compose -f docker-compose.prod.yml config
```

### Problema de SSL:
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew --dry-run
```

### Banco de dados:
```bash
# Conectar ao banco
docker exec -it cv_postgres_prod psql -U cvuser_prod -d cv_sem_frescura_prod

# Verificar status
docker exec cv_postgres_prod pg_isready
```

## 📈 Performance

### Otimizações recomendadas:
- **CDN**: Cloudflare para assets estáticos
- **Cache**: Redis para sessions e cache de API
- **Database**: Índices otimizados
- **Monitoring**: New Relic, DataDog ou Grafana

### Escalabilidade:
- **Load Balancer**: Nginx proxy para múltiplas instâncias
- **Database**: PostgreSQL com read replicas
- **Storage**: AWS S3 para uploads de arquivos

## 🔒 Segurança

### Checklist de segurança:
- [ ] Firewall configurado (apenas 22, 80, 443)
- [ ] SSL/TLS configurado
- [ ] Variáveis de ambiente seguras
- [ ] Rate limiting ativo
- [ ] Headers de segurança configurados
- [ ] Backup automático ativo
- [ ] Logs de auditoria configurados

## 💰 Custos Estimados

### **Infraestrutura Mínima:**
- **VPS 2GB RAM**: ~$20/mês
- **Domínio**: ~$15/ano
- **Certificado SSL**: Gratuito (Let's Encrypt)
- **Total**: ~$35/mês

### **Infraestrutura Recomendada:**
- **VPS 4GB RAM**: ~$40/mês
- **CDN**: ~$10/mês
- **Backup**: ~$5/mês
- **Monitoring**: ~$15/mês
- **Total**: ~$85/mês 