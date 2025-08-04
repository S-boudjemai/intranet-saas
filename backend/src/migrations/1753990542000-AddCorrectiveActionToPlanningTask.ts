import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCorrectiveActionToPlanningTask1753990542000 implements MigrationInterface {
  name = 'AddCorrectiveActionToPlanningTask1753990542000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne corrective_action_id à la table planning_tasks
    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD "corrective_action_id" uuid
    `);

    // Ajouter une contrainte de clé étrangère vers la table corrective_actions
    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      ADD CONSTRAINT "FK_planning_tasks_corrective_action" 
      FOREIGN KEY ("corrective_action_id") 
      REFERENCES "corrective_actions"("id") 
      ON DELETE CASCADE
    `);

    // Mettre à jour l'enum type pour inclure le nouveau type CORRECTIVE_ACTION
    await queryRunner.query(`
      ALTER TYPE "planning_tasks_type_enum" 
      ADD VALUE 'corrective_action'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la contrainte de clé étrangère
    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      DROP CONSTRAINT "FK_planning_tasks_corrective_action"
    `);

    // Supprimer la colonne
    await queryRunner.query(`
      ALTER TABLE "planning_tasks" 
      DROP COLUMN "corrective_action_id"
    `);

    // Note: Il n'est pas possible de supprimer une valeur d'un enum en PostgreSQL
    // La valeur 'corrective_action' restera dans l'enum
  }
}