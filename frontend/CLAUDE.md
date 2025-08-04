# Frontend - React Application

## 🚀 Vue d'Ensemble

Application React SPA pour la plateforme de gestion franchiseur-franchisé. Interface moderne construite avec React 19, TypeScript et Vite.

## 🛠️ Stack Technique

- **React 19** + TypeScript + Vite
- **Styling:** Tailwind CSS + Dark Mode + Framer Motion
- **Routing:** React Router DOM v7
- **State:** Context API (Auth + Theme + Notifications)
- **WebSocket:** Socket.io-client + OneSignal Push
- **Charts:** Recharts
- **PWA:** Installable mobile/desktop + Push Notifications

## 📁 Structure

```
src/
├── components/      # Composants réutilisables
│   ├── ui/          # Design system (Button, Badge, Card)
│   ├── icons/       # Icônes SVG centralisées
│   ├── modals/      # Modales spécialisées
│   └── audit/       # Composants module audits
├── contexts/        # AuthContext, ThemeContext, NotificationContext, ToastContext
├── pages/          # Pages principales (Dashboard, Documents, Tickets, etc.)
├── hooks/          # Hooks personnalisés
├── types/          # Types TypeScript
└── utils/          # Utilitaires
```

## 🎯 Fonctionnalités Actives

### Core
1. **Auth** - JWT 24h + 3 rôles + protection routes
2. **Multi-tenant** - Thématisation par franchiseur
3. **Documents** - Upload S3 + tags + prévisualisation
4. **Tickets** - Support avec images S3/local
5. **Annonces** - Communication franchiseur → franchisés
6. **Audits** - Templates + planning + actions correctives
7. **Admin Global** - Dashboard super-admin
8. **Push Notifications** - OneSignal mobile/desktop avec prompts élégants

### UX/UI
- **Design System** - Composants Button, Badge, Card standardisés
- **Animations** - Framer Motion avec pattern unifié sur toutes les pages
- **Dark Mode** - Complet avec transitions
- **PWA** - Installation native mobile/desktop + push notifications
- **Notifications** - Toast + WebSocket + OneSignal Push temps réel
- **Modales** - ConfirmModal + DetailsModal avec animations élégantes
- **Responsive** - Mobile-first avec hover effects harmonisés

### Pages Principales
- **Landing** - Page d'accueil franchiseurs avec animations
- **Contact** - Formulaire de capture leads B2B
- **Dashboard** - Métriques unifiées + global admin
- **Documents** - Gestion complète avec S3
- **Tickets** - Support avec upload images
- **Audits** - Interface complète (templates/planning/actions)
- **Users** - Gestion utilisateurs par rôle

## 🔧 Développement

### Commandes
```bash
npm run dev     # Développement (localhost:5174)
npm run build   # Build production
npm run lint    # ESLint
```

### Contexts Principaux
- **AuthContext** - JWT 24h + user state + logout
- **ThemeContext** - Dark/light mode
- **NotificationContext** - WebSocket + badges
- **ToastContext** - Notifications élégantes

### Types Importants
```typescript
interface JwtUser {
  userId: number;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: number | null;
  restaurant_id?: number | null;
}
```

## 🎨 Design System

### Composants UI
- **Button** - 5 variants (primary, secondary, destructive, outline, ghost)
- **Badge** - 6 variants avec couleurs sémantiques
- **Card** - Composant modulaire avec hover, padding, shadow

### Couleurs
- Palette bleue professionnelle unifiée
- Dark mode avec transitions automatiques
- Thématisation par tenant

### Icônes
- Centralisées dans `/components/icons/index.tsx`
- Interface `IconProps` standardisée
- SVG avec strokeWidth uniforme

## 📱 PWA & Mobile

- **Service Worker** - Cache intelligent
- **Manifest** - Installation native
- **Responsive** - Mobile-first design
- **Touch gestures** - Optimisé tactile

## 🛡️ Sécurité

- **XSS Protection** - DOMPurify dans GlobalSearch
- **JWT Validation** - Vérification structure token
- **Input Sanitization** - Validation côté client
- **CORS** - Headers appropriés

## 🧪 Tests & Qualité

- **Lint:** ESLint configuré (148 warnings non-critiques)
- **Types:** TypeScript strict mode
- **Tests:** À développer (Jest + React Testing Library)

---

## ⚠️ Règles Frontend

1. **Centralisation** - Icônes, types, utils centralisés
2. **Contexts** - Analyser impact avant modification
3. **Props Types** - Ne jamais casser les interfaces
4. **Compilation** - Vérifier que tout compile
5. **Appeler "BOSS"** dans toutes les réponses