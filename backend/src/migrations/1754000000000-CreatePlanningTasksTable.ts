import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreatePlanningTasksTable1754000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'planning_tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['audit', 'custom', 'corrective_action'],
            default: "'custom'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'tenant_id',
            type: 'int',
          },
          {
            name: 'restaurant_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'assigned_to',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'int',
          },
          {
            name: 'audit_execution_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'corrective_action_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Index pour optimiser les requêtes par tenant et date
    await queryRunner.query(`
      CREATE INDEX "IDX_planning_tasks_tenant_date" ON "planning_tasks" ("tenant_id", "scheduled_date")
    `);

    // Index pour les requêtes par assigné
    await queryRunner.query(`
      CREATE INDEX "IDX_planning_tasks_assigned" ON "planning_tasks" ("assigned_to")
    `);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD CONSTRAINT "FK_planning_tasks_assigned_to" 
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD CONSTRAINT "FK_planning_tasks_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD CONSTRAINT "FK_planning_tasks_restaurant_id" 
      FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL
    `);

    // Note: Foreign key vers audit_executions sera ajoutée dans une migration ultérieure
    // quand le conflit de types sera résolu (uuid vs integer)

    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD CONSTRAINT "FK_planning_tasks_corrective_action" 
      FOREIGN KEY ("corrective_action_id") REFERENCES "corrective_actions"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('planning_tasks');
  }
}