import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArchivedTicketStatus1753308000000 implements MigrationInterface {
    name = 'AddArchivedTicketStatus1753308000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter 'archived' aux valeurs possibles de l'enum ticket_status
        await queryRunner.query(`
            ALTER TYPE "public"."tickets_status_enum" 
            ADD VALUE IF NOT EXISTS 'archived'
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL ne permet pas de supprimer facilement une valeur d'enum
        // Cette migration n'est pas facilement réversible

    }
}