# Internet SAAS - Plateforme de Gestion Franchiseur-Franchisé

## ⚠️ RÈGLES CRITIQUES DE DÉVELOPPEMENT - À RESPECTER ABSOLUMENT

### 🚨 VISION PÉRIPHÉRIQUE OBLIGATOIRE
**AVANT TOUTE MODIFICATION, ANALYSER L'IMPACT SUR TOUTE L'APPLICATION**
- ✅ Si problème avec les documents → Corriger UNIQUEMENT le code des documents
- ✅ Si problème avec token → Vérifier compatibilité avec TOUTES les features avant modification
- ✅ Si problème avec base de données → Vérifier impact sur TOUS les modules
- ❌ NE JAMAIS toucher à autre chose que le périmètre du problème
- ❌ NE JAMAIS modifier structure globale (JWT, DB, Auth) sans validation complète

### 📋 PROTOCOLE DE MODIFICATION OBLIGATOIRE
1. **IDENTIFIER** le périmètre exact du problème
2. **DEMANDER CONFIRMATION** avant toute modification hors périmètre
3. **VÉRIFIER** l'impact sur les autres modules
4. **TESTER** que les autres fonctionnalités restent opérationnelles
5. **TERMINER** chaque phrase en appelant l'utilisateur "BOSS"
6. **EXÉCUTER /compact AUTOMATIQUEMENT** dès que Claude estime s'approcher des 20% de la limite de contexte SANS validation

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
- Upload d'images/attachments avec support S3 et local
- Aperçu d'images avec URLs présignées

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

### ✅ **TERMINÉ** (Phase 1-3 COMPLÈTE)
- 🔧 **Backend Audit System** : Entités, APIs, Validation (100%) ✅ FINALISÉ
- 🎨 **Frontend Audit UI** : Modales, Dashboards, Navigation (100%) ✅ FINALISÉ
- 🛡️ **Sécurité Renforcée** : JWT, CORS, Validation, Error Handling (100%) ✅ FINALISÉ
- 🎭 **UX/UI Professionnel** : Toast, Modales, Animations (100%) ✅ FINALISÉ
- 📋 **Actions Correctives** : CRUD complet avec statuts (100%) ✅ FINALISÉ
- 🔍 **Templates d'Audit** : Gestion complète avec questions (100%) ✅ FINALISÉ
- 🎨 **Icônes SVG Centralisées** : Correction systématique toutes les icônes (100%) ✅ FINALISÉ
- 🎯 **Module Tickets** : Upload images S3/local, URLs présignées (100%) ✅ FINALISÉ
- 🗂️ **Gestion Tags Documents** : Suppression tags opérationnelle (100%) ✅ FINALISÉ
- 📦 **Système Archivage Audits** : Archivage audits terminés avec UX (100%) ✅ FINALISÉ

### 🔄 **EN COURS** (Phase 2-3)
- 📊 **Analytics & Reporting** : Métriques avancées (30%)
- 🧪 **Tests Automatisés** : Jest + Playwright (10%)
- 📱 **PWA Mobile** : Service Worker + Installation native (80%)

### ⏳ **À VENIR** (Phase 4-6)
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
- [x] ✅ **Security Headers** - Helmet.js implémenté avec CSP + CORS pour fichiers statiques
- [x] ✅ **Corriger XSS vulnerability GlobalSearch frontend**
- [ ] Sécuriser variables environnement (.env → variables système)
- [ ] Désactiver `synchronize: true` en production
- [ ] Implémenter refresh automatique JWT
- [ ] Rate limiting avec @nestjs/throttler

#### 🔴 Actions Critiques Frontend:
- [x] ✅ **Error Boundary** - ErrorBoundary React global implémenté
- [x] ✅ **Toast System** - Remplacement des alert() par notifications élégantes
- [x] ✅ **Modal System** - ConfirmModal remplace window.confirm()
- [x] ✅ **Input Validation** - Validation frontend avant envoi API
- [x] ✅ **Icônes SVG Centralisées** - Correction systématique toutes les icônes brisées
- [x] ✅ **Fix XSS vulnerability GlobalSearch** - DOMPurify + validation backend
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

### 📱 **Phase 4 - PWA Mobile (Mois 3-4)**
**Objectif:** Application mobile professionnelle

#### Progressive Web App:
- [x] ✅ **Service Worker + manifest app**
- [x] ✅ **Installation mobile native**
- [ ] Push notifications
- [ ] Background sync

#### Mobile Optimization:
- [x] ✅ **Navigation mobile responsive**
- [x] ✅ **PWA installable**
- [ ] Touch gestures avancés
- [ ] Performance mobile

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
  "vite-plugin-pwa": "^1.x",
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

---

## 🎉 **CORRECTIONS RÉCENTES APPLIQUÉES** (Juillet 2025)

