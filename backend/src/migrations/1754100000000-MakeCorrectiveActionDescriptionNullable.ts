import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCorrectiveActionDescriptionNullable1754100000000 implements MigrationInterface {
  name = 'MakeCorrectiveActionDescriptionNullable1754100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "corrective_actions" 
      ALTER COLUMN "description" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "corrective_actions" 
      ALTER COLUMN "description" SET NOT NULL
    `);
  }
}