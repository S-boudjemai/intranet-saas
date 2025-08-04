# FranchiseDesk - Plateforme de Gestion Franchiseur-Franchisé

## 🚀 Vue d'Ensemble

**Version:** 0.3+ (Production)
**Status:** ✅ En ligne et opérationnel - UI/UX harmonisée + Push Notifications
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
4. **Support** - Tickets avec images et commentaires + archivage
5. **Admin Global** - Dashboard super-admin cross-tenant
6. **Notifications Push** - OneSignal push notifications mobile/desktop + prompts élégants

### Technique
- **Auth:** JWT 24h + 3 rôles (admin/manager/viewer)
- **Temps réel:** WebSocket + OneSignal push notifications
- **PWA:** Installation mobile native
- **Thème:** Personnalisation par tenant
- **Archivage:** Système pour tickets

## 💾 Base de Données (PostgreSQL)

### Entités Actives (13)
- **Core:** User, Tenant, Restaurant
- **Documents:** Document, Tag, Category
- **Communication:** Announcement, AnnouncementView, Notification
- **Support:** Ticket, Comment, TicketAttachment
- **Auth:** Invite, PasswordReset
- **Notifications:** PushSubscription (OneSignal)
- **Views:** View

### Supprimées
- ~~NonConformity~~ (refactor janvier 2025)
- ~~AuditTemplate, AuditItem, AuditExecution, AuditResponse, AuditArchive, CorrectiveAction~~ (suppression système audits juillet 2025)

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
- Analytics: 50% implémenté (Dashboard BI)
- PWA: 90% terminé (OneSignal intégré)

### Phase 3 - Audits & Conformité ✅
- Templates personnalisables
- Actions correctives
- Archivage audits
- Module complet opérationnel

### Priorités 2025
1. Tests automatisés (Jest + coverage)
2. Performance (<3s load time)
3. Analytics avancés (Dashboard BI complet)
4. Mode offline (PWA cache avancé)
5. API Admin complet (documentation intégrée)

---

## 📅 Session Terminée - Dashboard Intelligence Business (27/07/2025) ✅

### 🎯 Objectif
Améliorer le dashboard avec une approche Business Intelligence : transformer les données brutes en insights actionnables pour les franchiseurs.

### ✅ Tâches Complétées

1. **Corriger l'affichage des KPIs d'audits/actions** ✅
   - Ajout du filtrage par tenant pour les actions correctives
   - Jointure avec `assigned_user` pour obtenir le tenant_id
   - Ajout de messages quand pas de données à afficher

2. **Réimplémenter les alertes business** ✅
   - Restaurants sans audit récent (30 jours)
   - Tickets critiques non traités (>3 jours)
   - Actions correctives en retard
   - Relations TypeORM correctement implémentées

3. **Ajouter comparaisons temporelles** ✅
   - Documents : semaine actuelle vs précédente
   - Audits : semaine actuelle vs précédente
   - Tickets non traités : semaine actuelle vs précédente
   - Calcul des tendances avec pourcentages

4. **Finaliser l'approche Business Intelligence** ✅
   - Dashboard orienté insights actionnables
   - Alertes critiques prioritaires
   - KPIs pertinents pour franchiseurs
   - Tendances et comparaisons visuelles

### 🏗️ Architecture Implémentée

**Backend (dashboard.service.ts):**
- Requêtes optimisées avec jointures appropriées
- Filtrage multi-tenant sur toutes les métriques
- Calculs de comparaisons temporelles
- Structure de données pour alertes business

**Frontend (DashboardPage.tsx):**
- Interface `DashboardData` avec alertes et comparisons optionnelles
- Composant `AlertsSection` pour affichage des alertes
- Graphiques avec messages quand pas de données
- Calcul et affichage des tendances sur KPIs

### 📊 Nouvelles Fonctionnalités Dashboard

1. **Section Alertes Critiques** (priorité haute)
   - Restaurants sans audit récent avec liens d'action
   - Tickets urgents avec temps écoulé
   - Actions correctives en retard

2. **KPIs avec Tendances**
   - Support actif : évolution vs semaine précédente
   - Audits : progression hebdomadaire
   - Documents : activité comparative

3. **Graphiques Intelligents**
   - Audits par statut (camembert)
   - Actions correctives par statut (barres)
   - Évolution tickets sur 7 jours (courbe)

### 🎯 Statut Final
**DASHBOARD BUSINESS INTELLIGENCE COMPLET** 
- ✅ Alertes business fonctionnelles
- ✅ KPIs avec comparaisons temporelles
- ✅ Graphiques orientés insights
- ✅ Interface intuitive et actionnable

---

## 📅 Session Précédente - Système d'Archivage (24/07/2025)

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

## 📅 Session Actuelle - UI/UX Harmonisation + Push Notifications (Août 2025) ✅

### 🎯 Objectif
Harmoniser complètement l'UI/UX de l'application avec des animations cohérentes et implémenter les notifications push mobiles pour améliorer l'engagement utilisateur.

### ✅ Tâches Complétées

1. **Harmonisation animations d'entrée des pages** ✅
   - Pattern unifié AuditsPage appliqué à toutes les pages
   - Headers avec icônes statiques et animations standardisées
   - Animations d'entrée cohérentes (opacity + y: -20 → 0)
   - Transition fluides entre les pages

