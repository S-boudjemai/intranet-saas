# 🚀 GUIDE DÉPLOIEMENT COMPLET - INTERNET SAAS V0.1

## 📋 PRÉ-REQUIS AVANT DÉPLOIEMENT

### Infrastructure Minimale Required
- **Serveur VPS** : 2 vCPU, 4GB RAM, 50GB SSD
- **Database** : PostgreSQL 14+ (AWS RDS recommandé)
- **Storage** : AWS S3 bucket configuré
- **Domain** : yourdomain.com + api.yourdomain.com
- **Email** : SMTP configuré (Gmail App Password)

### Coûts Estimés Mensuels
- **VPS** : €20-40/mois (DigitalOcean/Hetzner)
- **Database RDS** : €50-80/mois (t3.medium)
- **S3 Storage** : €5-15/mois (100GB + requêtes)
- **Domain** : €10-15/an
- **Total** : **~€80-140/mois** pour 5-10 tenants

## 🔧 ÉTAPE 1 - PRÉPARATION SERVEUR

### Installation Dependencies
```bash
# Update système
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globalement
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL client (si base externe)
sudo apt install postgresql-client -y

# Install Git
sudo apt install git -y

# Install Certbot pour SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Configuration Utilisateur
```bash
# Créer utilisateur deploy
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy

# Setup SSH keys
mkdir ~/.ssh
chmod 700 ~/.ssh
# Copier votre clé publique dans ~/.ssh/authorized_keys
```

## 🗄️ ÉTAPE 2 - SETUP DATABASE

### Option A : AWS RDS (Recommandé Production)
```bash
# 1. Créer instance RDS PostgreSQL 14
# - Instance type: db.t3.medium
# - Storage: 100GB GP2 SSD
# - Multi-AZ: Non (pour économiser, activable plus tard)
# - Backup: 7 jours rétention
# - Security Group: PostgreSQL port 5432

# 2. Créer database
psql -h your-rds-endpoint.amazonaws.com -U postgres
CREATE DATABASE internet_saas_prod;
CREATE USER internet_saas_user WITH PASSWORD 'SECURE_PASSWORD_32_CHARS_MIN';
GRANT ALL PRIVILEGES ON DATABASE internet_saas_prod TO internet_saas_user;
```

### Option B : PostgreSQL Self-Hosted
```bash
# Installation PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configuration
sudo -u postgres psql
CREATE DATABASE internet_saas_prod;
CREATE USER internet_saas_user WITH PASSWORD 'SECURE_PASSWORD_32_CHARS_MIN';
GRANT ALL PRIVILEGES ON DATABASE internet_saas_prod TO internet_saas_user;

# Configuration connexions externes (si nécessaire)
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

## 🪣 ÉTAPE 3 - SETUP AWS S3

### Création Bucket S3
```bash
# 1. Via AWS Console ou CLI
aws s3 mb s3://internet-saas-prod-files --region us-east-1

# 2. Configuration CORS
aws s3api put-bucket-cors --bucket internet-saas-prod-files --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": []
    }
  ]
}'

# 3. Bloquer accès public
aws s3api put-public-access-block --bucket internet-saas-prod-files --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Créer IAM User
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::internet-saas-prod-files/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::internet-saas-prod-files"
        }
    ]
}
```

## 📧 ÉTAPE 4 - SETUP EMAIL SMTP

### Option A : Gmail App Password
```bash
# 1. Activer 2FA sur compte Gmail
# 2. Générer App Password
# - Google Account → Security → App passwords
# - Sélectionner "Mail" et générer password

# Variables env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=generated_app_password_16_chars
```

### Option B : SendGrid (Scalable)
```bash
# 1. Créer compte SendGrid
# 2. Générer API Key
# 3. Configurer

MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=your_sendgrid_api_key
```

## 🚀 ÉTAPE 5 - DÉPLOIEMENT APPLICATION

### Clone Repository
```bash
# Cloner code source
cd /var/www
sudo git clone https://github.com/votre-repo/internet-saas.git
sudo chown -R deploy:deploy internet-saas
cd internet-saas
```

### Configuration Backend
```bash
cd backend

# Copier et configurer .env.production
cp .env.production.example .env.production
nano .env.production

# Variables critiques à configurer :
NODE_ENV=production
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=internet_saas_user
DB_PASS=VOTRE_MOT_DE_PASSE_SECURISE
DB_NAME=internet_saas_prod
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=internet-saas-prod-files
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=your_app_password
FRONTEND_URL=https://yourdomain.com

# Install & Build
npm ci --production
npm run build
```

### Configuration Frontend  
```bash
cd ../frontend

# Configurer variables production
nano .env.production
# VITE_API_URL=https://api.yourdomain.com

# Install & Build
npm ci
npm run build
```

### Setup PM2 Process Manager
```bash
cd ../backend

# Créer ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'internet-saas-backend',
    script: 'dist/main.js',
    cwd: '/var/www/internet-saas/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    error_file: '/var/log/pm2/internet-saas-error.log',
    out_file: '/var/log/pm2/internet-saas-out.log',
    log_file: '/var/log/pm2/internet-saas-combined.log',
    time: true
  }]
};
EOF

# Démarrer application
pm2 start ecosystem.config.js
pm2 save
pm2 startup # Suivre instructions pour auto-start
```

