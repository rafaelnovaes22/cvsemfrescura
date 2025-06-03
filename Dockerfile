# 🚀 Dockerfile para Railway - CV Sem Frescura (Simplificado)
FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Configurar diretório de trabalho
WORKDIR /app

# Copiar todo o projeto
COPY . .

# Dar permissão de execução ao script
RUN chmod +x start-railway.sh

# Instalar dependências do backend
WORKDIR /app/backend
RUN npm install

# Voltar para raiz
WORKDIR /app

# Expor porta
EXPOSE $PORT

# Healthcheck básico
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Iniciar aplicação
CMD ["./start-railway.sh"] 