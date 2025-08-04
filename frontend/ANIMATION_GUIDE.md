# 🎭 Guide Animations Uniformes - FranchiseDesk

## 🎯 **OBJECTIF**
Harmoniser toutes les animations de pages avec le même système que **AuditsPage**

## ✅ **SYSTÈME UNIFORME CRÉÉ**

### 1. **Classes CSS Prêtes**
```css
.page-enter      /* Header de page */
.page-content    /* Contenu principal */
.page-card       /* Cards individuelles */
.page-list-item  /* Items de liste (avec stagger auto) */
```

### 2. **Composants React Prêts**
```typescript
import { PageHeader, PageContent, PageCard, PageList } from '../components/ui/PageAnimations';
```

## 🚀 **COMMENT HARMONISER UNE PAGE**

### **AVANT (pages inconsistantes)**
```tsx
// Différents délais, durées, easing...
<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
  <h1>Titre</h1>
</motion.div>
```

### **APRÈS (système uniforme)**
```tsx
<PageHeader>  {/* Même animation que AuditsPage */}
  <h1>Titre</h1>
</PageHeader>

<PageContent>  {/* Fade uniforme */}
  <div className="grid">
    {items.map(item => (
      <div key={item.id} className="page-card">  {/* Ou utiliser PageCard */}
        {item.content}
      </div>
    ))}
  </div>
</PageContent>
```

## 📋 **PAGES À HARMONISER**

### ✅ **Déjà fait**
- `AuditsPage.tsx` (référence)
- `DashboardPage.tsx` (partiellement)

### 🔄 **À faire**
1. `DocumentsPage.tsx`
2. `TicketsPages.tsx` 
3. `UsersPage.tsx`
4. `AnnouncementsPageNew.tsx`
5. `PlanningPage.tsx`

## 🎨 **PATTERN TYPE AUDITPAGE**

```tsx
// Header standard
<PageHeader>
  <h1 className="text-3xl font-bold text-foreground mb-2">
    Titre Page
  </h1>
  <p className="text-muted-foreground">
    Description
  </p>
</PageHeader>

// Navigation tabs si besoin
<PageContent delay={0.1}>
  <div className="border-b border-border">
    <nav className="-mb-px flex space-x-8">
      {/* tabs */}
    </nav>
  </div>
</PageContent>

// Contenu principal
<PageContent key={activeTab} className="transition-opacity">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item, index) => (
      <div key={item.id} className="page-card">
        {/* contenu card */}
      </div>
    ))}
  </div>
</PageContent>
```

## ⚡ **RÉSULTAT ATTENDU**

- **Cohérence** : Toutes les pages ont les mêmes timings d'animation
- **Performance** : Animations CSS natives (pas Framer Motion partout)
- **Accessibilité** : Respect automatic de `prefers-reduced-motion`
- **Maintenance** : Un seul endroit pour modifier les animations

## 🛠️ **MIGRATION RAPIDE**

Pour chaque page :
1. Importer `PageHeader`, `PageContent`, `PageCard`
2. Remplacer les `motion.div` par les composants
3. Ajouter `className="page-card"` sur les éléments de liste
4. Tester que l'animation est fluide

---

**Note** : Les animations sont désactivées automatiquement si l'utilisateur a `prefers-reduced-motion: reduce`