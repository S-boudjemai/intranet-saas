import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTargetIdType1753194983000 implements MigrationInterface {
    name = 'FixTargetIdType1753194983000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Delete notifications with NULL target_id first
        await queryRunner.query(`DELETE FROM "notifications" WHERE "target_id" IS NULL`);

        // Change target_id column type from integer to varchar
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "target_id" TYPE VARCHAR USING target_id::VARCHAR`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Change target_id column type back from varchar to integer
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "target_id" TYPE INTEGER USING target_id::INTEGER`);
    }
}