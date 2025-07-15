# Frontend - React Application

## ⚠️ RÈGLES CRITIQUES FRONTEND - À RESPECTER ABSOLUMENT

### 🚨 VISION PÉRIPHÉRIQUE OBLIGATOIRE
**AVANT TOUTE MODIFICATION FRONTEND, ANALYSER L'IMPACT GLOBAL**
- ✅ Modification Context → Vérifier impact sur TOUS les composants consommateurs
- ✅ Modification types → Vérifier compatibilité avec TOUTES les interfaces
- ✅ Modification AuthContext → Vérifier impact sur TOUS les guards et routes
- ✅ Modification API calls → Vérifier compatibilité avec backend et contrats
- ❌ NE JAMAIS modifier sans vérifier les dépendances
- ❌ NE JAMAIS casser les props/types existants sans validation

### 📋 PROTOCOLE FRONTEND OBLIGATOIRE
1. **IDENTIFIER** le composant/contexte concerné
2. **ANALYSER** tous les composants qui l'utilisent
3. **DEMANDER** confirmation avant modification d'interface
4. **VÉRIFIER** que l'application compile sans erreurs
5. **TERMINER** chaque phrase en appelant l'utilisateur "Sofiane"

## Description

Interface utilisateur React pour la plateforme de gestion franchiseur-franchisé. Application SPA (Single Page Application) construite avec React 19, TypeScript, et Vite.

## Stack Technique

- **React 19** avec TypeScript
- **Vite** - Build tool et dev server
- **React Router DOM v7** - Routing côté client
- **Tailwind CSS** - Framework CSS utility-first
- **Context API** - Gestion d'état (Auth + Theme)
- **Recharts** - Bibliothèque de graphiques
- **React Icons** - Icônes
- **JWT-decode** - Décodage des tokens JWT
- **Socket.io-client** - WebSocket pour notifications temps réel

## Structure du Projet

```
frontend/src/
├── components/          # Composants réutilisables
│   ├── AnnouncementCard.tsx
│   ├── CategoryTree.tsx
│   ├── CityAutocomplete.tsx
│   ├── ConfirmModal.tsx
│   ├── CreateAnnouncementForm.tsx
│   ├── CreateTicketForm.tsx
│   ├── DocumentCard.tsx
│   ├── DocumentPreviewModal.tsx
│   ├── DocumentsList.tsx
│   ├── KipCard.tsx
│   ├── ManageTagsModal.tsx
│   ├── MultiSelect.tsx
│   ├── NavBar.tsx
│   ├── NotificationBadge.tsx
│   ├── ProtectedRoute.tsx
│   ├── ThemeSwitcher.tsx
│   ├── TicketItem.tsx
│   ├── UploadDocument.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       └── Card.tsx
├── contexts/            # Contextes React
│   ├── AuthContext.tsx        # Gestion de l'authentification
│   ├── NotificationContext.tsx # Gestion des notifications temps réel
│   └── ThemeContext.tsx       # Gestion du thème
├── data/                # Données statiques
│   └── french-cities.ts # Liste des villes françaises
├── pages/               # Pages/vues principales
│   ├── AnnouncementsPage.tsx
│   ├── DashboardPage.tsx
│   ├── DocumentsPage.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── TicketsPages.tsx
│   └── UsersPage.tsx
├── types/               # Définitions TypeScript
│   └── index.ts
├── utils/               # Utilitaires
│   └── jwt.ts
├── App.tsx              # Composant racine
└── main.tsx             # Point d'entrée
```

## Fonctionnalités

### 1. Authentification
- Login/Signup avec JWT
- Persistence du token via localStorage
- Context `AuthContext` pour la gestion globale
- Protection des routes avec `ProtectedRoute`
- Déconnexion automatique lors de l'expiration

### 2. Routing
- Routing avec React Router DOM v7
- Routes publiques: `/`, `/login`, `/signup`
- Routes protégées: `/dashboard`, `/documents`, `/tickets`, `/announcements`, `/users`
- Navigation conditionnelle (NavBar visible uniquement si connecté)

### 3. Gestion des Thèmes
- Context `ThemeContext` pour le thème
- Support du mode sombre/clair
- Composant `ThemeSwitcher` pour basculer
- Intégration avec Tailwind CSS

