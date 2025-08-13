# Configuration des Environnements Frontend

## 🎯 Système de Détection Automatique

Le frontend détecte automatiquement l'environnement et utilise la bonne API :

### Priorités (dans l'ordre) :
1. **`.env.local`** (si présent) - Pour le développement local
2. **`.env`** - Configuration de production
3. **Détection automatique** basée sur l'URL :
   - `localhost` → `http://localhost:3000`
   - `vercel.app` → `https://intranet-saas-backend.onrender.com`

## 💻 Développement Local

### Option 1 : Avec `.env.local` (RECOMMANDÉ)
Créer un fichier `.env.local` dans `/frontend` :
```env
VITE_API_URL=http://localhost:3000
```

### Option 2 : Sans configuration
Le système détecte automatiquement `localhost` et utilise `http://localhost:3000`

## 🚀 Production

Le fichier `.env` contient la configuration de production :
```env
VITE_API_URL=https://intranet-saas-backend.onrender.com
```

## ✅ Avantages

1. **Pas de conflit Git** - `.env.local` n'est jamais commité
2. **Zéro configuration** - Fonctionne out-of-the-box en local
3. **Détection intelligente** - S'adapte automatiquement à l'environnement
4. **Override facile** - `.env.local` surcharge tout si nécessaire

## 📝 Notes

- `.env.local` est dans `.gitignore` (pattern `*.local`)
- La détection est visible dans la console en mode dev
- Vite charge automatiquement `.env.local` s'il existe