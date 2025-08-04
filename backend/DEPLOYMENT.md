# Guide de Déploiement Backend - FranchiseDesk

## 🚨 Configuration Base de Données - IMPORTANT

### Développement Local
En développement, l'application utilise les variables individuelles :
- `DB_HOST=192.168.1.77` (Raspberry Pi)
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASS=motdepasse`
- `DB_NAME=internet_saas`

### Production (Render)
En production, l'application **EXIGE** la variable `DATABASE_URL` :
- ✅ `DATABASE_URL=postgresql://user:pass@host:port/dbname`
- ❌ Les variables DB_* individuelles sont IGNORÉES en production

## 📋 Checklist Déploiement Render

1. **Variables d'Environnement Obligatoires** :
   ```env
   NODE_ENV=production
   DATABASE_URL=<fourni automatiquement par Render>
   JWT_SECRET=<64 caractères>
   JWT_REFRESH_SECRET=<64 caractères>
   
   # AWS S3
   AWS_ACCESS_KEY_ID=<votre clé>
   AWS_SECRET_ACCESS_KEY=<votre secret>
   AWS_S3_BUCKET=<votre bucket>
   AWS_REGION=us-east-1
   
   # Email
   MAIL_HOST=<smtp provider>
   MAIL_PORT=587
   MAIL_USER=<user>
   MAIL_PASS=<pass>
   MAIL_FROM="FranchiseDesk <no-reply@franchisedesk.com>"
   
   # OneSignal
   ONESIGNAL_APP_ID=<app id>
   ONESIGNAL_API_KEY=<api key>
   
   # Frontend
   FRONTEND_URL=https://intranet-saas.vercel.app
   ```

2. **Ne PAS définir en production** :
   - ❌ DB_HOST
   - ❌ DB_PORT  
   - ❌ DB_USER
   - ❌ DB_PASS
   - ❌ DB_NAME

3. **Build Command** : `npm run build`
4. **Start Command** : `npm run start:prod`

## 🔍 Débugger les Erreurs 500

Si vous avez des erreurs 500 en production :

1. Vérifiez les logs Render :
   ```bash
   # Dans le dashboard Render, onglet "Logs"
   # Cherchez : "DATABASE_URL is required in production"
   ```

2. Vérifiez que `DATABASE_URL` est bien définie :
   - Dashboard Render → Service → Environment
   - La variable doit être présente et non vide

3. Si l'erreur persiste, vérifiez :
   - `NODE_ENV=production` est bien défini
   - Pas de variables DB_* individuelles en production
   - SSL est activé pour PostgreSQL

## 🛠️ Migration Base de Données

En production, les migrations doivent être exécutées manuellement :

```bash
# Se connecter au shell Render
npm run migration:run
```

## 🚀 Rollback en Cas de Problème

Si la nouvelle configuration cause des problèmes :
1. Render garde automatiquement les anciennes versions
2. Dashboard → Deploy History → Rollback to previous deploy