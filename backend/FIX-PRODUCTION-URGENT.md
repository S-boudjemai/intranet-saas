# 🚨 GUIDE D'URGENCE - Correction Production

## Problèmes Identifiés

1. **Column User.name does not exist** - La colonne `name` manque dans la table users
2. **Relation "audit_template_items" does not exist** - Table manquante
3. **Memory usage >90%** - Cause le health check à échouer
4. **PlanningTask join error** - Lié au problème de la colonne name

## Solution Immédiate

### Option 1: Via Migration (Recommandé)

1. Se connecter au shell Render :
```bash
# Dans le dashboard Render → Shell
cd /opt/render/project/src/backend

# Exécuter la migration
npm run migration:run
```

### Option 2: Correction Manuelle SQL

Si la migration échoue, exécuter directement dans PostgreSQL :

```sql
-- 1. Ajouter extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ajouter colonne name à users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name character varying DEFAULT NULL;

-- 3. Créer table audit_template_items
CREATE TABLE IF NOT EXISTS audit_template_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id uuid NOT NULL,
  question text NOT NULL,
  category varchar(100) NOT NULL,
  response_type varchar(20) NOT NULL DEFAULT 'boolean',
  "order" integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT FK_audit_template_items_template 
    FOREIGN KEY (template_id) 
    REFERENCES audit_templates(id) 
    ON DELETE CASCADE
);

-- 4. Créer index pour performances
CREATE INDEX IF NOT EXISTS IDX_audit_template_items_template 
ON audit_template_items (template_id);
```

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