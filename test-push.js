// Script de test pour les push notifications
const axios = require('axios');

async function testPushNotification() {
  try {
    // Vous devez remplacer ce token par un vrai token JWT d'un utilisateur connecté
    const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';
    
    console.log('🧪 Test des push notifications...');
    
    const response = await axios.post('http://localhost:3000/notifications/test-push', {}, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Réponse serveur:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur test push:', error.response?.data || error.message);
  }
}

testPushNotification();