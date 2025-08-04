// Données des catégories pour restaurant
export const categoryData = [
  // Catégorie par défaut en première position
  { name: 'Documents Généraux', parentName: null },

  // Catégories principales
  { name: 'Plats Principaux', parentName: null },
  { name: 'Desserts & Glaces', parentName: null },
  { name: 'Boissons', parentName: null },
  { name: 'Hygiène & Sécurité', parentName: null },
  { name: 'Gestion & Procédures', parentName: null },
  { name: 'Formation & Personnel', parentName: null },

  // Sous-catégories Plats Principaux
  { name: 'Tacos', parentName: 'Plats Principaux' },
  { name: 'Pizzas', parentName: 'Plats Principaux' },
  { name: 'Bowls', parentName: 'Plats Principaux' },
  { name: 'Burgers', parentName: 'Plats Principaux' },
  { name: 'Wraps & Sandwichs', parentName: 'Plats Principaux' },
  { name: 'Salades', parentName: 'Plats Principaux' },
  { name: 'Accompagnements', parentName: 'Plats Principaux' },

  // Sous-catégories Desserts & Glaces
  { name: 'Glaces', parentName: 'Desserts & Glaces' },
  { name: 'Mini Pancakes', parentName: 'Desserts & Glaces' },
  { name: 'Milkshakes', parentName: 'Desserts & Glaces' },
  { name: 'Desserts Chauds', parentName: 'Desserts & Glaces' },
  { name: 'Desserts Froids', parentName: 'Desserts & Glaces' },
  { name: 'Pâtisseries', parentName: 'Desserts & Glaces' },

  // Sous-catégories Boissons
  { name: 'Boissons Chaudes', parentName: 'Boissons' },
  { name: 'Boissons Froides', parentName: 'Boissons' },
  { name: 'Jus & Smoothies', parentName: 'Boissons' },
  { name: 'Sodas', parentName: 'Boissons' },

  // Sous-catégories Hygiène & Sécurité
  { name: 'Nettoyage Cuisine', parentName: 'Hygiène & Sécurité' },
  { name: 'Nettoyage Salle', parentName: 'Hygiène & Sécurité' },
  { name: 'Équipements Protection', parentName: 'Hygiène & Sécurité' },
  { name: 'Contrôle Température', parentName: 'Hygiène & Sécurité' },
  { name: 'HACCP', parentName: 'Hygiène & Sécurité' },

  // Sous-catégories Gestion & Procédures
  { name: 'Ouverture Restaurant', parentName: 'Gestion & Procédures' },
  { name: 'Fermeture Restaurant', parentName: 'Gestion & Procédures' },
  { name: 'Gestion Stock', parentName: 'Gestion & Procédures' },
  { name: 'Procédures Fabrication', parentName: 'Gestion & Procédures' },
  { name: 'Service Client', parentName: 'Gestion & Procédures' },

  // Sous-catégories Formation & Personnel
  { name: 'Formation Cuisine', parentName: 'Formation & Personnel' },
  { name: 'Formation Service', parentName: 'Formation & Personnel' },
  { name: 'Sécurité au Travail', parentName: 'Formation & Personnel' },
  { name: 'Gestion Équipe', parentName: 'Formation & Personnel' },
];
