# Configuration OneSignal - Variables d'Environnement

## 🎯 Variables à Ajouter

### Frontend (Vercel)
Dans les Settings de votre projet Vercel, ajoutez :
```
VITE_ONESIGNAL_APP_ID=64f473e7-1196-4bb7-b865-83b8c707a4fe
```

### Backend (Render)
Dans les Environment Variables de votre service Render, ajoutez :
```
ONESIGNAL_APP_ID=64f473e7-1196-4bb7-b865-83b8c707a4fe
ONESIGNAL_API_KEY=os_v2_app_mt2hhzyrszf3podfqo4mob5e7yxviazbrjkesyf7np3nntf5unlvbwf3fwo47ddfuwhhatwdjldm3ucs37jrc7guutyaur7sozo4idi
```

## ✅ Sécurité
- ✅ Clés OneSignal retirées du code source
- ✅ Variables d'environnement configurées
- ✅ Validation ajoutée côté backend
- ✅ Configuration conditionnelle dev/prod

Une fois les variables ajoutées, redéployez les deux services.