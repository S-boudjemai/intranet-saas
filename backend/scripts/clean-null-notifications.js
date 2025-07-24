#!/usr/bin/env node

/**
 * Script de nettoyage des notifications avec target_id NULL
 * Exécution: node scripts/clean-null-notifications.js
 */
const { Client } = require('pg');

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || '192.168.1.77',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres', 
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'internet_saas',
};

async function cleanNullNotifications() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    
    // Compter les notifications avec target_id NULL
    console.log('📊 Comptage des notifications avec target_id NULL...');
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE target_id IS NULL'
    );
    const nullCount = parseInt(countResult.rows[0].count);
    console.log(`📈 Notifications avec target_id NULL: ${nullCount}`);
    
    if (nullCount === 0) {
      console.log('✅ Aucune notification avec target_id NULL trouvée.');
      return;
    }
    
    // Afficher quelques exemples
    console.log('📋 Exemples de notifications avec target_id NULL:');
    const examplesResult = await client.query(`
      SELECT id, user_id, tenant_id, type, message, created_at 
      FROM notifications 
      WHERE target_id IS NULL 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    examplesResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Type: ${row.type}, Message: "${row.message.substring(0, 50)}..."`);
    });
    
    // Supprimer les notifications avec target_id NULL
    console.log('🗑️  Suppression des notifications avec target_id NULL...');
    const deleteResult = await client.query(
      'DELETE FROM notifications WHERE target_id IS NULL'
    );
    
    console.log(`✅ ${deleteResult.rowCount} notifications supprimées avec succès.`);
    
    // Vérification finale
    const finalCountResult = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE target_id IS NULL'
    );
    const remainingCount = parseInt(finalCountResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('🎉 Nettoyage terminé avec succès ! Plus aucune notification avec target_id NULL.');
    } else {
      console.log(`⚠️  Il reste encore ${remainingCount} notifications avec target_id NULL.`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée.');
  }
}

// Exécution du script
if (require.main === module) {
  cleanNullNotifications()
    .then(() => {
      console.log('✅ Script terminé avec succès.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { cleanNullNotifications };