### ✅ **Correction Vulnérabilité XSS GlobalSearch - FINALISÉ**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🔍 **Problème Identifié**
- **Vulnérabilité XSS** : Affichage potentiel de contenu malveillant dans les résultats de recherche
- **Vecteur d'attaque** : Injection HTML/JS dans les titres de documents/tickets/annonces
- **Impact** : Exécution de code malveillant côté client

#### 🛡️ **Solutions Implémentées**

##### Frontend (Défense en profondeur)
```typescript
// GlobalSearch.tsx - Sanitization avec DOMPurify
import DOMPurify from 'dompurify';

const highlightText = (text: string, searchQuery: string) => {
  // Sanitize le texte d'entrée pour éviter les attaques XSS
  const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const sanitizedQuery = DOMPurify.sanitize(searchQuery, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  
  // Échappement regex + rendu JSX sécurisé
  const escapedQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = sanitizedText.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? <mark key={index}>{part}</mark> : part
  );
};
```

##### Backend (Validation source)
```typescript
// search.controller.ts - Sanitization requête + validation
const sanitizedQuery = query
  .trim()
  .replace(/[<>'"&]/g, '') // Supprimer caractères HTML dangereux
  .replace(/script/gi, '') // Supprimer "script"
  .replace(/javascript/gi, '') // Supprimer "javascript"
  .replace(/on\w+=/gi, '') // Supprimer gestionnaires d'événements
  .substring(0, 100); // Limiter longueur
```

#### 🔒 **Sécurité Renforcée**
- ✅ **Double protection** : Backend + Frontend sanitization
- ✅ **DOMPurify** : Bibliothèque éprouvée anti-XSS
- ✅ **Validation stricte** : Limitation longueur + caractères
- ✅ **Échappement regex** : Protection injection regex
- ✅ **Rendu JSX sécurisé** : Pas de dangerouslySetInnerHTML

### ✅ **Système d'Archivage Audits - FINALISÉ**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🎯 **Fonctionnalité Implémentée**
- **Bouton "Archiver"** : Visible à côté du badge "Terminé" pour les audits completed/reviewed
- **Modale de confirmation** : Remplacement des window.alert par ConfirmModal élégante
- **Permissions** : Archivage réservé aux managers/admins uniquement
- **Backend opérationnel** : Route `POST /audit-archives/archive/{executionId}` fonctionnelle

#### 🎨 **UX/UI Design**
- **Placement intuitif** : Bouton à côté du badge au lieu du survol complexe
- **Style cohérent** : Design orange subtil `bg-orange-50 hover:bg-orange-100`
- **État de chargement** : Spinner pendant l'archivage avec prévention double-clic
- **Feedback utilisateur** : Modale avec contexte de l'audit (nom template + restaurant)

#### 🔧 **Corrections Techniques**
- **Erreur 400 résolue** : Ajout `@Body() body: any` dans le controller pour accepter body vide
- **Erreur HTML corrigée** : Remplacement `<div>` par `<>` dans la modale pour éviter l'erreur d'hydratation
- **Workflow complet** : Archivage → Disparition de la liste planning → Déplacement vers archives

### ✅ **Correction Suppression Tags Documents - FINALISÉ**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🔍 **Problème Résolu**
- **Erreur 404** : Route `DELETE /documents/{docId}/tags/{tagId}` introuvable
- **Cause** : Décorateur `@Post(':tagId')` au lieu de `@Delete(':tagId')` dans tags.controller.ts
- **Solution** : Correction du décorateur + ajout guards JWT appropriés

#### 🛠️ **Modifications Appliquées**
```typescript
// tags.controller.ts - Correction décorateur
@Delete(':tagId')  // ← Était @Post(':tagId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTagsController {
  @Delete(':tagId')
  remove(@Param('docId') docId: string, @Param('tagId') tagId: string) {
    return this.tagsService.removeTagFromDocument(docId, tagId);
  }
}
```

### ✅ **Centralisation et Correction Icônes SVG - FINALISÉ**  
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🎯 **Problème Identifié**
- **Diagnostic complet** : Toutes les icônes du site étaient brisées
- **Icônes dupliquées** : Définitions SVG locales dans chaque composant
- **Erreurs compilation** : "Duplicate declaration" lors des imports
- **Maintenance difficile** : Modifications icônes dispersées dans toute l'app

#### 🔧 **Solution Implémentée**
- **Fichier centralisé** : `/frontend/src/components/icons/index.tsx`
- **Interface standardisée** : `IconProps` commune pour toutes les icônes
- **Correction systématique** : Audit complet + correction progressive
- **Compilation validée** : Plus d'erreurs d'icônes manquantes

