#!/bin/bash

# 🚨 Setup de Backup de Emergência
# Para produção AMANHÃ

echo "💾 Configurando backup automatizado..."

# 1. CRIAR DIRETÓRIO DE BACKUP
echo "📁 Criando estrutura de backup..."
mkdir -p backups/{daily,weekly,monthly}
mkdir -p logs

# 2. SCRIPT DE BACKUP COMPLETO
echo "📦 Criando script de backup..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup completo do CV Sem Frescura
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="logs/backup.log"

echo "$(date): 💾 Iniciando backup..." >> $LOG_FILE

# 1. BACKUP DO BANCO DE DADOS
echo "$(date): 📊 Backup do banco PostgreSQL..." >> $LOG_FILE
docker exec cv_postgres_prod pg_dump -U cvuser_prod cv_sem_frescura_prod > $BACKUP_DIR/daily/db_backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "$(date): ✅ Backup do banco concluído" >> $LOG_FILE
    gzip $BACKUP_DIR/daily/db_backup_$DATE.sql
else
    echo "$(date): ❌ Falha no backup do banco" >> $LOG_FILE
fi

# 2. BACKUP DOS VOLUMES DOCKER
echo "$(date): 📦 Backup dos volumes Docker..." >> $LOG_FILE
docker run --rm \
    -v postgres_data_prod:/data \
    -v $(pwd)/$BACKUP_DIR/daily:/backup \
    alpine:latest \
    tar czf /backup/volumes_backup_$DATE.tar.gz -C /data .

if [ $? -eq 0 ]; then
    echo "$(date): ✅ Backup dos volumes concluído" >> $LOG_FILE
else
    echo "$(date): ❌ Falha no backup dos volumes" >> $LOG_FILE
fi

# 3. BACKUP DOS ARQUIVOS DE CONFIGURAÇÃO
echo "$(date): ⚙️ Backup das configurações..." >> $LOG_FILE
tar czf $BACKUP_DIR/daily/config_backup_$DATE.tar.gz \
    .env.production \
    docker-compose.prod.yml \
    frontend/nginx.emergency.conf \
    scripts/ \
    --exclude=scripts/node_modules

if [ $? -eq 0 ]; then
    echo "$(date): ✅ Backup das configurações concluído" >> $LOG_FILE
else
    echo "$(date): ❌ Falha no backup das configurações" >> $LOG_FILE
fi

# 4. LIMPEZA DE BACKUPS ANTIGOS (manter 7 dias)
echo "$(date): 🧹 Limpando backups antigos..." >> $LOG_FILE
find $BACKUP_DIR/daily -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR/daily -name "*.tar.gz" -mtime +7 -delete

# 5. BACKUP SEMANAL (domingos)
if [ $(date +%u) -eq 7 ]; then
    echo "$(date): 📅 Criando backup semanal..." >> $LOG_FILE
    cp $BACKUP_DIR/daily/db_backup_$DATE.sql.gz $BACKUP_DIR/weekly/
    cp $BACKUP_DIR/daily/volumes_backup_$DATE.tar.gz $BACKUP_DIR/weekly/
    cp $BACKUP_DIR/daily/config_backup_$DATE.tar.gz $BACKUP_DIR/weekly/
    
    # Limpar backups semanais antigos (manter 4 semanas)
    find $BACKUP_DIR/weekly -name "*.gz" -mtime +28 -delete
fi

# 6. BACKUP MENSAL (dia 1)
if [ $(date +%d) -eq 01 ]; then
    echo "$(date): 📆 Criando backup mensal..." >> $LOG_FILE
    cp $BACKUP_DIR/daily/db_backup_$DATE.sql.gz $BACKUP_DIR/monthly/
    cp $BACKUP_DIR/daily/volumes_backup_$DATE.tar.gz $BACKUP_DIR/monthly/
    cp $BACKUP_DIR/daily/config_backup_$DATE.tar.gz $BACKUP_DIR/monthly/
    
    # Limpar backups mensais antigos (manter 6 meses)
    find $BACKUP_DIR/monthly -name "*.gz" -mtime +180 -delete
fi

# 7. VERIFICAR TAMANHO DOS BACKUPS
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo "$(date): 📏 Tamanho total dos backups: $BACKUP_SIZE" >> $LOG_FILE

echo "$(date): ✅ Backup concluído!" >> $LOG_FILE
EOF

chmod +x scripts/backup.sh

