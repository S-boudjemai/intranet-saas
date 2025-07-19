# 🚀 CHECKLIST PRODUCTION V0.1 - INTERNET SAAS

## ✅ SÉCURISÉ POUR 5 TENANTS

### Configuration Base ✅
- [x] `synchronize: false` en production (app.module.ts:76)
- [x] JWT_SECRET sécurisé 64 chars
- [x] Logs sensibles conditionnels (NODE_ENV)
- [x] Rate limiting 100 req/min configuré
- [x] CORS & CSP headers sécurisés

## 🔧 ÉTAPES DÉPLOIEMENT DÉTAILLÉES

### 1. Infrastructure Required 🏗️

#### **Serveur Production**
```bash
# Spécifications minimales
- CPU: 2 vCPU
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+
- Node.js: 18+ 
- PostgreSQL: 14+
- Nginx: 1.18+
```

#### **Services Externes**
```bash
# PostgreSQL Database
- Provider: AWS RDS / Digital Ocean / self-hosted
- Instance: db.t3.medium (2 vCPU, 4GB RAM)
- Storage: 100GB GP2 SSD
- Backup: Automated daily

# AWS S3 Bucket
- Region: us-east-1 (ou proche users)
- Versioning: Enabled
- Public access: Blocked (URLs présignées)
- CORS: Configured for domain

# Email SMTP
- Provider: Gmail App Password / SendGrid / AWS SES
- Port: 587 (TLS)
- Authentication: Required
```

### 2. Variables Environnement Production 🔐

#### **Backend (.env.production)**
```env
# CRITICAL - NE PAS COMMITTER CE FICHIER
NODE_ENV=production

# Database Production
DB_HOST=your-production-db-host.amazonaws.com
DB_PORT=5432
DB_USER=internet_saas_user
DB_PASS=ULTRA_SECURE_DB_PASSWORD_32_CHARS_MIN
DB_NAME=internet_saas_prod

# JWT Secrets (GARDER CEUX EXISTANTS - NE PAS CHANGER)
JWT_SECRET=7c5ad9d9322496f38b0e0de7de12fb765f3069236be610a64f7a73ef4b60596d
JWT_REFRESH_SECRET=de9f9e89123e599b7c2aba788543163e72b6733bf3575957313218d4300d6aab

# AWS S3 Production
AWS_ACCESS_KEY_ID=AKIA...YOUR_PROD_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_PROD_SECRET_KEY_40_CHARS
AWS_REGION=us-east-1
AWS_S3_BUCKET=internet-saas-prod-files

# Mail Production
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=YOUR_GMAIL_APP_PASSWORD
MAIL_FROM="Plateforme Franchise <noreply@yourdomain.com>"

# URLs
FRONTEND_URL=https://yourdomain.com
```

#### **Frontend (.env.production)**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME="Plateforme Franchise"
VITE_APP_VERSION="0.1.0"
```

### 3. Configuration Serveur 🖥️

#### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/internet-saas
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend React
    root /var/www/internet-saas/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Backend NestJS
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **SSL Certificate (Let's Encrypt)**
```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Générer certificat
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Deployment Process 🚀

#### **Script de Déploiement**
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Déploiement Internet SAAS v0.1..."

# 1. Backup database
echo "📦 Backup database..."
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest code
echo "📥 Pull latest code..."
git pull origin main

# 3. Install dependencies
echo "📦 Install dependencies..."
cd backend && npm ci --production
cd ../frontend && npm ci

# 4. Build applications
echo "🏗️ Build applications..."
cd ../backend && npm run build
cd ../frontend && npm run build

# 5. Restart services
echo "🔄 Restart services..."
pm2 restart internet-saas-backend
sudo systemctl reload nginx

echo "✅ Déploiement terminé!"
```

#### **Process Manager (PM2)**
```bash
# Installation PM2
npm install -g pm2

# Configuration ecosystem
# ecosystem.config.js
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
    error_file: '/var/log/pm2/internet-saas-error.log',
    out_file: '/var/log/pm2/internet-saas-out.log',
    log_file: '/var/log/pm2/internet-saas-combined.log'
  }]
};

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Tests Production ✅
- [ ] **Smoke Tests**
  - [ ] Page d'accueil accessible (https://yourdomain.com)
  - [ ] API health check (https://api.yourdomain.com/health)
  - [ ] SSL certificate valide (A+ rating)
  
- [ ] **Functional Tests**
  - [ ] Inscription nouveau tenant
  - [ ] Connexion/déconnexion tous rôles
  - [ ] Upload document S3 + prévisualisation
  - [ ] Création ticket avec image
  - [ ] Audit complet + actions correctives
  
- [ ] **Mobile Tests**
  - [ ] Navigation responsive
  - [ ] Installation PWA native
  - [ ] Fonctionnalités offline basiques

### Monitoring Production 📊

#### **UptimeRobot (Gratuit)**
```bash
# Monitors à configurer
- https://yourdomain.com (HTTP 200)
- https://api.yourdomain.com/health (HTTP 200)
- Base de données (TCP 5432)

# Notifications
- Email: admin@yourdomain.com
- Slack: #alerts (si configuré)
```

#### **Logs Centralisés**
```bash
# Logrotate configuration
# /etc/logrotate.d/internet-saas
/var/log/pm2/internet-saas-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### **Database Backup Automatique**
```bash
# Script backup quotidien
# /opt/scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="internet_saas_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$FILENAME.gz

# Nettoyer backups > 7 jours
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Crontab
# 0 2 * * * /opt/scripts/backup-db.sh
```

## ⚠️ LIMITATIONS V0.1

### Capacités Garanties
- 👥 5 tenants maximum initiaux
- 📱 50 utilisateurs simultanés peak
- 📄 100 uploads/jour par tenant
- ⏱️ Temps réponse 2-5s acceptable

### Monitoring Requis
- [ ] Weekly: Vérifier logs erreurs
- [ ] Weekly: Backup verification
- [ ] Monthly: Performance review
- [ ] Monthly: User feedback collection

## 🎯 ROADMAP POST-V0.1

### v0.2 (Mois 3) - Performance
- [ ] Pagination APIs
- [ ] Code splitting frontend
- [ ] Cache Redis basique
- [ ] Index database critiques

### v0.3 (Mois 4) - Scale
- [ ] 20+ tenants support
- [ ] Monitoring APM
- [ ] Error tracking (Sentry)
- [ ] CDN assets statiques

### v1.0 (Mois 6) - Enterprise
- [ ] 50+ tenants
- [ ] Microservices split
- [ ] Multi-region
- [ ] SLA 99.9% uptime

---
**STATUT:** ✅ PRÊT POUR PRODUCTION V0.1
**DATE:** $(date)
**RESPONSABLE:** Sofiane