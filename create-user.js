// Script pour créer un utilisateur de test
const { exec } = require('child_process');

const userData = {
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

console.log("🧑‍💼 Création d'un utilisateur admin de test...");
console.log("Email:", userData.email);
console.log("Password:", userData.password);
console.log("Role:", userData.role);

// Test avec curl
const curlCommand = `curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '${JSON.stringify(userData)}'`;

console.log("\n🧪 Test de connexion avec ces identifiants...");

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Erreur:", error.message);
    return;
  }
  
  console.log("📡 Réponse du serveur:");
  console.log(stdout);
  
  try {
    const response = JSON.parse(stdout);
    if (response.success === false) {
      console.log("\n⚠️  L'utilisateur n'existe pas encore.");
      console.log("📋 Vous devez :");
      console.log("1. Créer un tenant (franchiseur)");
      console.log("2. Créer un utilisateur admin");
      console.log("3. Ou utiliser l'interface d'inscription");
    } else {
      console.log("✅ Connexion réussie !");
    }
  } catch (e) {
    console.log("Réponse non-JSON:", stdout);
  }
});