# 3. SCRIPT DE RESTORE
echo "🔄 Criando script de restore..."
cat > scripts/restore.sh << 'EOF'
#!/bin/bash

# Script de restore para CV Sem Frescura
echo "🔄 RESTORE DO CV SEM FRESCURA"
echo "=============================="

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
echo ""
echo "DIÁRIOS:"
ls -la backups/daily/*.sql.gz 2>/dev/null | tail -5
echo ""
echo "SEMANAIS:"
ls -la backups/weekly/*.sql.gz 2>/dev/null | tail -3
echo ""
echo "MENSAIS:"
ls -la backups/monthly/*.sql.gz 2>/dev/null | tail -3
echo ""

read -p "Digite o nome do arquivo de backup do banco (ex: db_backup_20241201_120000.sql.gz): " BACKUP_FILE

if [ ! -f "backups/daily/$BACKUP_FILE" ] && [ ! -f "backups/weekly/$BACKUP_FILE" ] && [ ! -f "backups/monthly/$BACKUP_FILE" ]; then
    echo "❌ Arquivo de backup não encontrado!"
    exit 1
fi

# Encontrar o arquivo
BACKUP_PATH=""
for dir in daily weekly monthly; do
    if [ -f "backups/$dir/$BACKUP_FILE" ]; then
        BACKUP_PATH="backups/$dir/$BACKUP_FILE"
        break
    fi
done

echo "⚠️ ATENÇÃO: Este processo irá SUBSTITUIR o banco atual!"
read -p "Tem certeza? (digite 'CONFIRMO' para continuar): " CONFIRM

if [ "$CONFIRM" != "CONFIRMO" ]; then
    echo "❌ Restore cancelado"
    exit 1
fi

echo "🛑 Parando aplicação..."
docker compose -f docker-compose.prod.yml down

echo "🗄️ Restaurando banco de dados..."
gunzip -c $BACKUP_PATH | docker exec -i cv_postgres_prod psql -U cvuser_prod -d cv_sem_frescura_prod

if [ $? -eq 0 ]; then
    echo "✅ Restore concluído!"
    echo "🚀 Reiniciando aplicação..."
    docker compose -f docker-compose.prod.yml up -d
    echo "✅ Aplicação reiniciada!"
else
    echo "❌ Falha no restore!"
    exit 1
fi
EOF

chmod +x scripts/restore.sh

# 4. CONFIGURAR CRON JOB PARA BACKUP
echo "⏰ Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh") | crontab -

# 5. TESTE DE BACKUP
echo "🧪 Executando teste de backup..."
./scripts/backup.sh

# 6. CONFIGURAR UPLOAD PARA CLOUD (OPCIONAL)
echo "☁️ Configuração de backup na nuvem..."
read -p "Deseja configurar backup para AWS S3? (y/N): " SETUP_S3

if [[ $SETUP_S3 =~ ^[Yy]$ ]]; then
    echo "📦 Instalando AWS CLI..."
    sudo apt-get install -y awscli
    
    echo "🔑 Configure suas credenciais AWS:"
    aws configure
    
    read -p "Digite o nome do bucket S3: " S3_BUCKET
    
    # Adicionar upload S3 ao script de backup
    cat >> scripts/backup.sh << EOF

# UPLOAD PARA S3
echo "\$(date): ☁️ Enviando backup para S3..." >> \$LOG_FILE
aws s3 cp \$BACKUP_DIR/daily/db_backup_\$DATE.sql.gz s3://$S3_BUCKET/cv-sem-frescura/daily/
aws s3 cp \$BACKUP_DIR/daily/volumes_backup_\$DATE.tar.gz s3://$S3_BUCKET/cv-sem-frescura/daily/
aws s3 cp \$BACKUP_DIR/daily/config_backup_\$DATE.tar.gz s3://$S3_BUCKET/cv-sem-frescura/daily/

if [ \$? -eq 0 ]; then
    echo "\$(date): ✅ Upload para S3 concluído" >> \$LOG_FILE
else
    echo "\$(date): ❌ Falha no upload para S3" >> \$LOG_FILE
fi
EOF
    
    echo "✅ Backup S3 configurado!"
else
    echo "⚠️ Backup S3 pulado - configure depois se necessário"
fi

echo "✅ Backup automatizado configurado!"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "💾 Backup manual: ./scripts/backup.sh"
echo "🔄 Restore: ./scripts/restore.sh"
echo "📊 Ver logs: tail -f logs/backup.log"
echo "📁 Ver backups: ls -la backups/daily/"
EOF 