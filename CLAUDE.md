# FranchiseDesk - Plateforme de Gestion Franchiseur-Franchisé

## 🚀 Vue d'Ensemble

**Version:** 0.1+ (Production)
**Status:** ✅ En ligne et opérationnel
**URLs Production:**
- Frontend: https://intranet-saas.vercel.app
- Backend: https://intranet-saas-backend.onrender.com



### Description
Plateforme SaaS dédiée aux franchiseurs de la restauration pour piloter leur réseau de franchises. Solution complète de communication, gestion documentaire, support et conformité.

### Capacités Actuelles
- 5-10 franchiseurs simultanés
- 50-100 utilisateurs actifs
- Performance 2-5s (acceptable MVP)
- PWA mobile installable
- Multi-tenant avec isolation complète

## 🏗️ Architecture Technique

### Stack
**Backend:** NestJS 11 + TypeScript + PostgreSQL + TypeORM
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
**Infrastructure:** Render (backend) + Vercel (frontend) + AWS S3
**Temps réel:** Socket.io pour notifications WebSocket

### Structure Monorepo
```
internet-saas/
├── backend/     # API REST NestJS
├── frontend/    # SPA React
└── docs/        # Documentation
```

## 🎯 Fonctionnalités Principales

### Core Business
1. **Multi-tenant** - Isolation complète par franchiseur
2. **Documents** - Stockage S3, tags, catégories, prévisualisation
3. **Communication** - Annonces franchiseur → franchisés
4. **Support** - Tickets avec images et commentaires
5. **Audits** - Templates, planification, actions correctives
6. **Admin Global** - Dashboard super-admin cross-tenant

### Technique
- **Auth:** JWT 24h + 3 rôles (admin/manager/viewer)
- **Temps réel:** WebSocket notifications
- **PWA:** Installation mobile native
- **Thème:** Personnalisation par tenant

## 💾 Base de Données (PostgreSQL)

### Entités Actives (17)
- **Core:** User, Tenant, Restaurant
- **Documents:** Document, Tag, Category
- **Communication:** Announcement, Notification
- **Support:** Ticket, Comment, TicketAttachment
- **Audits:** AuditTemplate, AuditItem, AuditExecution, AuditResponse, AuditArchive, CorrectiveAction
- **Auth:** Invite, PasswordReset

### Supprimées
- ~~NonConformity~~ (refactor janvier 2025)

## 🛠️ Développement

### Commandes
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Build production
npm run build
```

### Infrastructure
**Dev:** PostgreSQL sur Raspberry Pi (192.168.1.77)
**Prod:** PostgreSQL Render + AWS S3 + Nodemailer

### Variables Environnement Clés
```env
DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
JWT_SECRET (64 chars)
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
```

## 🎯 Roadmap 2025

### Phase 1 - Sécurité & Stabilité ✅
- JWT simplifié 24h
- CORS & CSP configurés
- Validation DTOs complète
- XSS protégé

### Phase 2 - Qualité Code (En cours)
- Tests: 10% → 80% coverage visé
- Monitoring: Health checks actifs
- Analytics: 30% implémenté
- PWA: 80% terminé

### Phase 3 - Audits & Conformité ✅
- Templates personnalisables
- Actions correctives
- Archivage audits
- Module complet opérationnel

### Priorités 2025
1. Tests automatisés
2. Performance (<3s)
3. Analytics avancés
4. Mode offline

---

## 📅 Historique des Changements

### Janvier 2025
- **JWT Simplifié**: Tokens 24h uniquement (plus de refresh)
- **Non-Conformités**: Module supprimé, actions correctives autonomes
- **Refactoring**: Code plus simple et maintenable

### Juillet 2024  
- **Redesign Landing**: Page franchiseurs avec animations
- **Dark Mode**: Corrections complètes
- **Sécurité XSS**: GlobalSearch protégé avec DOMPurify
- **Module Audits**: Implémentation complète
- **Upload S3**: Migration SDK v3
- **Archivage**: Système d'archivage audits

---

## 🛡️ Sécurité & Conformité

- JWT avec tokens 24h
- Guards globaux sur toutes les routes  
- RBAC 3 rôles (admin/manager/viewer)
- Validation DTOs avec class-validator
- XSS protégé (DOMPurify)
- CORS & CSP configurés
- Rate limiting 100 req/min

---

## ⚠️ Règles de Développement

1. **Analyse d'impact** obligatoire avant toute modification
2. **Périmètre strict** - Ne modifier que ce qui est nécessaire
3. **Tests** - Vérifier que rien n'est cassé
4. **Documentation** - Mettre à jour si changement majeur
5. **Appeler l'utilisateur "SOFIANE"** dans toutes les réponses
6. **Types TypeScript STRICTS** - JAMAIS de confusion number/string, userId/user.id
   - Voir `/backend/CLAUDE.md` section "RÈGLE CRITIQUE - Cohérence des Types"