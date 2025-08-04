// Script pour vérifier directement les tâches de planning
const { Client } = require('pg');

const client = new Client({
  host: '192.168.1.77',
  port: 5432,
  user: 'postgres',
  password: 'Sofi@ne123',
  database: 'internet_saas'
});

async function checkPlanningTasks() {
  try {
    await client.connect();
    console.log('📊 Connexion PostgreSQL établie');

    // Compter les actions correctives
    const correctiveActionsResult = await client.query('SELECT COUNT(*) as count FROM corrective_actions');
    console.log(`📋 Actions correctives en base: ${correctiveActionsResult.rows[0].count}`);

    // Compter les tâches de planning
    const planningTasksResult = await client.query('SELECT COUNT(*) as count FROM planning_tasks');
    console.log(`📅 Tâches de planning en base: ${planningTasksResult.rows[0].count}`);

    // Vérifier les tâches liées aux actions correctives
    const linkedTasksResult = await client.query(`
      SELECT 
        pt.id, 
        pt.title, 
        pt.type,
        pt.scheduled_date, 
        pt.corrective_action_id,
        ca.title as action_title,
        ca.due_date as action_due_date
      FROM planning_tasks pt 
      LEFT JOIN corrective_actions ca ON pt.corrective_action_id = ca.id 
      WHERE pt.corrective_action_id IS NOT NULL
      ORDER BY pt.created_at DESC
      LIMIT 10
    `);

    console.log(`🔗 Tâches liées aux actions correctives: ${linkedTasksResult.rows.length}`);
    
    if (linkedTasksResult.rows.length > 0) {
      console.log('\n📋 Détails des tâches liées:');
      linkedTasksResult.rows.forEach(task => {
        console.log(`  - ${task.title} (Type: ${task.type})`);
        console.log(`    Date programmée: ${task.scheduled_date}`);
        console.log(`    Action liée: ${task.action_title}`);
        console.log(`    Date limite action: ${task.action_due_date}`);
        console.log('');
      });
    }

    // Dernières actions correctives créées
    const recentActionsResult = await client.query(`
      SELECT id, title, due_date, created_at 
      FROM corrective_actions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('🆕 Dernières actions correctives:');
    recentActionsResult.rows.forEach(action => {
      const dueDate = new Date(action.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`  - ${action.title}`);
      console.log(`    Échéance: ${action.due_date} (dans ${daysUntilDue} jours)`);
      console.log(`    Créée: ${action.created_at}`);
      console.log('');
    });

    // Toutes les tâches de planning (pour debug)
    const allTasksResult = await client.query(`
      SELECT id, title, type, scheduled_date, corrective_action_id
      FROM planning_tasks 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('📝 Toutes les tâches de planning récentes:');
    allTasksResult.rows.forEach(task => {
      console.log(`  - ${task.title} (Type: ${task.type})`);
      console.log(`    Date: ${task.scheduled_date}`);
      console.log(`    Action ID: ${task.corrective_action_id || 'Aucune'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkPlanningTasks();