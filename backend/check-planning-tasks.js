// Script pour vérifier les tâches de planning créées
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: '192.168.1.77',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'internet_saas',
  synchronize: false,
  logging: false,
});

async function checkPlanningTasks() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Connexion à la base de données établie');

    // Compter les actions correctives
    const correctiveActionsCount = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM corrective_actions'
    );
    console.log(`📋 Actions correctives en base: ${correctiveActionsCount[0].count}`);

    // Compter les tâches de planning
    const planningTasksCount = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM planning_tasks'
    );
    console.log(`📅 Tâches de planning en base: ${planningTasksCount[0].count}`);

    // Vérifier les tâches liées aux actions correctives
    const linkedTasks = await AppDataSource.query(`
      SELECT 
        pt.id, 
        pt.title, 
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

    console.log(`🔗 Tâches liées aux actions correctives: ${linkedTasks.length}`);
    
    if (linkedTasks.length > 0) {
      console.log('\n📋 Détails des tâches liées:');
      linkedTasks.forEach(task => {
        console.log(`  - ${task.title}`);
        console.log(`    Date programmée: ${task.scheduled_date}`);
        console.log(`    Action liée: ${task.action_title}`);
        console.log(`    Date limite action: ${task.action_due_date}`);
        console.log('');
      });
    }

    // Dernières actions correctives créées
    const recentActions = await AppDataSource.query(`
      SELECT id, title, due_date, created_at 
      FROM corrective_actions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('🆕 Dernières actions correctives:');
    recentActions.forEach(action => {
      const dueDate = new Date(action.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`  - ${action.title}`);
      console.log(`    Échéance: ${action.due_date} (dans ${daysUntilDue} jours)`);
      console.log(`    Créée: ${action.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

checkPlanningTasks();