### 4. Système de Notifications Temps Réel ⚡
- **WebSocket client** avec Socket.io
- **Pastilles rouges** animées sur navbar (Documents, Tickets, Annonces)
- **Notifications automatiques** : upload document, création annonce/ticket, nouveau restaurant
- **Lecture au survol** : notifications supprimées automatiquement
- **Context NotificationContext** pour gestion globale
- **Badge NotificationBadge** avec compteurs dynamiques

### 5. Composants UI

**Design System**
- `Button`: 5 variants (primary, secondary, destructive, outline, ghost) + 3 tailles
- `Badge`: 6 variants avec couleurs sémantiques 
- `Card`: Composant modulaire avec hover, padding, shadow configurables
- **Couleurs unifiées** : Palette bleue professionnelle, abandon du vert lime

**Documents**
- `DocumentsList`: Liste des documents avec pagination
- `DocumentCard`: Card pour afficher un document
- `UploadDocument`: Interface d'upload
- `DocumentPreviewModal`: Prévisualisation des documents
- `ManageTagsModal`: Gestion des tags

**Tickets**
- `CreateTicketForm`: Formulaire de création
- `TicketItem`: Affichage d'un ticket
- Support des commentaires et changements de statut

**Annonces**
- `AnnouncementCard`: Affichage d'une annonce
- `CreateAnnouncementForm`: Création d'annonces

**Navigation**
- `NavBar`: Navigation principale avec pastilles de notification
- `NotificationBadge`: Compteurs rouges animés
- Navigation adaptative selon le rôle utilisateur

**Utilitaires**
- `MultiSelect`: Sélection multiple
- `ConfirmModal`: Modal de confirmation
- `CategoryTree`: Arbre de catégories
- `CityAutocomplete`: Autocomplete villes françaises (300+ villes)

### 6. Types TypeScript

Définitions dans `src/types/index.ts`:
- `DocumentType`, `TicketType`, `Announcement`
- `TagType`, `CommentType`, `RestaurantInfo`
- `InviteType`

## Commandes

```bash
# Installation des dépendances
npm install

# Développement (http://localhost:5174)
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Linting
npm run lint
```

## Configuration

### Vite
- Configuration dans `vite.config.ts`
- Plugin React avec Fast Refresh
- Proxy vers l'API backend si nécessaire

### Tailwind CSS
- Configuration dans `tailwind.config.js`
- Classes utilitaires pour le styling
- Support des thèmes sombre/clair

### TypeScript
- Configuration dans `tsconfig.json` et `tsconfig.app.json`
- Types stricts activés
- Support des modules ES

## Architecture

### Context Pattern
- `AuthContext`: Gestion de l'utilisateur connecté, login/logout
- `ThemeContext`: Gestion du thème (dark/light mode)
- `NotificationContext`: Gestion des notifications temps réel + WebSocket

### Composants
- Composants fonctionnels avec hooks
- Props typées avec TypeScript
- Patterns de composition

### État Local
- `useState` pour l'état local des composants
- `useEffect` pour les effets de bord
- Context API pour l'état global

## API Integration

### Communication Backend
- **Fetch API** pour les requêtes HTTP REST
- **Socket.io** pour les WebSockets temps réel
- Gestion des headers d'authentification (Bearer token)
- Gestion des erreurs réseau

### Endpoints Principaux
- `/auth/login` - Authentification
- `/documents` - Gestion des documents
- `/tickets` - Gestion des tickets
- `/announcements` - Gestion des annonces
- `/users` - Gestion des utilisateurs
- `/notifications/unread-counts` - Compteurs notifications
- `/notifications/views` - Enregistrement des vues

### WebSocket Events
- `document_uploaded` - Nouveau document uploadé
- `announcement_posted` - Nouvelle annonce créée
- `ticket_created` - Nouveau ticket créé
- `ticket_updated` - Ticket mis à jour/commenté
- `restaurant_joined` - Nouveau restaurant rejoint

## Développement

### Conventions
- Composants en PascalCase
- Hooks et utilitaires en camelCase
- Types/interfaces en PascalCase
- Fichiers en PascalCase pour les composants

### Styling
- Tailwind CSS pour tout le styling
- Classes conditionnelles pour les thèmes
- Responsive design avec les breakpoints Tailwind

### Performance
- Lazy loading des composants si nécessaire

---

## 🎉 **CORRECTIONS FRONTEND RÉCENTES** (Juillet 2025)

### ✅ **Système d'Archivage Audits - Interface Complète**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🎯 **Composant PlanningTab.tsx - Nouvelles Fonctionnalités**
- **Bouton Archiver** : Ajout à côté du badge "Terminé" pour audits completed/reviewed
- **Permissions** : Affichage conditionnel selon rôle utilisateur (admin/manager uniquement)
- **Modale confirmation** : Intégration ConfirmModal avec contexte détaillé de l'audit

#### 🎨 **UX/UI Améliorée**
```tsx
// StatusBadgeWithArchive - Composant final
<div className="flex items-center gap-2">
  {getStatusBadge(status)}
  
  {isCompleted && canArchive && (
    <button 
      className="bg-orange-50 hover:bg-orange-100 text-orange-600 rounded border border-orange-200"
      onClick={() => handleArchiveClick(execution)}
    >
      <ArchiveIcon className="w-3 h-3" />
      Archiver
    </button>
  )}
</div>
```

#### 🔧 **Gestion d'État et API**
- **État local** : `archivingId`, `showArchiveModal`, `auditToArchive`
- **API call** : `POST /audit-archives/archive/{executionId}` avec gestion erreurs
- **Feedback** : Spinner pendant requête + rechargement liste après succès

#### 📋 **Corrections Appliquées**
- **Erreur HTML** : Remplacement `<div>` par `<>` dans modale pour éviter erreur hydratation
- **TypeScript** : Correction types `RestaurantInfo` avec casting `(r as any).city`
- **Workflow UX** : Archivage → Disparition audit → Confirmation visuelle

### ✅ **Correction Gestion Tags Documents**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 🔍 **Problème DocumentsPage.tsx**
- **Erreur 404** : Route `DELETE /documents/{docId}/tags/{tagId}` introuvable
- **Cause** : Backend avec décorateur incorrect `@Post` au lieu de `@Delete`
- **Solution** : Correction côté backend, frontend déjà correct

#### 🛠️ **Code Frontend Validé**
```typescript
// DocumentsPage.tsx - Appel DELETE correct
const removePromises = tagsToRemove.map((tagId) =>
  fetch(`${import.meta.env.VITE_API_URL}/documents/${docId}/tags/${tagId}`, {
    method: "DELETE",  // ← Méthode correcte
    headers: { Authorization: `Bearer ${token}` },
  })
);
```

