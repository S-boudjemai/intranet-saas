import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductionSchema1754340500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. S'assurer que l'extension uuid-ossp existe AVANT tout
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    // 1. Ajouter la colonne 'name' à la table users si elle n'existe pas
    const hasNameColumn = await queryRunner.hasColumn('users', 'name');
    if (!hasNameColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "name" character varying DEFAULT NULL
      `);
    }

    // 2. Vérifier le type de colonne id dans audit_templates
    const auditTemplatesExists = await queryRunner.hasTable('audit_templates');
    if (auditTemplatesExists) {
      // Vérifier si la table audit_templates a une colonne id de type integer
      const columnInfo = await queryRunner.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'audit_templates' 
        AND column_name = 'id'
      `);
      
      if (columnInfo.length > 0 && columnInfo[0].data_type === 'integer') {
        console.log('⚠️  ATTENTION: La table audit_templates utilise un id INTEGER au lieu de UUID');
        console.log('⚠️  Création de audit_template_items avec template_id INTEGER');
        
        // Créer la table avec template_id en INTEGER
        const hasAuditTemplateItemsTable = await queryRunner.hasTable('audit_template_items');
        if (!hasAuditTemplateItemsTable) {
          await queryRunner.query(`
            CREATE TABLE "audit_template_items" (
              "id" SERIAL PRIMARY KEY,
              "template_id" integer NOT NULL,
              "question" text NOT NULL,
              "category" character varying(100) NOT NULL,
              "response_type" character varying(20) NOT NULL DEFAULT 'boolean',
              "order" integer NOT NULL DEFAULT 0,
              "is_required" boolean NOT NULL DEFAULT true,
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
              CONSTRAINT "FK_audit_template_items_template"
                FOREIGN KEY ("template_id") 
                REFERENCES "audit_templates"("id") 
                ON DELETE CASCADE
            )
          `);

          // Créer l'index
          await queryRunner.query(`
            CREATE INDEX "IDX_audit_template_items_template" 
            ON "audit_template_items" ("template_id")
          `);
        }
      } else {
        // La table utilise UUID comme prévu
        const hasAuditTemplateItemsTable = await queryRunner.hasTable('audit_template_items');
        if (!hasAuditTemplateItemsTable) {
          await queryRunner.query(`
            CREATE TABLE "audit_template_items" (
              "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
              "template_id" uuid NOT NULL,
              "question" text NOT NULL,
              "category" character varying(100) NOT NULL,
              "response_type" character varying(20) NOT NULL DEFAULT 'boolean',
              "order" integer NOT NULL DEFAULT 0,
              "is_required" boolean NOT NULL DEFAULT true,
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
              CONSTRAINT "PK_audit_template_items" PRIMARY KEY ("id"),
              CONSTRAINT "FK_audit_template_items_template"
                FOREIGN KEY ("template_id") 
                REFERENCES "audit_templates"("id") 
                ON DELETE CASCADE
            )
          `);

          // Créer l'index
          await queryRunner.query(`
            CREATE INDEX "IDX_audit_template_items_template" 
            ON "audit_template_items" ("template_id")
          `);
        }
      }
    } else {
      console.log('❌ Table audit_templates n\'existe pas!');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les modifications dans l'ordre inverse
    await queryRunner.query(`
      DROP TABLE IF EXISTS "audit_template_items"
    `);

    const hasNameColumn = await queryRunner.hasColumn('users', 'name');
    if (hasNameColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" DROP COLUMN "name"
      `);
    }
  }
}