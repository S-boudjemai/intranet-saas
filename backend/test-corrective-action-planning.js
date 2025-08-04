// Script pour tester la création d'action corrective et tâche planning
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Token de test (remplacer par un vrai token)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

async function testCorrectiveActionPlanning() {
  try {
    console.log('🧪 Test création action corrective avec planning...');
    
    // Tenter de créer une action corrective
    const actionData = {
      title: 'Test Action Planning Automatique',
      description: 'Test pour vérifier la création automatique de tâche planning',
      category: 'hygiene',
      priority: 'medium',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
      restaurant_id: 1
    };

    console.log('📝 Données action:', actionData);

    const response = await axios.post(`${API_BASE}/corrective-actions`, actionData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Action créée:', response.data);

    // Vérifier si une tâche planning a été créée
    console.log('\n🔍 Vérification tâche planning...');
    const planningResponse = await axios.get(`${API_BASE}/planning/calendar/2025/8`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('📅 Tâches planning:', planningResponse.data.tasks);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testCorrectiveActionPlanning();