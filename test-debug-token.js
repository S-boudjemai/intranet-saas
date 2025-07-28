// Script pour vérifier le token FCM enregistré
const axios = require('axios');

async function debugToken() {
  try {
    // Récupérez votre JWT token depuis localStorage dans le navigateur
    const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';
    
    console.log('🔍 Vérification token FCM enregistré...');
    
    const response = await axios.get('http://localhost:3000/notifications/debug-token', {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Tokens enregistrés:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur debug token:', error.response?.data || error.message);
  }
}

console.log('Pour utiliser ce script:');
console.log('1. Ouvrez la console de votre navigateur');  
console.log('2. Tapez: localStorage.getItem("token")');
console.log('3. Copiez le token et remplacez YOUR_JWT_TOKEN_HERE ci-dessus');
console.log('4. Lancez: node test-debug-token.js');

// debugToken();