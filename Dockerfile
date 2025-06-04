# 🚀 Dockerfile para Railway - CV Sem Frescura (Backend + Static Frontend)
FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl bash

# Configurar diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro para cache das dependências
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copiar todo o projeto mantendo a estrutura
COPY . .

# Verificar se os arquivos estão na estrutura correta
RUN ls -la /app/
RUN ls -la /app/backend/
RUN ls -la /app/backend/config/
RUN ls -la /app/backend/controllers/

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE $PORT

# Healthcheck - ajustar para o contexto correto
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# MANTER workdir em /app e executar o backend com caminho completo
WORKDIR /app
CMD ["node", "backend/server.js"] 