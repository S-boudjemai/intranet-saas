import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOneSignalToUser1753745169744 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter les colonnes OneSignal à la table User
        await queryRunner.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS "oneSignalUserId" varchar,
            ADD COLUMN IF NOT EXISTS "userAgent" varchar,
            ADD COLUMN IF NOT EXISTS "platform" varchar
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les colonnes OneSignal
        await queryRunner.query(`
            ALTER TABLE "user" 
            DROP COLUMN IF EXISTS "oneSignalUserId",
            DROP COLUMN IF EXISTS "userAgent",
            DROP COLUMN IF EXISTS "platform"
        `);
    }

}
