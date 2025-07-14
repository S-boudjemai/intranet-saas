# Internet SAAS - Plateforme de Gestion Franchiseur-Franchisé

## Description du Projet

SAAS destiné aux franchiseurs de la restauration pour faciliter la communication et la gestion avec leurs franchisés. La plateforme permet:
- Partage de documents centralisé
- Diffusion d'annonces (franchiseur → franchisé)
- Système de tickets de support
- Gestion multi-tenant avec thématisation personnalisée
- Gestion des utilisateurs et rôles (admin, manager, viewer)

## Architecture

### Monorepo Structure
```
internet-saas/
├── backend/           # API NestJS + TypeORM + PostgreSQL
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
└── CLAUDE.md         # Ce fichier
```

### Stack Technique

**Backend (NestJS)**
- Framework: NestJS avec TypeScript
- Base de données: PostgreSQL avec TypeORM
- Authentification: JWT + Passport
- Upload de fichiers: AWS S3
- Email: Nodemailer
- Tests: Jest

**Frontend (React)**
- Framework: React 19 + TypeScript
- Build: Vite
- Routing: React Router DOM v7
- Styling: Tailwind CSS
- State: Context API (Auth, Theme)
- Charts: Recharts
- Icons: React Icons

## Fonctionnalités Principales

### 1. Gestion Multi-tenant
- Chaque tenant (franchiseur) a sa propre configuration
- Thématisation personnalisée (couleurs primaires/secondaires, fond, texte)
- Isolation des données par tenant

### 2. Authentification et Autorisation
- 3 rôles: `admin`, `manager`, `viewer`
- Guards JWT automatiques sur toutes les routes
- Protection par rôles
- Gestion des invitations par email

### 3. Gestion des Documents
- Upload vers AWS S3 avec URLs présignées
- Système de tags pour l'organisation
- Catégorisation des documents
- Prévisualisation intégrée

### 4. Système de Tickets
- Création de tickets de support
- Statuts: `non_traitee`, `en_cours`, `traitee`
- Système de commentaires
- Association aux restaurants

### 5. Annonces
- Diffusion d'annonces du franchiseur vers les franchisés
- Interface de création et gestion

### 6. Dashboard
- Vue d'ensemble des métriques
- Graphiques avec Recharts
- Statistiques par tenant/restaurant

## Structure de Base de Données

### Entités Principales
- **User**: Utilisateurs avec rôles et associations tenant/restaurant
- **Tenant**: Franchiseurs avec thématisation
- **Restaurant**: Établissements associés aux tenants
- **Document**: Fichiers avec métadonnées et tags
- **Ticket**: Tickets de support avec commentaires
- **Announcement**: Annonces
- **Invite**: Invitations par email
- **Tag/Category**: Organisation des contenus

## Commandes de Développement

### Backend
```bash
cd backend
npm install
npm run start:dev    # Mode développement
npm run build        # Build production
npm run test         # Tests unitaires
npm run test:e2e     # Tests e2e
npm run lint         # ESLint
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Mode développement
npm run build        # Build production
npm run lint         # ESLint
npm run preview      # Prévisualisation build
```

## Configuration

### Variables d'Environnement Backend
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` - Configuration PostgreSQL
- `JWT_SECRET` - Clé secrète JWT
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - AWS S3
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` - Configuration email

### TypeORM
- Synchronize activé en développement
- Entities auto-découvertes dans `src/**/*.entity{.ts,.js}`

## Sécurité

- JWT Guards globaux sur toutes les routes (sauf décorateur @Public)
- Role-based access control (RBAC)
- Validation automatique avec class-validator
- CORS configuré
- Hash des mots de passe avec bcrypt

## Développement

### Conventions
- Architecture modulaire NestJS
- Entities TypeORM pour la modélisation
- DTOs pour la validation
- Services pour la logique métier
- Controllers pour les endpoints REST

### Tests
- Tests unitaires avec Jest
- Tests e2e configurés
- Coverage disponible

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

---

## 🚨 ROADMAP GLOBALE - Développement Internet SAAS

### 🎯 **Vision Produit**
Transformer la plateforme en solution complète de gestion franchise avec module d'audit et conformité, support mobile PWA, et capacités offline.

