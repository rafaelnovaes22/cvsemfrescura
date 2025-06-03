# 🚀 Dockerfile para Railway - CV Sem Frescura (Backend + Static Frontend)
FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl bash

# Configurar diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro para cache das dependências
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copiar todo o projeto
COPY . .

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE $PORT

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Mudar para diretório do backend e iniciar
WORKDIR /app/backend
CMD ["node", "server.js"] 