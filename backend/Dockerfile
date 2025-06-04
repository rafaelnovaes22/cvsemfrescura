FROM node:18-alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar todo o código fonte, mantendo a estrutura de diretórios
COPY . .

# Verificar se os arquivos foram copiados corretamente
RUN ls -la /app/
RUN ls -la /app/config/
RUN ls -la /app/controllers/

# Garantir que node_modules tenha as permissões corretas
RUN chown -R node:node /app

# Criar usuário não-root e trocar para ele
USER node

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de start
CMD ["npm", "start"] 