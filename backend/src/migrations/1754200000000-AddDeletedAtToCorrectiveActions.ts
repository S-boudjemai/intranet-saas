import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToCorrectiveActions1754200000000 implements MigrationInterface {
  name = 'AddDeletedAtToCorrectiveActions1754200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "corrective_actions" 
      ADD COLUMN "deleted_at" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "corrective_actions" 
      DROP COLUMN "deleted_at"
    `);
  }
}