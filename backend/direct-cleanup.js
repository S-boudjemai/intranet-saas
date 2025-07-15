/**
 * Script de nettoyage direct via TypeORM
 * Supprime tous les audits non archivés
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

// Configuration de la base de données
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'internet_saas',
  synchronize: false,
  logging: true,
});

async function previewCleanup() {
  console.log('🔍 APERÇU DU NETTOYAGE...');
  console.log('========================');

  try {
    // Initialiser la connexion
    await dataSource.initialize();
    console.log('✅ Connexion à la base de données établie');

    // Compter les audits totaux
    const totalAudits = await dataSource.query('SELECT COUNT(*) as count FROM audit_executions');
    const totalArchives = await dataSource.query('SELECT COUNT(*) as count FROM audit_archives');
    
    // Compter les audits à supprimer (non archivés)
    const auditsToDelete = await dataSource.query(`
      SELECT COUNT(*) as count FROM audit_executions 
      WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
    `);

    // Compter les réponses à supprimer
    const responsesToDelete = await dataSource.query(`
      SELECT COUNT(*) as count FROM audit_responses 
      WHERE execution_id IN (
        SELECT id FROM audit_executions 
        WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
      )
    `);

    // Compter les non-conformités à supprimer
    const ncToDelete = await dataSource.query(`
      SELECT COUNT(*) as count FROM non_conformities 
      WHERE execution_id IN (
        SELECT id FROM audit_executions 
        WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
      )
    `);

    // Compter les actions correctives à supprimer
    const caToDelete = await dataSource.query(`
      SELECT COUNT(*) as count FROM corrective_actions 
      WHERE non_conformity_id IN (
        SELECT nc.id FROM non_conformities nc
        WHERE nc.execution_id IN (
          SELECT id FROM audit_executions 
          WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
        )
      )
    `);

    console.log('📊 ÉTAT ACTUEL:');
    console.log(`   📈 Total audits en base: ${totalAudits[0].count}`);
    console.log(`   🗄️  Total audits archivés: ${totalArchives[0].count}`);
    console.log('');
    console.log('🗑️  À SUPPRIMER:');
    console.log(`   📋 Audits non archivés: ${auditsToDelete[0].count}`);
    console.log(`   📝 Réponses d'audit: ${responsesToDelete[0].count}`);
    console.log(`   ⚠️  Non-conformités: ${ncToDelete[0].count}`);
    console.log(`   🔧 Actions correctives: ${caToDelete[0].count}`);
    console.log('========================');

    return {
      totalAudits: parseInt(totalAudits[0].count),
      totalArchives: parseInt(totalArchives[0].count),
      auditsToDelete: parseInt(auditsToDelete[0].count),
      responsesToDelete: parseInt(responsesToDelete[0].count),
      ncToDelete: parseInt(ncToDelete[0].count),
      caToDelete: parseInt(caToDelete[0].count),
    };

  } finally {
    await dataSource.destroy();
  }
}

async function executeCleanup() {
  console.log('🗑️  EXÉCUTION DU NETTOYAGE...');
  console.log('==============================');
  console.log('⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE!');
  console.log('');

  try {
    // Initialiser la connexion
    await dataSource.initialize();
    console.log('✅ Connexion à la base de données établie');

    // Démarrer une transaction pour l'atomicité
    await dataSource.transaction(async (manager) => {
      console.log('🔄 Début de la transaction...');

      // 1. Supprimer les actions correctives
      const caResult = await manager.query(`
        DELETE FROM corrective_actions 
        WHERE non_conformity_id IN (
          SELECT nc.id FROM non_conformities nc
          WHERE nc.execution_id IN (
            SELECT id FROM audit_executions 
            WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
          )
        )
      `);
      console.log(`   ✅ Actions correctives supprimées: ${caResult[1] || 0}`);

      // 2. Supprimer les non-conformités
      const ncResult = await manager.query(`
        DELETE FROM non_conformities 
        WHERE execution_id IN (
          SELECT id FROM audit_executions 
          WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
        )
      `);
      console.log(`   ✅ Non-conformités supprimées: ${ncResult[1] || 0}`);

      // 3. Supprimer les réponses d'audit
      const responsesResult = await manager.query(`
        DELETE FROM audit_responses 
        WHERE execution_id IN (
          SELECT id FROM audit_executions 
          WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
        )
      `);
      console.log(`   ✅ Réponses d'audit supprimées: ${responsesResult[1] || 0}`);

      // 4. Supprimer les audits eux-mêmes
      const auditsResult = await manager.query(`
        DELETE FROM audit_executions 
        WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
      `);
      console.log(`   ✅ Audits supprimés: ${auditsResult[1] || 0}`);

      console.log('🔄 Transaction validée avec succès!');
    });

    // Vérification finale
    const remainingAudits = await dataSource.query('SELECT COUNT(*) as count FROM audit_executions');
    const totalArchives = await dataSource.query('SELECT COUNT(*) as count FROM audit_archives');

    console.log('');
    console.log('🎉 NETTOYAGE TERMINÉ:');
    console.log(`   📋 Audits restants: ${remainingAudits[0].count}`);
    console.log(`   🗄️  Archives conservées: ${totalArchives[0].count}`);
    console.log('==============================');

    return {
      auditsRemaining: parseInt(remainingAudits[0].count),
      archivesKept: parseInt(totalArchives[0].count),
    };

  } finally {
    await dataSource.destroy();
  }
}

async function main() {
  const action = process.argv[2];
  
  if (!action || !['preview', 'execute'].includes(action)) {
    console.log('Usage: node direct-cleanup.js [preview|execute]');
    console.log('  preview  - Afficher ce qui serait supprimé');
    console.log('  execute  - Supprimer réellement tous les audits non archivés');
    process.exit(1);
  }

  console.log(`🚀 ${action === 'preview' ? 'APERÇU' : 'NETTOYAGE'} DES AUDITS NON ARCHIVÉS`);
  console.log(`🔗 Base: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'internet_saas'}`);
  console.log('');

  try {
    if (action === 'preview') {
      const result = await previewCleanup();
      console.log('\n💡 Pour exécuter le nettoyage: node direct-cleanup.js execute');
    } else if (action === 'execute') {
      // D'abord montrer l'aperçu
      const preview = await previewCleanup();
      
      if (preview.auditsToDelete === 0) {
        console.log('✅ Aucun audit à supprimer, tout est déjà archivé!');
        process.exit(0);
      }
      
      console.log('\n⏳ Exécution dans 3 secondes...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await executeCleanup();
      console.log('\n🎉 Nettoyage terminé avec succès!');
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le script
main().catch(console.error);