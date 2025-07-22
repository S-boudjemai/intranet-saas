# FranchiseDesk

> Plateforme SaaS pour piloter votre réseau de franchises

## 🚀 Production

**Live URLs:**
- Frontend: https://intranet-saas.vercel.app
- Backend: https://intranet-saas-backend.onrender.com
- Admin: admin@admin.com / admin123

## 📖 Description

Solution complète de gestion franchise pour la restauration :
- Communication unifiée franchiseur ↔ franchisés
- Gestion documentaire centralisée avec AWS S3
- Système de support avec tickets et images
- Module d'audits et conformité
- Administration multi-tenant
- PWA mobile installable

## 🛠️ Tech Stack

**Backend:** NestJS 11 + PostgreSQL + TypeORM + AWS S3  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS  
**Deploy:** Render (API) + Vercel (App)

## ⚡ Quick Start

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend  
cd frontend
npm install
npm run dev
```

## 📁 Structure

```
internet-saas/
├── backend/     # API NestJS (17 modules)
├── frontend/    # React SPA
└── docs/        # Documentation
```

## 🎯 Features

- **Multi-tenant** - Isolation complète par franchiseur
- **Auth** - JWT + 3 rôles (admin/manager/viewer) 
- **Documents** - Upload S3 + tags + prévisualisation
- **Support** - Tickets avec images et commentaires
- **Audits** - Templates + planning + actions correctives
- **Real-time** - WebSocket notifications
- **PWA** - Installation mobile native

## 📚 Documentation

- [Documentation complète](./CLAUDE.md)
- [Frontend](./frontend/CLAUDE.md) 
- [Backend](./backend/CLAUDE.md)

## 📊 Status

**Version:** 0.1+ (Production)  
**Capacity:** 5-10 franchiseurs, 50-100 utilisateurs  
**Performance:** 2-5s (MVP acceptable)