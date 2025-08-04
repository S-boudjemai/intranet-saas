# 🚨 GUIDE D'URGENCE - Correction Production

## Problèmes Identifiés

1. **Column User.name does not exist** - La colonne `name` manque dans la table users
2. **Relation "audit_template_items" does not exist** - Table manquante
3. **Memory usage >90%** - Cause le health check à échouer
4. **PlanningTask join error** - Lié au problème de la colonne name

## Solution Immédiate

### ⚠️ ATTENTION: Problème de type détecté
La table `audit_templates` utilise un ID de type INTEGER au lieu de UUID en production.
Cela cause une incompatibilité avec le code qui attend des UUID.

### Option 1: Script SQL Direct (RECOMMANDÉ)

1. Se connecter à la base PostgreSQL Render :
   - Dashboard Render → PostgreSQL → Connect → PSQL Command
   
2. Exécuter le script :
```bash
# Copier et exécuter le contenu de:
scripts/fix-production-manual.sql
```

### Option 2: Via Migration (peut échouer)

1. Se connecter au shell Render :
```bash
# Dans le dashboard Render → Shell
cd /opt/render/project/src/backend

# Exécuter la migration
npm run migration:run
```

### Option 3: Solution Temporaire (Si urgent)

Commenter temporairement les modules problématiques dans `app.module.ts` :
```typescript
// AuditsModule,  // Commenter temporairement
// PlanningModule, // Commenter temporairement
```

Puis redéployer pour avoir au moins le reste de l'app fonctionnel.

### Option 3: Désactiver Temporairement le Module Audits

Si urgent, dans `app.module.ts`, commenter temporairement :
```typescript
// AuditsModule,
// PlanningModule,
```

## Correction du Problème de Mémoire

1. **Redémarrer le service** depuis le dashboard Render
2. **Augmenter les ressources** si possible (upgrade du plan)
3. **Vérifier les fuites mémoire** dans les logs

## Vérification

Après correction, vérifier :
```bash
curl https://intranet-saas-backend.onrender.com/health/ready
```

Devrait retourner : `{"status":"ok",...}`

## Script de Diagnostic

J'ai créé `scripts/check-production-schema.js` pour diagnostiquer :
```bash
node scripts/check-production-schema.js
```