# 🔧 API Admin - Exemples d'Utilisation

## 🔐 Authentification Admin

D'abord, vous devez obtenir un token JWT avec le rôle `admin`.

```bash
# 1. Créer un super admin (une seule fois)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@platform.com",
    "password": "AdminSecure123!",
    "role": "admin"
  }'

# 2. Se connecter pour obtenir le token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@platform.com",
    "password": "AdminSecure123!"
  }'
```

**Réponse login :**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "superadmin@platform.com",
      "role": "admin"
    }
  }
}
```

---

## 🏢 Gestion des Tenants

### Créer un tenant

```bash
curl -X POST http://localhost:3000/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace Franchise",
    "primaryColor": "#E53E3E",
    "secondaryColor": "#38A169",
    "backgroundColor": "#FFFAF0",
    "textColor": "#1A202C",
    "restaurant_type": "pizzeria"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Pizza Palace Franchise",
    "primaryColor": "#E53E3E",
    "secondaryColor": "#38A169",
    "backgroundColor": "#FFFAF0",
    "textColor": "#1A202C",
    "restaurant_type": "pizzeria",
    "createdAt": "2025-07-16T01:15:30.123Z"
  }
}
```

### Lister tous les tenants

```bash
curl -X GET "http://localhost:3000/admin/tenants?page=1&limit=10&search=pizza" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 2,
        "name": "Pizza Palace Franchise",
        "primaryColor": "#E53E3E",
        "secondaryColor": "#38A169",
        "createdAt": "2025-07-16T01:15:30.123Z",
        "restaurants": [
          {
            "id": 3,
            "name": "Pizza Palace Centre-Ville",
            "city": "Paris"
          }
        ],
        "userCount": 5
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### Récupérer un tenant spécifique

```bash
curl -X GET http://localhost:3000/admin/tenants/2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mettre à jour un tenant

```bash
curl -X PUT http://localhost:3000/admin/tenants/2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace Franchise Premium",
    "primaryColor": "#C53030"
  }'
```

### Supprimer un tenant

```bash
curl -X DELETE http://localhost:3000/admin/tenants/2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Statistiques d'un tenant

```bash
curl -X GET http://localhost:3000/admin/tenants/2/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": 2,
      "name": "Pizza Palace Franchise",
      "createdAt": "2025-07-16T01:15:30.123Z"
    },
    "statistics": {
      "totalUsers": 8,
      "activeUsers": 7,
      "inactiveUsers": 1,
      "totalRestaurants": 3,
      "totalDocuments": 45,
      "usersByRole": {
        "admin": 1,
        "manager": 4,
        "viewer": 3
      }
    }
  }
}
```

---

## 👥 Gestion des Utilisateurs

### Créer un utilisateur sans invitation

```bash
curl -X POST http://localhost:3000/admin/tenants/2/users/bypass-invite \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@pizzapalace.com",
    "password": "SecurePass123!",
    "role": "manager",
    "restaurant_id": 3
  }'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "email": "manager@pizzapalace.com",
    "role": "manager",
    "tenant_id": 2,
    "restaurant_id": 3,
    "is_active": true,
    "created_at": "2025-07-16T01:20:15.456Z"
  }
}
```

### Lister les utilisateurs d'un tenant

```bash
curl -X GET "http://localhost:3000/admin/tenants/2/users?page=1&limit=10&role=manager&active=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 15,
        "email": "manager@pizzapalace.com",
        "role": "manager",
        "is_active": true,
        "created_at": "2025-07-16T01:20:15.456Z",
        "restaurant_id": 3,
        "restaurant": {
          "id": 3,
          "name": "Pizza Palace Centre-Ville",
          "city": "Paris"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### Récupérer un utilisateur spécifique

```bash
curl -X GET http://localhost:3000/admin/tenants/2/users/15 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mettre à jour un utilisateur

```bash
curl -X PUT http://localhost:3000/admin/tenants/2/users/15 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.manager@pizzapalace.com",
    "role": "admin"
  }'
```

### Activer/Désactiver un utilisateur

```bash
curl -X POST http://localhost:3000/admin/tenants/2/users/15/toggle-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Supprimer un utilisateur

```bash
curl -X DELETE http://localhost:3000/admin/tenants/2/users/15 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📁 Gestion des Catégories

### Créer une catégorie principale

```bash
curl -X POST http://localhost:3000/admin/tenants/2/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizzas Spéciales"
  }'
```

### Créer une sous-catégorie

```bash
curl -X POST http://localhost:3000/admin/tenants/2/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizzas Végétariennes",
    "parentId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Lister les catégories d'un tenant

```bash
curl -X GET http://localhost:3000/admin/tenants/2/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mettre à jour une catégorie

```bash
curl -X PUT http://localhost:3000/admin/tenants/2/categories/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizzas Végétariennes Premium"
  }'
```

### Supprimer une catégorie

```bash
curl -X DELETE http://localhost:3000/admin/tenants/2/categories/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📄 Gestion des Documents

### Lister les documents d'un tenant

```bash
curl -X GET "http://localhost:3000/admin/tenants/2/documents?page=1&limit=10&search=menu&category=550e8400-e29b-41d4-a716-446655440000&fileType=pdf" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "doc-550e8400-e29b-41d4-a716-446655440000",
        "filename": "menu-pizzas-2025.pdf",
        "original_name": "Menu Pizzas Janvier 2025.pdf",
        "file_type": "application/pdf",
        "file_size": 2048576,
        "created_at": "2025-07-16T01:30:00.000Z",
        "category": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Menus"
        },
        "tags": [
          {
            "id": "tag-550e8400-e29b-41d4-a716-446655440000",
            "name": "2025"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### Récupérer un document spécifique

```bash
curl -X GET http://localhost:3000/admin/tenants/2/documents/doc-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mettre à jour un document

```bash
curl -X PUT http://localhost:3000/admin/tenants/2/documents/doc-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "original_name": "Menu Pizzas Février 2025.pdf",
    "category_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### Supprimer un document (soft delete)

```bash
curl -X DELETE http://localhost:3000/admin/tenants/2/documents/doc-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Ajouter un tag à un document

```bash
curl -X POST http://localhost:3000/admin/tenants/2/documents/doc-550e8400-e29b-41d4-a716-446655440000/tags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tagName": "urgent"
  }'
```

### Supprimer un tag d'un document

```bash
curl -X DELETE http://localhost:3000/admin/tenants/2/documents/doc-550e8400-e29b-41d4-a716-446655440000/tags/tag-550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Statistiques des documents

```bash
curl -X GET http://localhost:3000/admin/tenants/2/documents/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 145,
    "totalSize": 52428800,
    "documentsByType": {
      "application/pdf": 67,
      "image/jpeg": 45,
      "image/png": 23,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 10
    }
  }
}
```

---

## 🔍 Codes d'Erreur

- **400** - Données invalides
- **401** - Token manquant ou invalide  
- **403** - Accès admin requis
- **404** - Ressource introuvable
- **409** - Conflit (email déjà utilisé, nom de tenant existant, etc.)
- **422** - Validation échouée

---

## 📊 Postman Collection

Vous pouvez importer cette collection Postman pour tester facilement toutes les routes :

```json
{
  "info": {
    "name": "Admin API",
    "description": "Collection complète pour l'API Admin"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "superAdminToken",
      "value": "YOUR_ADMIN_TOKEN_HERE"
    }
  ]
}
```