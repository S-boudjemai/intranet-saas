# 🔄 Guide de Récupération des Données - Internet SAAS

## 📊 **Situation Actuelle**

Votre base de données PostgreSQL sur le Raspberry Pi contient :
- ✅ **Structure complète** : 24 tables avec toutes les colonnes
- ❌ **Données limitées** : Seulement 2 utilisateurs, 1 tenant, 14 announcements
- ❌ **Données manquantes** : restaurants, documents, tickets, plus d'utilisateurs

## 🎯 **Options de Récupération**

### **Option 1 : Récupération depuis votre PC Principal** ⭐ RECOMMANDÉE

#### 🔍 **Localiser vos données**

**Sur votre PC de développement principal :**
```bash
# Rechercher des dumps PostgreSQL
find ~ -name "*.sql" -o -name "*.dump" | grep -i "internet\|saas\|pizza"

# Rechercher dans les dossiers de développement
find ~/dev -name "*.sql" 2>/dev/null
find ~/Documents -name "*.sql" 2>/dev/null
find ~/Desktop -name "*.sql" 2>/dev/null

# Vérifier les bases de données locales
psql -l | grep internet
```

#### 💾 **Créer une sauvegarde depuis votre PC**

```bash
# Si vous avez une DB locale avec vos données
pg_dump -U postgres -d internet_saas > my_complete_data.sql

# Transférer vers le Raspberry Pi
scp my_complete_data.sql pi@192.168.1.77:/home/pi/
```

#### 🔄 **Restaurer sur le Raspberry Pi**

```bash
# Sur le Raspberry Pi
psql -U postgres -d internet_saas < my_complete_data.sql
```

### **Option 2 : Données de Test pour Redémarrer** 🚀

```bash
# Créer des données de test complètes
node create-test-data.js
```

**Cela créera :**
- 5 restaurants (Givors, Lyon, Saint-Étienne, Vienne, Rive-de-Gier)
- 5 utilisateurs avec différents rôles
- 5 catégories de documents
- 8 tags
- 5 documents de test
- 4 tickets de test

### **Option 3 : Restaurer depuis une Sauvegarde** 📁

```bash
# Chercher des sauvegardes
node search-postgres-backups.js

# Restaurer si trouvée
node backup-and-restore.js restore chemin/vers/backup.sql
```

## 🛠️ **Étapes Recommandées**

### **1. Faire une Sauvegarde de Sécurité**
```bash
# Sauvegarder l'état actuel
node backup-and-restore.js backup
```

### **2. Exporter les Données Actuelles**
```bash
# Exporter en SQL pour référence
node backup-and-restore.js export
```

### **3. Choisir votre Option**

#### **Si vous avez vos données sur votre PC :**
1. Créer un dump depuis votre PC
2. Le transférer sur le Raspberry Pi
3. Le restaurer

#### **Si vous voulez redémarrer avec des données de test :**
```bash
node create-test-data.js
```

### **4. Tester votre Application**
```bash
# Relancer le backend
npm run start:dev

# Tester la connexion
curl http://localhost:3000/health
```

## 🔑 **Identifiants de Test**

Après avoir créé les données de test :
- **Admin** : `admin@pizza-lif.com` / `Password123!`
- **Manager** : `manager.givors@pizza-lif.com` / `Password123!`
- **Viewer** : `viewer.givors@pizza-lif.com` / `Password123!`

## 📋 **Scripts Disponibles**

### **Analyse et Diagnostic**
```bash
node analyze-missing-data.js        # Analyser la structure actuelle
node search-postgres-backups.js     # Chercher des sauvegardes
node check-database-data.js         # Vérifier les données existantes
```

### **Création de Données**
```bash
node create-test-data.js            # Créer des données de test complètes
```

### **Sauvegarde et Restauration**
```bash
node backup-and-restore.js backup               # Créer une sauvegarde
node backup-and-restore.js restore <file>       # Restaurer depuis un fichier
node backup-and-restore.js export               # Exporter les données actuelles
```

## 🔄 **Processus de Récupération Automatique**

```bash
#!/bin/bash
# Script complet de récupération

echo "🔄 RÉCUPÉRATION AUTOMATIQUE DES DONNÉES"

# 1. Sauvegarde de sécurité
echo "💾 Création sauvegarde de sécurité..."
node backup-and-restore.js backup

# 2. Recherche de sauvegardes
echo "🔍 Recherche de sauvegardes..."
node search-postgres-backups.js

# 3. Création données de test
echo "🚀 Création données de test..."
node create-test-data.js

# 4. Vérification
echo "✅ Vérification finale..."
node analyze-missing-data.js

echo "🎉 Récupération terminée !"
```

## 📊 **Vérification Post-Récupération**

### **Vérifier les Données**
```bash
node analyze-missing-data.js
```

### **Tester l'API**
```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pizza-lif.com","password":"Password123!"}'
```

### **Tester le Frontend**
```bash
cd ../frontend
npm run dev
```

## 🚨 **En Cas de Problème**

### **Restaurer l'État Initial**
```bash
# Restaurer depuis la sauvegarde de sécurité
node backup-and-restore.js restore backup_internet_saas_[timestamp].sql
```

### **Reinitialiser Complètement**
```bash
# Dropper et recréer la base
psql -U postgres -c "DROP DATABASE IF EXISTS internet_saas;"
psql -U postgres -c "CREATE DATABASE internet_saas;"

# Redémarrer le backend pour recréer les tables
npm run start:dev
```

## 📞 **Support**

Si vous avez des problèmes :
1. Vérifiez les logs PostgreSQL : `tail -f /var/log/postgresql/postgresql-*-main.log`
2. Vérifiez la connexion : `node test-remote-connection.js`
3. Vérifiez les permissions : `psql -U postgres -c "\du"`

---

## 🎯 **Recommandation Finale**

**Pour redémarrer rapidement :**
```bash
# Créer des données de test
node create-test-data.js

# Vérifier
node analyze-missing-data.js

# Démarrer le backend
npm run start:dev
```

**Pour récupérer vos vraies données :**
1. Trouvez votre sauvegarde sur votre PC principal
2. Transférez-la sur le Raspberry Pi
3. Restaurez avec `node backup-and-restore.js restore <file>`