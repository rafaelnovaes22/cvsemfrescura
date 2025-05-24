FROM nginx:alpine

# Copiar arquivos estáticos
COPY . /usr/share/nginx/html/

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando de start
CMD ["nginx", "-g", "daemon off;"] 