## 🌐 ÉTAPE 6 - CONFIGURATION NGINX

### Configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/internet-saas
```

```nginx
# Configuration complète Nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration (sera généré par Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend React
    root /var/www/internet-saas/frontend/dist;
    index index.html;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint sans rate limiting
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Activer Configuration
```bash
# Activer site
sudo ln -s /etc/nginx/sites-available/internet-saas /etc/nginx/sites-enabled/

# Tester configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

## 🔒 ÉTAPE 7 - SSL CERTIFICATE

### Installation SSL avec Let's Encrypt
```bash
# Générer certificats SSL
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Tester renouvellement automatique
sudo certbot renew --dry-run

# Setup auto-renewal cron
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 🧪 ÉTAPE 8 - TESTS PRODUCTION

### Tests Automatisés
```bash
# Créer script de test
cat > /var/www/internet-saas/test-production.sh << 'EOF'
#!/bin/bash

echo "🧪 Tests Production Internet SAAS..."

# Test 1: Frontend accessible
echo "Test 1: Frontend..."
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com | grep -q "200" && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

# Test 2: API Health
echo "Test 2: API Health..."
curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health | grep -q "200" && echo "✅ API OK" || echo "❌ API FAIL"

# Test 3: Database connexion
echo "Test 3: Database..."
pg_isready -h $DB_HOST -p 5432 -U $DB_USER && echo "✅ Database OK" || echo "❌ Database FAIL"

# Test 4: SSL Certificate
echo "Test 4: SSL..."
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep -q "After" && echo "✅ SSL OK" || echo "❌ SSL FAIL"

echo "🏁 Tests terminés!"
EOF

chmod +x /var/www/internet-saas/test-production.sh
./test-production.sh
```

### Tests Manuels
- [ ] Navigation sur https://yourdomain.com
- [ ] Inscription nouveau tenant
- [ ] Login avec différents rôles
- [ ] Upload document + prévisualisation
- [ ] Création ticket avec image
- [ ] Installation PWA mobile
- [ ] Tests responsive mobile

## 📊 ÉTAPE 9 - MONITORING SETUP

### UptimeRobot (Gratuit)
1. Créer compte sur uptimerobot.com
2. Ajouter monitors :
   - **HTTP** : https://yourdomain.com (toutes les 5 min)
   - **HTTP** : https://api.yourdomain.com/health (toutes les 5 min)
   - **Port** : Database port 5432 (si accessible)

### Logs Monitoring
```bash
# Setup logrotate
sudo nano /etc/logrotate.d/internet-saas

/var/log/pm2/internet-saas-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}

# Test logrotate
sudo logrotate -d /etc/logrotate.d/internet-saas
```

### Database Backup
```bash
# Créer script backup
sudo mkdir -p /opt/scripts
sudo nano /opt/scripts/backup-db.sh

#!/bin/bash
export DB_HOST="your-db-host"
export DB_USER="internet_saas_user"
export DB_NAME="internet_saas_prod"
export PGPASSWORD="your-db-password"

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="internet_saas_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$FILENAME.gz

# Nettoyer backups > 7 jours
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME.gz"

# Rendre exécutable
sudo chmod +x /opt/scripts/backup-db.sh

# Ajouter au crontab
sudo crontab -e
# 0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

## 🎯 ÉTAPE 10 - GO LIVE CHECKLIST

### Final Checklist
- [ ] ✅ **Infrastructure** : Serveur + DB + S3 configurés
- [ ] ✅ **Application** : Backend + Frontend buildés et déployés
- [ ] ✅ **SSL** : Certificats Let's Encrypt actifs
- [ ] ✅ **DNS** : Domaines pointent vers serveur
- [ ] ✅ **Monitoring** : UptimeRobot + logs configurés
- [ ] ✅ **Backup** : Database backup automatique
- [ ] ✅ **Tests** : Tous tests manuels passent
- [ ] ✅ **Performance** : Load time <5s acceptable
- [ ] ✅ **Security** : Headers, HTTPS, rate limiting actifs

### Post-Launch (24h)
- [ ] Surveiller logs erreurs
- [ ] Vérifier métriques UptimeRobot
- [ ] Tester depuis différents appareils/navigateurs
- [ ] Backup database verification
- [ ] Performance monitoring

### Success Metrics v0.1
- **Uptime** : >95%
- **Response time** : <5s
- **Error rate** : <1%
- **User satisfaction** : >3.5/5

## 🚀 FÉLICITATIONS !

Votre **Internet SAAS v0.1** est maintenant **EN PRODUCTION** !

- ✅ **Capacité** : 5-10 tenants, 50-100 utilisateurs
- ✅ **Performance** : Acceptable pour MVP
- ✅ **Sécurité** : Production-ready
- ✅ **Monitoring** : Basique mais fonctionnel
- ✅ **Backup** : Automatique quotidien

**Prochaines étapes** : Collecte feedback utilisateurs pour roadmap v0.2 !