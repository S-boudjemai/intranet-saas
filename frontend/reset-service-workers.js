// Script pour nettoyer tous les service workers
console.log('🔧 NETTOYAGE COMPLET SERVICE WORKERS');

async function resetServiceWorkers() {
  try {
    console.log('1. Désinstallation de tous les service workers...');
    
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📋 Service workers trouvés: ${registrations.length}`);
      
      for (let registration of registrations) {
        console.log(`🗑️ Désinstallation: ${registration.scope}`);
        await registration.unregister();
      }
      
      console.log('✅ Tous les service workers désinstallés');
    }

    console.log('2. Nettoyage localStorage...');
    localStorage.removeItem('fcm-token');
    console.log('✅ localStorage nettoyé');

    console.log('3. Instructions pour continuer:');
    console.log('   → Fermez TOUS les onglets de l\'application');
    console.log('   → Attendez 5 secondes');
    console.log('   → Rouvrez l\'application');
    console.log('   → Les service workers se réenregistreront automatiquement');
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
}

resetServiceWorkers();