2. **Standardisation des cartes et composants** ✅
   - BoxShadow uniforme sur toutes les cartes (`0 4px 20px rgba(0,0,0,0.06)`)
   - Animations hover harmonisées (`y: -4` pour l'effet flottement)
   - AnnouncementCard : hover retiré sur demande utilisateur
   - TicketItem, DocumentCard, CorrectiveActionCard, KpiCard avec animations

3. **Système de notifications push complet** ✅
   - OneSignal React v3.2.3 intégré et fonctionnel
   - Composant PushNotificationPrompt avec animations élégantes
   - Intégration NotificationContext avec méthodes OneSignal
   - Auto-initialisation au login + prompt après 3 secondes
   - Support multi-plateforme (Android, iOS, Desktop Web)

4. **Nettoyage du code de production** ✅
   - Suppression des console.log de debug excessifs
   - Optimisation des services (auditTemplatesService, useScheduleAuditData)
   - Code prêt pour la production

### 🏗️ Architecture Technique Implémentée

**UI/UX Framework:**
- Pattern d'animation unifié basé sur AuditsPage
- Framer Motion pour toutes les animations
- Design system cohérent avec Tailwind CSS
- Icônes centralisées dans `/components/icons/index.tsx`

**Push Notifications Stack:**
- OneSignal SDK React intégré au frontend
- Backend endpoint `/notifications/onesignal-subscribe`
- Service Worker `OneSignalSDK.sw.js` dans le build PWA
- Context API pour gestion d'état global

### 📁 Fichiers Modifiés

**Frontend UI/UX:**
- `src/pages/*` - Toutes les pages harmonisées avec pattern AuditsPage
- `src/components/CorrectiveActionCard.tsx` - Animations hover + boxShadow
- `src/components/TicketItem.tsx` - Conversion en motion.article avec hover
- `src/components/AnnouncementCard.tsx` - Restauration puis suppression hover
- `src/components/icons/index.tsx` - Ajout BellIcon

**Frontend Push Notifications:**
- `src/components/PushNotificationPrompt.tsx` - Nouveau composant élégant
- `src/contexts/NotificationContext.tsx` - Intégration OneSignal
- `src/services/oneSignalService.ts` - Service complet existant
- `src/App.tsx` - Activation du prompt pour utilisateurs connectés

**Nettoyage:**
- `src/hooks/useScheduleAuditData.ts` - Suppression logs debug
- `src/services/auditTemplatesService.ts` - Suppression logs debug  
- `src/pages/AdminGlobalDashboard.tsx` - Suppression logs debug

### 🎯 Statut Final
**UI/UX PARFAITEMENT HARMONISÉE + PUSH NOTIFICATIONS OPÉRATIONNELLES**
- ✅ Animations cohérentes sur toutes les pages et composants
- ✅ Design system unifié avec effets visuels standardisés  
- ✅ Notifications push mobile prêtes pour production
- ✅ Code nettoyé et optimisé pour le déploiement
- ✅ Performance maintenue avec PWA installable

---

## 📅 Session Précédente - Migration OneSignal (Janvier 2025) ✅

### 🎯 Objectif
Intégrer OneSignal pour les notifications push multi-plateformes et améliorer l'engagement utilisateur.

### ✅ Tâches Complétées

1. **Migration Base de Données OneSignal** ✅
   - Ajout colonnes `oneSignalUserId`, `userAgent`, `platform` dans table `users`
   - Migration `1753745169744-AddOneSignalToUser.ts` créée et appliquée
   - Entité `PushSubscription` pour gestion abonnements

2. **Service OneSignal Backend** ✅
   - Service `OneSignalService` avec SDK onesignal-node v3.4.0
   - Méthodes `sendNotificationToUser()` et `sendNotificationToAll()`
   - Gestion des erreurs et logging structuré

3. **Intégration Frontend** ✅
   - SDK OneSignal React intégré avec react-onesignal v3.2.3
   - Service `oneSignalService.ts` pour initialisation et gestion utilisateur
   - Context `NotificationContext` mis à jour pour OneSignal

4. **Configuration Production** ✅
   - Variables environnement `ONESIGNAL_APP_ID` et `ONESIGNAL_API_KEY`
   - Service Worker OneSignal configuré (`OneSignalSDK.sw.js`)
   - Permissions navigateur et gestion plateformes

### 🏗️ Architecture Intégrée

**Backend:**
- Service OneSignal avec gestion multi-utilisateur
- Stockage userId OneSignal en base pour ciblage précis
- Notifications automatiques lors événements métier

**Frontend:**
- Initialisation automatique OneSignal au login
- Gestion permissions navigateur élégante
- Synchronisation userId avec backend

### 🎯 Statut Final
**ONESIGNAL INTÉGRATION COMPLÈTE**
- ✅ Backend service opérationnel
- ✅ Frontend SDK configuré
- ✅ Base de données mise à jour
- ✅ Prêt pour notifications production

---

## 📅 Historique des Changements

### Juillet 2025 - Tracking des Annonces ✅
- **Backend**: Entité AnnouncementView + 3 endpoints REST
- **Frontend**: Hook auto-tracking + interface manager élégante
- **UX**: Badge de lecture (X/Y 67%) + modal détaillée
- **Sécurité**: Multi-tenant + permissions managers uniquement
- **Tracking intelligent**: localStorage + délai 3s + une seule vue par user

### Janvier 2025 - Modernisation & Sécurité ✅
- **JWT Simplifié**: Tokens 24h uniquement (plus de refresh)
- **Non-Conformités**: Module supprimé, actions correctives autonomes
- **OneSignal**: Intégration notifications push multi-plateformes
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