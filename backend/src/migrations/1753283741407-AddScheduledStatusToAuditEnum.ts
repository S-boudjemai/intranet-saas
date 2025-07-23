import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduledStatusToAuditEnum1753283741407 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // D'abord vérifier les valeurs existantes de l'enum
        const enumValues = await queryRunner.query(`
            SELECT unnest(enum_range(NULL::audit_executions_status_enum))::text as value
        `);
        
        console.log('Valeurs actuelles de l\'enum:', enumValues.map((row: any) => row.value));
        
        // Ajouter 'scheduled' seulement s'il n'existe pas déjà
        const hasScheduled = enumValues.some((row: any) => row.value === 'scheduled');
        
        if (!hasScheduled) {
            // Ajouter sans spécifier AFTER car on ne sait pas quelles valeurs existent
            await queryRunner.query(`
                ALTER TYPE audit_executions_status_enum 
                ADD VALUE IF NOT EXISTS 'scheduled'
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL ne permet pas de supprimer facilement une valeur d'enum
        // Cette migration est donc irréversible en pratique
        // Pour revenir en arrière, il faudrait recréer l'enum et toutes les colonnes qui l'utilisent
    }

}
