import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeDeleteToTickets1753308000000 implements MigrationInterface {
  name = 'AddCascadeDeleteToTickets1753308000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes existantes
    await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "FK_9bf3c241d95fc8493047444f5ff"`);
    await queryRunner.query(`ALTER TABLE "ticket_attachments" DROP CONSTRAINT IF EXISTS "FK_e0f8a06ef056fd08c74e7fb8173"`);
    await queryRunner.query(`ALTER TABLE "ticket_attachments" DROP CONSTRAINT IF EXISTS "FK_9fc134e9d6e0b2b9e8e9c14e1e1"`);

    // Recréer les contraintes avec CASCADE
    await queryRunner.query(`
      ALTER TABLE "comment" 
      ADD CONSTRAINT "FK_9bf3c241d95fc8493047444f5ff" 
      FOREIGN KEY ("ticket_id") 
      REFERENCES "tickets"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_attachments" 
      ADD CONSTRAINT "FK_e0f8a06ef056fd08c74e7fb8173" 
      FOREIGN KEY ("ticket_id") 
      REFERENCES "tickets"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_attachments" 
      ADD CONSTRAINT "FK_9fc134e9d6e0b2b9e8e9c14e1e1" 
      FOREIGN KEY ("comment_id") 
      REFERENCES "comment"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les contraintes CASCADE
    await queryRunner.query(`ALTER TABLE "ticket_attachments" DROP CONSTRAINT IF EXISTS "FK_9fc134e9d6e0b2b9e8e9c14e1e1"`);
    await queryRunner.query(`ALTER TABLE "ticket_attachments" DROP CONSTRAINT IF EXISTS "FK_e0f8a06ef056fd08c74e7fb8173"`);
    await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "FK_9bf3c241d95fc8493047444f5ff"`);

    // Recréer les contraintes sans CASCADE
    await queryRunner.query(`
      ALTER TABLE "comment" 
      ADD CONSTRAINT "FK_9bf3c241d95fc8493047444f5ff" 
      FOREIGN KEY ("ticket_id") 
      REFERENCES "tickets"("id") 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_attachments" 
      ADD CONSTRAINT "FK_e0f8a06ef056fd08c74e7fb8173" 
      FOREIGN KEY ("ticket_id") 
      REFERENCES "tickets"("id") 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_attachments" 
      ADD CONSTRAINT "FK_9fc134e9d6e0b2b9e8e9c14e1e1" 
      FOREIGN KEY ("comment_id") 
      REFERENCES "comment"("id") 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION
    `);
  }
}