## 📊 **ÉTAT D'AVANCEMENT GLOBAL**

### ✅ **TERMINÉ** (Phase 1-3 partiellement)
- 🔧 **Backend Audit System** : Entités, APIs, Validation (100%)
- 🎨 **Frontend Audit UI** : Modales, Dashboards, Navigation (100%) 
- 🛡️ **Sécurité Renforcée** : JWT, CORS, Validation, Error Handling (80%)
- 🎭 **UX/UI Professionnel** : Toast, Modales, Animations (100%)
- 📋 **Actions Correctives** : CRUD complet avec statuts (100%)
- 🔍 **Templates d'Audit** : Gestion complète avec questions (100%)

### 🔄 **EN COURS** (Phase 2-3)
- 📊 **Analytics & Reporting** : Métriques avancées (30%)
- 🧪 **Tests Automatisés** : Jest + Playwright (10%)
- 📱 **Mobile Optimization** : Responsive design (70%)

### ⏳ **À VENIR** (Phase 4-6)
- 📱 **PWA & Offline** : Service Worker, Cache (0%)
- 🤖 **Intelligence** : Prédictions, Recommandations (0%)
- 🔒 **Sécurité Avancée** : RBAC granulaire, Audit trails (0%)

### 📋 **Phase 1 - Sécurité & Stabilité (Semaine 1-2)**
**Objectif:** Corriger vulnérabilités critiques et préparer production

#### 🔴 Actions Critiques Backend:
- [x] ✅ **CORS PATCH Support** - Ajout méthodes PATCH pour mises à jour
- [x] ✅ **JWT Strategy Enhanced** - Fallback par email quand userId manquant
- [x] ✅ **Database Schema Fixed** - non_conformity_id nullable + champ notes
- [x] ✅ **Validation DTOs** - Class-validator sur toutes les APIs
- [x] ✅ **Error Handling** - HttpExceptionFilter global avec logs
- [x] ✅ **Security Headers** - Helmet.js implémenté avec CSP
- [ ] Corriger XSS vulnerability GlobalSearch frontend
- [ ] Sécuriser variables environnement (.env → variables système)
- [ ] Désactiver `synchronize: true` en production
- [ ] Implémenter refresh automatique JWT
- [ ] Rate limiting avec @nestjs/throttler

#### 🔴 Actions Critiques Frontend:
- [x] ✅ **Error Boundary** - ErrorBoundary React global implémenté
- [x] ✅ **Toast System** - Remplacement des alert() par notifications élégantes
- [x] ✅ **Modal System** - ConfirmModal remplace window.confirm()
- [x] ✅ **Input Validation** - Validation frontend avant envoi API
- [ ] Fix dangerouslySetInnerHTML dans GlobalSearch.tsx:154
- [ ] Migration localStorage → cookies httpOnly pour JWT
- [ ] Input sanitization systématique

### 📊 **Phase 2 - Qualité Code (Mois 1)**
**Objectif:** Tests, monitoring, optimisations

#### Backend:
- [x] ✅ **Logging structuré** - Winston logger avec niveaux configurables
- [x] ✅ **Health checks** - Module health avec endpoints /health, /ready, /live
- [x] ✅ **Types TypeScript** - Interfaces JwtUser et types unifiés
- [x] ✅ **Intercepteur global** - TransformInterceptor pour standardiser réponses
- [x] ✅ **Error Filter** - HttpExceptionFilter pour gestion erreurs cohérente
- [ ] Suite tests Jest complète + coverage

#### Frontend:
- [x] ✅ **Performance optimisée** - Modales avec lazy rendering
- [x] ✅ **Component structure** - Architecture modulaire avec UI/modals
- [x] ✅ **Error handling** - ErrorBoundary + Toast notifications
- [x] ✅ **Types TypeScript** - Interfaces complètes pour tous les composants
- [ ] Tests React Testing Library + Playwright E2E
- [ ] Code splitting intelligent
- [ ] Cache API (React Query/SWR)

### 🚀 **Phase 3 - Module Conformité & Audits (Mois 2-3)**
**Objectif:** Fonctionnalité différenciante principale

