# Backend - NestJS API

## 🚀 Vue d'Ensemble

API REST NestJS pour la plateforme de gestion franchiseur-franchisé. Architecture modulaire avec TypeORM, PostgreSQL et authentification JWT.

## 🛠️ Stack Technique

- **NestJS 11** + TypeScript + Node.js
- **Database:** PostgreSQL + TypeORM 0.3
- **Auth:** JWT + Passport + bcrypt
- **Storage:** AWS S3 SDK v3 + URLs présignées
- **Email:** Nodemailer
- **Security:** Helmet + CORS + Rate limiting
- **Logging:** Winston structuré
- **Tests:** Jest

## 🏗️ Architecture Modulaire (17 modules)

### Core Business
- **admin/** - Administration globale multi-tenant
- **auth/** - JWT + rôles + invitations
- **tenants/** - Multi-tenancy + thématisation
- **users/** - Gestion utilisateurs + RBAC
- **restaurant/** - Gestion franchisés

### Features
- **documents/** - Upload S3 + métadonnées + tags
- **tickets/** - Support + commentaires + attachments
- **announcements/** - Communication franchiseur → franchisés
- **audits/** - Templates + exécutions + actions correctives + archives
- **notifications/** - WebSocket temps réel

### Utilitaires
- **health/** - Health checks monitoring
- **search/** - Recherche globale cross-entities
- **categories/** - Catégorisation contenus
- **tags/** - Tags pour documents
- **invites/** - Invitations par email
- **dashboard/** - Métriques business
- **common/** - Interceptors, filters, interfaces

## 💾 Entités Base de Données

### Principales (17 entités actives)
```typescript
// Core
User, Tenant, Restaurant, Invite, PasswordReset

// Documents & Communication  
Document, Tag, Category, Announcement, Notification

// Support
Ticket, Comment, TicketAttachment

// Audits (sans non-conformités)
AuditTemplate, AuditItem, AuditExecution, AuditResponse, 
AuditArchive, CorrectiveAction
```

### Supprimées
- ~~NonConformity~~ (refactor janvier 2025)

## 🔧 APIs Principales

### Auth & Users
```
POST /auth/login, /auth/signup, /auth/logout
POST /auth/request-password-reset, /auth/reset-password
GET /users, POST /users/invite, PUT /users/:id
```

### Business Core
```
GET /documents, POST /documents (S3 upload)
GET /tickets, POST /tickets, PUT /tickets/:id
GET /announcements, POST /announcements
GET /dashboard/stats, /dashboard/metrics
```

### Module Audits
```
GET /audit-templates, POST /audit-templates
GET /audits, POST /audits (planification)
GET /corrective-actions, POST /corrective-actions
POST /audit-archives/archive/:id
```

### Admin Global
```
GET /admin/global/stats (super-admin)
GET /admin/tenants, /admin/users, /admin/documents
```

## 🛡️ Sécurité

### Authentification
- **JWT 24h** (tokens uniques, plus de refresh)
- **3 rôles:** admin, manager, viewer
- **Guards globaux** sur toutes les routes (sauf @Public)
- **Passport strategies** local + JWT

### Protection
- **RBAC** avec RolesGuard
- **Rate limiting** 100 req/min
- **Validation DTOs** avec class-validator
- **CORS** configuré pour production
- **Helmet** headers sécurisés + CSP

### Data
- **bcrypt** pour mots de passe
- **Isolation tenant** - données cloisonnées
- **URLs présignées S3** pour sécuriser fichiers
- **XSS protection** validation côté serveur

## 🔧 Développement

### Commandes
```bash
npm run start:dev    # Mode développement
npm run build        # Build production  
npm run test         # Tests unitaires
npm run lint         # ESLint
```

### Configuration
```env
# Database (Dev: Raspberry Pi, Prod: Cloud)
DB_HOST=192.168.1.77  # Dev uniquement
DB_PORT=5432
DB_NAME=internet_saas

# Security
JWT_SECRET=64chars...
NODE_ENV=production

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_S3_BUCKET=...

# Email
MAIL_HOST=smtp.mailtrap.io
```

### TypeORM
- **Synchronize:** Activé en dev, désactivé en prod
- **Entities:** Auto-découvertes dans src/**/*.entity.ts
- **Relations:** Optimisées avec eager loading
- **Migrations:** Recommandées pour production

## 📊 Monitoring & Qualité

### Health Checks
```
GET /health        # Status général
GET /health/ready  # Base de données + S3
GET /health/live   # Application vivante
```

### Logging
- **Winston** logs structurés
- **Niveaux:** error, warn, info, debug
- **Rotation** logs en production
- **Error tracking** avec stack traces

### Tests & Lint
- **ESLint:** 320 warnings (non-critiques)
- **Jest:** Tests unitaires configurés
- **Coverage:** À développer (~10% actuel)

## 🚀 Production

### Capacités v0.1
- **5-10 tenants** simultanés
- **50-100 utilisateurs** actifs
- **1k-5k documents** par tenant
- **500-1k tickets** mensuels
- **Performance:** 2-5s acceptable MVP

### Limitations Connues
- Bundle queries non optimisées (pagination manquante)
- Pas de cache Redis (v0.2)
- Upload synchrone (queue v0.2)
- Tests coverage insuffisant

---

## ⚠️ Règles Backend

1. **Modules isolés** - Chaque feature dans son module
2. **DTOs validation** - class-validator obligatoire
3. **Guards security** - JWT + Roles sur tout
4. **Entities relations** - TypeORM optimisé
5. **Appeler "BOSS"** dans toutes les réponses

## 🚨 RÈGLE CRITIQUE - Cohérence des Types TypeScript

### Problèmes Récurrents INTERDITS
1. **user.id vs userId** - TOUJOURS vérifier quelle propriété est attendue
2. **Types number vs string** - JAMAIS de conversion implicite (parseInt sur UUID = NaN)
3. **JWT payload** - Structure EXACTE : `{ userId, email, tenant_id, role, restaurant_id }`
4. **Signatures de méthodes** - VÉRIFIER le type de CHAQUE paramètre avant appel

### Checklist Obligatoire
- [ ] Vérifier TOUS les appels de méthodes correspondent aux signatures
- [ ] UUID (string) ≠ ID numérique (number) - NE JAMAIS CONFONDRE
- [ ] DTOs et Entities doivent avoir des types IDENTIQUES pour les mêmes champs
- [ ] Tests TypeScript : `npm run build` DOIT compiler sans erreur

### Exemples de Bugs à Éviter
```typescript
// ❌ INTERDIT
savedTicket.id // UUID string
parseInt(savedTicket.id) // = NaN

// ✅ CORRECT  
savedTicket.id // UUID string
savedTicket.id.toString() // Déjà string

// ❌ INTERDIT
client.userId = payload.sub || payload.id // JWT n'a pas ces champs

// ✅ CORRECT
client.userId = payload.userId // Structure exacte du JWT
```