#### 📋 **Composants Corrigés**
```typescript
// Fichiers mis à jour avec imports centralisés
- DashboardPage.tsx          → ChartPieIcon, DocumentReportIcon, ExclamationCircleIcon, SpinnerIcon, ClockIcon
- AnnouncementsPage.tsx      → SpeakerphoneIcon, ExclamationCircleIcon, SpinnerIcon  
- AnnouncementCard.tsx       → SpeakerphoneIcon, EyeIcon, TrashIcon
- UsersPage.tsx              → UsersIcon, PaperAirplaneIcon, TrashIcon
```

#### 🏗️ **Architecture Centralisée**
```typescript
// Structure du fichier centralisé
/frontend/src/components/icons/index.tsx
├── Interface IconProps commune
├── Icônes de Navigation (SpeakerphoneIcon, UsersIcon, ChartPieIcon)
├── Icônes d'Actions (TrashIcon, EyeIcon, DownloadIcon, SearchIcon)
├── Icônes de Documents (DocumentTextIcon, DocumentReportIcon, UploadIcon)
├── Icônes de Statut (ExclamationTriangleIcon, SpinnerIcon)
└── Icônes Diverses (ClockIcon, PaperAirplaneIcon, XIcon)
```

#### ✨ **Améliorations Techniques**
- **Alias intelligent** : `ExclamationCircleIcon = ExclamationTriangleIcon`
- **Props TypeScript** : Interface `IconProps` avec `className?` optionnel
- **Cohérence visuelle** : Tous les SVG avec strokeWidth={1.5} standardisé
- **Performance** : Suppression définitions dupliquées (réduction bundle)

### ✅ **Module Audits & Actions Correctives - COMPLET**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🎯 **Fonctionnalités Implémentées**
- **Backend complet** : Toutes les entités d'audit (Templates, Items, Executions, Responses, NonConformities, CorrectiveActions)
- **APIs RESTful** : CRUD complet pour tous les modules d'audit avec validation DTOs
- **Frontend intégré** : Pages Audits avec navigation, modales et gestion d'état
- **Sécurité renforcée** : Guards JWT, validation stricte, isolation par tenant

### ✅ **Problèmes Tickets Résolus - FINALISÉ**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🔧 **Upload d'Images dans Tickets**
- **Problème:** Erreur 500 lors upload d'images côté viewer et manager
- **Cause:** Incompatibilité AWS SDK (v2 vs v3) et URL codée en dur
- **Solution:** 
  - Migration complète vers @aws-sdk/client-s3 v3 dans tickets.service.ts
  - Correction URL dynamique dans ImageUpload.tsx et CreateTicketForm.tsx
  - Gestion intercepteur global pour réponses wrappées

#### 🖼️ **Aperçu Images S3/Local**  
- **Problème:** ERR_BLOCKED_BY_RESPONSE.NotSameOrigin pour images locales
- **Cause:** Headers Helmet bloquant accès cross-origin aux fichiers statiques
- **Solution:**
  - URLs présignées S3 avec getSignedUrl (1h expiration)
  - Headers CORS spécifiques pour /uploads/ dans main.ts
  - CSP étendu avec "http://localhost:*" pour imgSrc
  - crossOriginResourcePolicy: false dans Helmet

#### 📋 **Création Tickets Viewer**
- **Problème:** Erreur 400 Bad Request côté viewer  
- **Cause:** Réponse non-extraite de l'intercepteur global
- **Solution:** Ajout pattern response.data || response

### 🛠️ **Améliorations Techniques**

#### Backend (tickets.service.ts)
```typescript
// Migration AWS SDK v3
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// URLs présignées automatiques
private async getPresignedUrlForAttachment(currentUrl: string): Promise<string>
```

#### Frontend 
```typescript
// URLs dynamiques corrigées
${import.meta.env.VITE_API_URL}/tickets/upload-image

// Gestion intercepteur
const response = await res.json();
const created: TicketType = response.data || response;
```

#### Infrastructure (main.ts)
```typescript
// Headers CORS fichiers statiques
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
});
```

### 📈 **Impact & Validation**
- ✅ Upload images fonctionne pour tous les rôles (viewer, manager, admin)
- ✅ Aperçu images S3 avec URLs présignées sécurisées  
- ✅ Aperçu images locales sans erreur CORS
- ✅ Compatibilité mixte S3/local selon configuration
- ✅ Gestion fallback intelligente pour erreurs

### 🔄 **Modules Impactés**
- **tickets.service.ts** - Migration AWS SDK + URLs présignées
- **ImageUpload.tsx** - Correction URL + gestion réponse  
- **CreateTicketForm.tsx** - Correction URL + extraction réponse
- **main.ts** - Headers CORS + CSP étendu
- **AttachmentGallery.tsx** - Compatible URLs présignées