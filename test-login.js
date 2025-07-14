// Test simple de connexion au backend
const fetch = require('node-fetch');

async function testLogin() {
  console.log("🧪 Test de connexion au backend...");
  
  try {
    // Test 1: Health check
    console.log("\n1. Test health check...");
    const healthRes = await fetch('http://localhost:3000/health');
    const healthData = await healthRes.json();
    console.log("✅ Health check:", healthData.data.status);
    
    // Test 2: Tentative de login (avec des données fictives)
    console.log("\n2. Test endpoint login...");
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
    });
    
    console.log("Status:", loginRes.status);
    
    if (loginRes.status === 401) {
      console.log("✅ Endpoint login répond (erreur d'auth attendue)");
    } else {
      const loginData = await loginRes.text();
      console.log("Réponse:", loginData);
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

testLogin();