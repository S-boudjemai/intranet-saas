/**
 * Script de nettoyage des audits non archivés
 * Utilisation: node cleanup-audits.js [preview|execute]
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

// Token admin temporaire pour le nettoyage (admin user ID 1)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBhZG1pbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJ0ZW5hbnRfaWQiOjEsInJlc3RhdXJhbnRfaWQiOm51bGwsImlhdCI6MTczNjkwOTcwMCwiZXhwIjoxNzM2OTk2MTAwfQ.mocked_token'; // Token valide à remplacer

async function previewCleanup() {
  console.log('🔍 PREVIEW - Aperçu du nettoyage...');
  
  try {
    const response = await fetch(`${API_URL}/audit-cleanup/preview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      const data = result.data || result;
      
      console.log('📊 RÉSULTATS APERÇU:');
      console.log('===================');
      console.log(`📈 Audits archivés (conservés): ${data.archived_audits_count}`);
      console.log(`🗑️  Audits à supprimer: ${data.audits_deleted}`);
      console.log(`📝 Réponses à supprimer: ${data.responses_deleted}`);
      console.log(`⚠️  Non-conformités à supprimer: ${data.non_conformities_deleted}`);
      console.log(`🔧 Actions correctives à supprimer: ${data.corrective_actions_deleted}`);
      console.log('===================');
      
      return data;
    } else {
      const error = await response.json();
      console.error('❌ Erreur aperçu:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur requête aperçu:', error.message);
    return null;
  }
}

async function executeCleanup() {
  console.log('🗑️  EXECUTE - Exécution du nettoyage...');
  console.log('⚠️  ATTENTION: Cette action est IRRÉVERSIBLE!');
  
  try {
    const response = await fetch(`${API_URL}/audit-cleanup/delete-non-archived`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      const data = result.data || result;
      
      console.log('✅ NETTOYAGE TERMINÉ:');
      console.log('====================');
      console.log(`🗑️  Audits supprimés: ${data.audits_deleted}`);
      console.log(`📝 Réponses supprimées: ${data.responses_deleted}`);
      console.log(`⚠️  Non-conformités supprimées: ${data.non_conformities_deleted}`);
      console.log(`🔧 Actions correctives supprimées: ${data.corrective_actions_deleted}`);
      console.log(`📈 Audits archivés conservés: ${data.archived_audits_count}`);
      console.log('====================');
      
      return data;
    } else {
      const error = await response.json();
      console.error('❌ Erreur nettoyage:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur requête nettoyage:', error.message);
    return null;
  }
}

async function main() {
  const action = process.argv[2];
  
  if (!action || !['preview', 'execute'].includes(action)) {
    console.log('Usage: node cleanup-audits.js [preview|execute]');
    console.log('  preview  - Afficher ce qui serait supprimé sans rien supprimer');
    console.log('  execute  - Supprimer réellement tous les audits non archivés');
    process.exit(1);
  }

  console.log(`🚀 Démarrage ${action === 'preview' ? 'aperçu' : 'nettoyage'} des audits non archivés`);
  console.log(`🔗 API: ${API_URL}`);
  console.log('');

  if (action === 'preview') {
    const result = await previewCleanup();
    if (result) {
      console.log('\n💡 Pour exécuter le nettoyage: node cleanup-audits.js execute');
    }
  } else if (action === 'execute') {
    // D'abord montrer l'aperçu
    const preview = await previewCleanup();
    if (!preview) {
      console.log('❌ Impossible d\'obtenir l\'aperçu, arrêt du nettoyage');
      process.exit(1);
    }
    
    console.log('\n⏳ Exécution dans 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await executeCleanup();
    if (result) {
      console.log('\n🎉 Nettoyage terminé avec succès!');
    }
  }
}

// Exécuter le script
main().catch(console.error);