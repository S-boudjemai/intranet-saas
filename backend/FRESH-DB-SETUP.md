# 🚀 Guide Installation Base Fraîche

## Étapes pour la nouvelle base PostgreSQL

### 1. Sur Render - Création Base
1. **Delete** l'ancienne base PostgreSQL
2. **New** → **PostgreSQL**
3. **Name**: `internet-saas-db-v2`
4. **Database**: `internet_saas`
5. **User**: `internet_saas_user`
6. **Region**: Oregon (même que backend)
7. **Create Database**

### 2. Connecter Backend à la Nouvelle Base
1. Copier la nouvelle **DATABASE_URL** 
2. Backend → **Environment** → Modifier `DATABASE_URL`
3. **Save Changes**

### 3. Déploiement Automatique
Le backend va automatiquement :
1. **Se redéployer** (détection changement env)
2. **Exécuter les migrations** (`npm run migration:run`)
3. **Créer toutes les tables** avec le bon schéma
4. **Démarrer proprement** sans erreurs

### 4. Initialisation Optionnelle
Si tu veux des données de test :
```bash
# Dans le shell Render (si disponible) ou via l'API
npm run init:fresh-db
```

Ou utilise la route API existante :
```
POST https://intranet-saas-backend.onrender.com/setup/admin
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

## ✅ Résultat Attendu

Après déploiement :
- ✅ Plus d'erreurs 500
- ✅ Base avec schéma correct (17 tables)
- ✅ Colonnes manquantes ajoutées
- ✅ Relations FK correctes
- ✅ Performance améliorée

## 🎯 Comptes par Défaut (si init executé)
- **Admin Global**: `admin@franchisedesk.com` / `admin123`
- **Manager**: `manager@pizzalif.com` / `manager123`
- **Tenant**: Pizzalif (ID: 1)

## 🔍 Vérification
- Health check: `GET /health` → `{"status":"ok"}`
- Ready check: `GET /health/ready` → `{"status":"ok"}`
- Plus de problèmes de mémoire avec base fraîche