// Utiliser l'API fetch native de Node.js 18+
// Si vous êtes sur Node < 18, installez node-fetch avec: npm install node-fetch@2

// Configuration
const API_URL = 'http://localhost:3000';
const EMAIL = 'admin@example.com'; // Remplacez par votre email admin
const PASSWORD = 'password123'; // Remplacez par votre mot de passe

// Données des catégories
const categoryData = [
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

async function login() {
  console.log('🔐 Connexion en cours...');
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!response.ok) {
    throw new Error(`Erreur de connexion: ${response.status}`);
  }

  const data = await response.json();
  const token = data.data?.access_token || data.access_token;
  console.log('✅ Connexion réussie');
  return token;
}

async function createCategory(name, parentId, token) {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, parentId })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur création catégorie ${name}: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data || data;
}

async function seedCategories() {
  try {
    // 1. Se connecter
    const token = await login();
    
    // 2. Map pour stocker les IDs des catégories créées
    const categoryMap = new Map();
    
    // 3. Créer d'abord les catégories principales (sans parent)
    console.log('\n📁 Création des catégories principales...');
    const mainCategories = categoryData.filter(cat => cat.parentName === null);
    
    for (const cat of mainCategories) {
      try {
        const created = await createCategory(cat.name, null, token);
        categoryMap.set(cat.name, created.id);
        console.log(`✅ Catégorie principale créée: ${cat.name}`);
      } catch (error) {
        console.error(`❌ Erreur pour ${cat.name}:`, error.message);
      }
    }
    
    // 4. Créer les sous-catégories
    console.log('\n📂 Création des sous-catégories...');
    const subCategories = categoryData.filter(cat => cat.parentName !== null);
    
    for (const cat of subCategories) {
      try {
        const parentId = categoryMap.get(cat.parentName);
        if (!parentId) {
          console.error(`❌ Parent introuvable pour ${cat.name}: ${cat.parentName}`);
          continue;
        }
        
        await createCategory(cat.name, parentId, token);
        console.log(`✅ Sous-catégorie créée: ${cat.name} (parent: ${cat.parentName})`);
      } catch (error) {
        console.error(`❌ Erreur pour ${cat.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Seed des catégories terminé!');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le seed
seedCategories();