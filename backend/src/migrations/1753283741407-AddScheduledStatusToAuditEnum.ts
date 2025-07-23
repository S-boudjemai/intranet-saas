import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduledStatusToAuditEnum1753283741407 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la valeur 'scheduled' à l'enum audit_executions_status_enum
        await queryRunner.query(`
            ALTER TYPE audit_executions_status_enum 
            ADD VALUE IF NOT EXISTS 'scheduled' AFTER 'todo'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL ne permet pas de supprimer facilement une valeur d'enum
        // Cette migration est donc irréversible en pratique
        // Pour revenir en arrière, il faudrait recréer l'enum et toutes les colonnes qui l'utilisent
    }

}