### ✅ **Centralisation Icônes SVG - Impact Frontend**
**Date:** 15 Juillet 2025 (Aujourd'hui)

#### 📦 **Fichier Central : /src/components/icons/index.tsx**
- **Architecture** : Interface `IconProps` commune + exports centralisés
- **Corrections** : Toutes les icônes brisées dans DashboardPage, AnnouncementsPage, etc.
- **Performance** : Suppression définitions dupliquées, réduction bundle size

#### 🔧 **Composants Corrigés**
```typescript
// Import centralisé dans tous les composants
import { 
  ArchiveIcon, 
  ChartPieIcon, 
  DocumentReportIcon, 
  ExclamationCircleIcon,
  SpinnerIcon,
  ClockIcon 
} from '../components/icons';
```

### 📊 **Impact Global Frontend**
- ✅ **Audit System** : Interface complète avec archivage fonctionnel
- ✅ **Documents** : Gestion tags opérationnelle sans erreurs
- ✅ **Icônes** : Toutes les icônes centralisées et fonctionnelles
- ✅ **UX/UI** : Modales élégantes remplaçant alerts natives
- ✅ **TypeScript** : Types corrigés, compilation sans erreurs
- Optimisation des re-rendus avec useCallback/useMemo
- Images optimisées

## Sécurité

- Validation côté client (complément de la validation backend)
- Échappement XSS automatique avec React
- Gestion sécurisée des tokens JWT
- HTTPS en production

## 🚨 ROADMAP - Actions Prioritaires & Nouvelles Fonctionnalités

### 🔴 CRITICAL - Sécurité (Semaine 1)
- [ ] **Corriger XSS vulnerability** - GlobalSearch.tsx:154 dangerouslySetInnerHTML
- [ ] **Cookies httpOnly JWT** - Migration localStorage vers cookies sécurisés
- [ ] **Refresh automatique tokens** - Auto-renouvellement transparent
- [ ] **Error Boundary** - Gestion globale erreurs React
- [ ] **Input sanitization** - Validation/nettoyage données utilisateur

### 🟡 HIGH PRIORITY - Qualité Code (Mois 1)
- [ ] **Tests complets** - Jest/React Testing Library + Playwright E2E
- [ ] **Performance optimization** - React.memo, useMemo, useCallback
- [ ] **Code splitting** - Lazy loading pages + routes
- [ ] **Bundle optimization** - Analyse taille, tree shaking
- [ ] **Types stricts** - Interface JwtUser unifiée
- [ ] **Cache API** - React Query ou SWR pour requêtes

### 🚀 NEW FEATURES - Module Conformité & Audits

#### 📋 Audit Templates Management
- [ ] **Page AuditTemplatesPage** - CRUD templates d'audit
- [ ] **Component AuditTemplateForm** - Création/édition templates
- [ ] **Component QuestionBuilder** - Builder questions dynamique
- [ ] **Component TemplateLibrary** - Bibliothèque templates prédéfinis

#### 🎯 Audit Execution Interface
- [ ] **Page AuditExecutionPage** - Interface audit sur le terrain
- [ ] **Component AuditChecklist** - Checklist interactive
- [ ] **Component PhotoCapture** - Capture photos preuves
- [ ] **Component OfflineSync** - Synchronisation hors ligne
- [ ] **Component AuditProgress** - Barre progression audit

#### 📊 Non-Conformity Management
- [ ] **Page NonConformitiesPage** - Dashboard non-conformités
- [ ] **Component NCReport** - Formulaire rapport NC
- [ ] **Component ActionPlan** - Plan actions correctives
- [ ] **Component DeadlineTracker** - Suivi échéances
- [ ] **Component SeverityBadge** - Badges gravité NC

#### 🔄 Corrective Actions Dashboard
- [ ] **Page CorrectiveActionsPage** - Suivi actions
- [ ] **Component ActionCard** - Card action individuelle
- [ ] **Component ProgressTracker** - Tracker avancement
- [ ] **Component AssignmentModal** - Attribution actions
- [ ] **Component VerificationForm** - Formulaire vérification

#### 📱 Mobile-Optimized Components
- [ ] **Component MobileAuditForm** - Interface mobile-first
- [ ] **Component TouchGestures** - Gestes tactiles
- [ ] **Component OfflineIndicator** - Indicateur connexion
- [ ] **Component VoiceNotes** - Notes vocales (optionnel)

### 📱 PWA & Offline Support

#### 🔌 Progressive Web App
- [ ] **Service Worker config** - Vite PWA plugin
- [ ] **App Manifest** - Configuration installable
- [ ] **Install prompt** - Bouton installation personnalisé
- [ ] **Update notification** - Alertes nouvelles versions
- [ ] **Background sync** - Sync data en arrière-plan

#### 💾 Offline Capabilities
- [ ] **IndexedDB integration** - Dexie.js pour cache local
- [ ] **Offline document viewer** - Lecture hors ligne
- [ ] **Queue system** - Actions différées
- [ ] **Conflict resolution** - Résolution conflits sync
- [ ] **Network detection** - Détection état réseau

### 📊 Analytics & Reporting Frontend

#### 📈 Advanced Dashboard
- [ ] **Component ComplianceChart** - Graphiques conformité
- [ ] **Component TrendAnalysis** - Analyse tendances
- [ ] **Component BenchmarkComparison** - Comparaisons
- [ ] **Component AlertsWidget** - Widget alertes
- [ ] **Component ExportTools** - Export PDF/Excel

#### 🎯 Real-time Updates
- [ ] **WebSocket audit events** - Notifications temps réel
- [ ] **Live status updates** - Statuts actions en live
- [ ] **Auto-refresh views** - Actualisation automatique

### 🎨 UI/UX Enhancements

#### 🎯 Audit-Specific Design
- [ ] **Audit theme variants** - Couleurs dédiées audits
- [ ] **Progress indicators** - Indicateurs visuels avancement
- [ ] **Status badges** - Badges statuts conformité
- [ ] **Priority indicators** - Indicateurs priorité
- [ ] **Photo gallery** - Galerie photos preuves

#### 📱 Mobile Experience
- [ ] **Touch-friendly controls** - Contrôles tactiles optimisés
- [ ] **Swipe gestures** - Gestes de navigation
- [ ] **Responsive layouts** - Layouts mobile-first
- [ ] **Accessibility features** - Support écran lecteur

### 🔒 Security & Privacy

#### 🛡️ Enhanced Security
- [ ] **CSP headers validation** - Content Security Policy
- [ ] **XSS protection** - Protection renforcée
- [ ] **Data encryption** - Chiffrement données sensibles
- [ ] **Permission system** - Granularité permissions UI

#### 🔐 Privacy Compliance
- [ ] **GDPR compliance** - Conformité données personnelles
- [ ] **Data retention** - Politique rétention
- [ ] **Audit trails** - Journaux audit UI

### ⚡ Performance & Optimization

#### 🚀 Core Performance
- [ ] **Lazy loading routes** - Routes paresseuses
- [ ] **Component memoization** - Optimisation re-renders
- [ ] **Image optimization** - WebP, lazy loading images
- [ ] **Virtual scrolling** - Listes longues optimisées
- [ ] **Bundle splitting** - Chunks intelligents

#### 💾 Caching Strategy
- [ ] **API response cache** - Cache réponses API
- [ ] **Asset caching** - Cache ressources statiques
- [ ] **Intelligent prefetch** - Préchargement prédictif

## 🎉 NOUVELLES FONCTIONNALITÉS IMPLÉMENTÉES (Décembre 2024)

### ✅ Module Actions Correctives - Interface Complète

#### 🔍 Modal de Détails Avancé
- **CorrectiveActionDetailsModal** : Vue complète des actions correctives
- **Informations détaillées** : Description, assignation, échéances, notes
- **Statuts visuels** : Badges avec icônes et couleurs sémantiques  
- **Indicateurs de retard** : Alertes visuelles pour échéances dépassées
- **Gestion des permissions** : Actions selon le rôle utilisateur (admin/manager)
- **Support responsive** : Optimisé mobile et desktop

#### 🎯 Fonctionnalités Interactives
- ✅ **Bouton "Voir"** : Ouverture modal avec toutes les informations
- ✅ **Bouton "Marquer terminée"** : Changement de statut avec API PUT
- ✅ **Bouton "Vérifier"** : Pour les actions terminées (futurs développements)
- ✅ **Gestion des non-conformités** : Affichage conditionnel selon liaison

#### 📊 Vue Contextuelle
- **Actions liées** : Affichage de la non-conformité associée si existante
- **Actions générales** : Support des actions non liées à une NC spécifique
- **Métriques temps** : Calcul automatique des jours jusqu'échéance
- **Historique** : Dates de création, modification, completion

### ✅ Module Templates d'Audit - Interface Professionnelle

#### 🔍 Modal de Détails Complet
- **AuditTemplateDetailsModal** : Vue exhaustive des templates
- **Statistiques visuelles** : Questions totales, obligatoires, score max, durée
- **Liste des questions** : Affichage ordonné avec types et badges
- **Catégorisation** : Icônes et couleurs par catégorie (hygiène, sécurité, qualité)
- **Actions template** : Modifier, supprimer selon permissions

#### 📋 Affichage des Questions
- **Questions triées** : Par ordre défini dans le template
- **Types visuels** : Badges pour Oui/Non, Score, Texte, Photo
- **Questions obligatoires** : Marquage visuel distinctif
- **Textes d'aide** : Affichage des help_text si disponibles
- **Score maximum** : Pour les questions notées

### 🎨 Améliorations UX/UI Générales

#### ✨ Système de Modales Élégant
- **ConfirmModal** : Remplacement des window.confirm() disgracieux
- **Design cohérent** : Intégration complète avec le design system
- **Icônes contextuelles** : Triangle d'alerte pour les confirmations
- **Messages détaillés** : Contexte spécifique (nom template, nombre questions)
- **Actions claires** : Boutons "Confirmer" (rouge) et "Annuler"

#### 🔔 Système de Notifications Toast
- **Toast Component** : Notifications élégantes et non-intrusives
- **4 types visuels** : Success (vert), Error (rouge), Warning (jaune), Info (bleu)
- **Animations fluides** : Slide-in depuis la droite avec CSS animations
- **Auto-fermeture** : Disparition automatique après 3 secondes
- **Fermeture manuelle** : Bouton X pour fermeture immédiate
- **Positionnement** : Top-right fixe avec z-index élevé

#### 🎭 Animations CSS Personnalisées
```css
.animate-slide-in-right   # Animation d'entrée des toasts
.animate-fade-in          # Fade pour les overlays de modales
.animate-scale-in         # Scale pour les contenus de modales
```

### 🔧 Améliorations Techniques Frontend

#### 📡 Gestion des APIs
- **Calls asynchrones** : Tous les appels API avec async/await
- **Error handling** : Gestion des erreurs réseau et serveur
- **Loading states** : États de chargement pour toutes les actions
- **Data refresh** : Rechargement automatique après modifications

#### 🛡️ Gestion des États
- **État local optimisé** : useState pour modales et sélections
- **Context API** : AuthContext pour permissions et rôles
- **Conditional rendering** : Affichage selon permissions et statuts
- **Form validation** : Validation côté client avant envoi

#### 🎯 Types TypeScript Renforcés
```typescript
interface CorrectiveAction {
  // Définition complète avec toutes les relations
  non_conformity?: NonConformity | null;
  assigned_user: User;
  verifier?: User;
}

interface AuditTemplate {
  // Structure avec items et relations
  items: AuditItem[];
  creator?: User;
}
```

### 📱 Responsive Design Amélioré

#### 💻 Desktop Experience
- **Modales grandes** : max-w-4xl et max-w-5xl pour le contenu riche
- **Grilles adaptatives** : grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Tooltips et hover** : États interactifs pour les boutons
- **Keyboard navigation** : Support touches Escape pour fermer modales

#### 📱 Mobile Optimization
- **Touch-friendly** : Boutons et zones de clic adaptées
- **Scroll optimisé** : max-h-[70vh] avec overflow-y-auto
- **Responsive grids** : Collapse intelligent des colonnes
- **Modal fullscreen** : Adaptation automatique sur petits écrans

### 🔍 Accessibilité Renforcée

#### ♿ Standards WCAG
- **Aria labels** : Labels descriptifs pour les actions
- **Contrast ratios** : Respect des ratios de contraste
- **Focus management** : Gestion du focus dans les modales
- **Screen reader** : Textes alternatifs et descriptions

#### ⌨️ Navigation Clavier
- **Tab order** : Ordre logique de navigation
- **Escape key** : Fermeture des modales
- **Enter/Space** : Activation des boutons
- **Focus visible** : Indicateurs visuels de focus

---

## 🎉 **CORRECTIONS FRONTEND RÉCENTES** (Décembre 2024)

### ✅ **Upload & Aperçu Images Tickets**
**Date:** 14 Décembre 2024

#### 🔧 **ImageUpload Component**
- **Problème:** URL codée en dur + gestion intercepteur
- **Correction:** URL dynamique + extraction réponse
```typescript
// Avant
await fetch('http://localhost:3000/tickets/upload-image', {

// Après  
await fetch(`${import.meta.env.VITE_API_URL}/tickets/upload-image`, {

// Gestion intercepteur
const json = await response.json();
const attachment: TicketAttachment = json.data || json;
```

#### 📋 **CreateTicketForm Component**
- **Problème:** Erreur 400 côté viewer + URL codée
- **Correction:** Extraction réponse + URL dynamique
```typescript
// Extraction réponse ticket créé
const response = await res.json();
const created: TicketType = response.data || response;

// URL d'upload corrigée
await fetch(`${import.meta.env.VITE_API_URL}/tickets/upload-image`, {
```

#### 🖼️ **AttachmentGallery Component**
- **Fonctionnalité:** Compatible URLs présignées S3
- **Support:** Aperçu modal + téléchargement
- **Format:** Responsive grid avec lazy loading
```typescript
// Affichage image optimisé
<img
  src={attachment.url} // URLs présignées automatiques
  alt={attachment.filename}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

### 🛠️ **Améliorations UX/UI**

#### 📱 **Upload Mobile-First**
- **Drag & Drop:** Zone interactive tactile
- **Prévisualisation:** Grid responsive 2-3-4 colonnes
- **Validation:** Feedback immédiat taille/type
- **Progress:** États loading avec spinners

#### 🎯 **Feedback Utilisateur**
- **États visuels:** Upload, succès, erreur
- **Validation:** Client-side avant envoi API
- **Tooltips:** Informations formats supportés
- **Animations:** Transitions fluides hover/focus

### 📊 **Performance Frontend**
- **Lazy Loading:** Images différées pour galerie
- **Optimisation:** Prévisualisation thumbnails
- **Cache:** URLs présignées valides 1h
- **Bundle:** Pas d'impact taille (même librairies)

### 🔒 **Sécurité Frontend**
- **Validation types:** MIME type strict côté client
- **Taille limite:** 5MB par image
- **Sanitization:** Noms fichiers nettoyés
- **CORS handled:** Backend gère headers automatiquement