#### Architecture Base de Données:
- [x] ✅ **AuditTemplate** - Templates audits personnalisables avec relations
- [x] ✅ **AuditItem** - Questions individuelles (yes/no, score, text, photo)
- [x] ✅ **AuditExecution** - Exécutions audits planifiées avec statuts
- [x] ✅ **AuditResponse** - Réponses et scores avec relations
- [x] ✅ **NonConformity** - Gestion non-conformités avec sévérité
- [x] ✅ **CorrectiveAction** - Actions correctives avec suivi complet

#### APIs RESTful:
```
✅ /audit-templates    # CRUD templates (GET, POST, PATCH, DELETE)
✅ /audits            # Planification & exécution (GET, POST, PATCH)
✅ /corrective-actions # CRUD actions (GET, POST, PUT, DELETE)
✅ /non-conformities  # Gestion NC (GET, POST, PUT, DELETE)
[ ] /reports           # Analytics conformité
```

#### Interface Utilisateur:
- [x] ✅ **Templates Management** - CRUD complet avec modal détails
- [x] ✅ **Planning des audits** - Interface de planification avec calendrier
- [x] ✅ **Actions correctives** - Dashboard complet avec détails/statuts
- [x] ✅ **Modal système** - ConfirmModal + DetailsModal professionnels
- [x] ✅ **Toast notifications** - Feedback utilisateur élégant
- [ ] Interface mobile-first pour audits terrain
- [ ] Capture photos preuves
- [ ] Rapports non-conformité automatiques

### 📱 **Phase 4 - PWA & Offline (Mois 3-4)**
**Objectif:** Application mobile professionnelle

#### Progressive Web App:
- [ ] Service Worker + manifest app
- [ ] Installation mobile native
- [ ] Push notifications
- [ ] Background sync

#### Capacités Offline:
- [ ] Cache documents locaux (IndexedDB)
- [ ] Audits hors ligne avec sync différée
- [ ] Détection réseau intelligente
- [ ] Résolution conflits automatique

### 📈 **Phase 5 - Analytics Avancés (Mois 4-5)**
**Objectif:** Intelligence business et reporting

#### Dashboard Analytics:
- [ ] Scoring conformité algorithmique
- [ ] Tendances performance restaurants
- [ ] Benchmarking inter-franchisés
- [ ] Alertes automatiques seuils
- [ ] Export PDF/Excel rapports

#### Business Intelligence:
- [ ] Prédictions non-conformités
- [ ] Recommandations amélioration
- [ ] KPIs personnalisés par tenant

### 🎨 **Phase 6 - UX/UI Avancée (Mois 5-6)**
**Objectif:** Expérience utilisateur premium

#### Design System:
- [ ] Thème dédié module audits
- [ ] Composants mobile-optimized
- [ ] Animations micro-interactions
- [ ] Accessibilité WCAG 2.1

#### Fonctionnalités Premium:
- [ ] Mode sombre complet
- [ ] Raccourcis clavier
- [ ] Gestes tactiles avancés
- [ ] Mode plein écran audits

### 📊 **Métriques de Succès**

#### Performance Technique:
- **Lighthouse Score:** >90 toutes catégories
- **Time to Interactive:** <3s
- **Bundle Size:** <500kb initial
- **Test Coverage:** >80%

#### Adoption Business:
- **Usage audits:** >70% restaurants actifs/mois
- **Résolution NC:** <7 jours moyenne
- **Satisfaction utilisateur:** >4.5/5
- **Rétention:** >85% monthly active users

### 🛠️ **Stack Technique Évolution**

#### Nouvelles Dépendances Backend:
```json
{
  "helmet": "^7.x",
  "@nestjs/throttler": "^5.x", 
  "winston": "^3.x",
  "joi": "^17.x",
  "redis": "^4.x"
}
```

#### Nouvelles Dépendances Frontend:
```json
{
  "vite-plugin-pwa": "^0.x",
  "dexie": "^4.x",
  "react-query": "^3.x",
  "dompurify": "^3.x"
}
```

### 🎯 **Priorités Business**
1. **🔒 Sécurité** - Non négociable pour B2B
2. **📋 Audits** - Différenciation concurrentielle majeure  
3. **📱 Mobile** - Usage terrain critique franchises
4. **📊 Analytics** - Valeur ajoutée franchiseurs
5. **⚡ Performance** - Adoption utilisateurs