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
3. **Communication** - Annonces franchiseur → franchisés + tracking des lectures
4. **Support** - Tickets avec images et commentaires
5. **Audits** - Templates, planification, actions correctives
6. **Admin Global** - Dashboard super-admin cross-tenant

### Technique
- **Auth:** JWT 24h + 3 rôles (admin/manager/viewer)
- **Temps réel:** WebSocket notifications
- **PWA:** Installation mobile native
- **Thème:** Personnalisation par tenant

## 💾 Base de Données (PostgreSQL)

### Entités Actives (18)
- **Core:** User, Tenant, Restaurant
- **Documents:** Document, Tag, Category
- **Communication:** Announcement, AnnouncementView, Notification
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

## 🎯 Session Actuelle - Système d'Archivage (24/07/2025)

### ✅ Tâches Complétées
1. **Modifier l'enum TicketStatus pour ajouter 'archived'** ✅
   - Ajout du statut 'archived' dans ticket.entity.ts
   - Migration 1753308000000-AddArchivedTicketStatus.ts créée
   - Mise à jour enum PostgreSQL

2. **Ajouter bouton 'Archiver' sur les tickets résolus** ✅
   - Méthodes archiveTicket() et restoreTicket() dans tickets.service.ts
   - Routes PUT /tickets/:id/archive et /tickets/:id/restore
   - Bouton archivage dans TicketItem.tsx (statut 'traitee' uniquement)
   - Logique de permissions manager/admin respectée

3. **Créer interface d'archives avec filtres** ✅
   - Page ArchivesPage.tsx avec 3 onglets (Audits/Tickets/Actions)
   - TabNavigation avec badges de comptage
   - Modales de détails pour chaque type d'archive
   - Fonctions de restauration intégrées

4. **Implémenter workflow actions correctives (completed->archived)** ✅
   - Méthodes findArchived() et restore() dans corrective-actions.service.ts
   - Routes GET /corrective-actions/archived et PUT /:id/restore
   - Interface complète dans onglet Actions archivées
   - Workflow completed/verified → archived → restored

5. **Tester l'archivage et la restauration** ✅
   - Corrections erreurs TypeScript (logique archiveTicket)
   - Fixes imports TabNavigation et ChecklistIcon → ClipboardIcon
   - Build backend successful
   - Interface frontend opérationnelle

### 🏗️ Architecture Implémentée
- **Approche "Soft Archive"** : Utilisation de statuts au lieu d'entités séparées
- **Sécurité** : Préservation des droits viewers sur leurs archives
- **Réversibilité** : Fonctions de restauration complètes
- **Multi-tenant** : Isolation des archives par tenant

### 📁 Fichiers Modifiés
**Backend:**
- `src/tickets/entities/ticket.entity.ts` - Enum TicketStatus
- `src/tickets/tickets.service.ts` - Méthodes archivage/restauration
- `src/tickets/tickets.controller.ts` - Routes archives
- `src/audits/corrective-actions.service.ts` - Gestion archives actions
- `src/audits/corrective-actions.controller.ts` - Routes archives actions
- `src/migrations/1753308000000-AddArchivedTicketStatus.ts` - Migration

**Frontend:**
- `src/pages/ArchivesPage.tsx` - Interface complète 3 onglets
- `src/components/TicketItem.tsx` - Bouton archivage
- `src/pages/TicketsPages.tsx` - Intégration fonction archivage

### 🎯 Statut Final
**SYSTÈME D'ARCHIVAGE COMPLET ET OPÉRATIONNEL** 
- ✅ Tickets archivables depuis interface tickets
- ✅ Actions correctives archivables selon workflow
- ✅ Page Archives centralisée avec filtres
- ✅ Restauration possible pour tous types
- ✅ Respect des permissions et multi-tenancy

---

## 📅 Historique des Changements

### Juillet 2025 - Tracking des Annonces ✅
- **Backend**: Entité AnnouncementView + 3 endpoints REST
- **Frontend**: Hook auto-tracking + interface manager élégante
- **UX**: Badge de lecture (X/Y 67%) + modal détaillée
- **Sécurité**: Multi-tenant + permissions managers uniquement
- **Tracking intelligent**: localStorage + délai 3s + une seule vue par user

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
7. **Relations Base de Données** - TOUJOURS configurer les cascades (onDelete: 'CASCADE') pour éviter les contraintes FK
   - Ordre des routes important : routes spécifiques AVANT routes paramétrées (/delete-all avant /:id)
8. **Dark Mode UI** - JAMAIS de couleurs fixes sans variante dark (text-gray-900 → text-gray-900 dark:text-gray-100)
   - Utiliser les tokens Tailwind adaptatifs : text-foreground, bg-background, text-muted-foreground
   - Overlays de modales : bg-black/50 au lieu de bg-black bg-opacity-50
9. **UX & Animations** - Autorisation d'utiliser des librairies pour améliorer l'UI/UX
   - Framer Motion pour animations fluides et micro-interactions
   - Librairies UI/UX appropriées pour améliorer l'expérience utilisateur
   - Éviter les éléments invisibles (opacity-0) sans feedback visuel clair