import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArchivedStatusToCorrectiveAction1753286909035 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la valeur 'archived' à l'enum corrective_actions_status_enum
        await queryRunner.query(`
            ALTER TYPE corrective_actions_status_enum 
            ADD VALUE IF NOT EXISTS 'archived'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL ne permet pas de supprimer facilement une valeur d'enum
        // Cette migration est donc irréversible en pratique
    }

}