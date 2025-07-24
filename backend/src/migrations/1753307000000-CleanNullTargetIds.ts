import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanNullTargetIds1753307000000 implements MigrationInterface {
    name = 'CleanNullTargetIds1753307000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Compter et afficher les notifications avec target_id NULL
        const countResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications WHERE target_id IS NULL
        `);
        const nullCount = countResult[0].count;
        console.log(`🧹 Migration: Found ${nullCount} notifications with NULL target_id`);

        if (nullCount > 0) {
            // Supprimer toutes les notifications avec target_id NULL
            const deleteResult = await queryRunner.query(`
                DELETE FROM notifications WHERE target_id IS NULL
            `);
            console.log(`🗑️  Migration: Deleted ${deleteResult[1]} notifications with NULL target_id`);
        }

        // Ajouter une contrainte NOT NULL sur target_id pour éviter les futures valeurs NULL
        await queryRunner.query(`
            ALTER TABLE notifications ALTER COLUMN target_id SET NOT NULL
        `);
        console.log(`✅ Migration: Added NOT NULL constraint on notifications.target_id`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la contrainte NOT NULL
        await queryRunner.query(`
            ALTER TABLE notifications ALTER COLUMN target_id DROP NOT NULL
        `);
        console.log(`⏪ Migration rollback: Removed NOT NULL constraint from notifications.target_id`);
    }
}