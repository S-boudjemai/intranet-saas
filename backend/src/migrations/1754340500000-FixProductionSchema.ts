import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductionSchema1754340500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajouter la colonne 'name' à la table users si elle n'existe pas
    const hasNameColumn = await queryRunner.hasColumn('users', 'name');
    if (!hasNameColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "name" character varying DEFAULT NULL
      `);
    }

    // 2. Créer la table audit_template_items si elle n'existe pas
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
          CONSTRAINT "PK_audit_template_items" PRIMARY KEY ("id")
        )
      `);

      // Ajouter la clé étrangère vers audit_templates
      await queryRunner.query(`
        ALTER TABLE "audit_template_items"
        ADD CONSTRAINT "FK_audit_template_items_template"
        FOREIGN KEY ("template_id") 
        REFERENCES "audit_templates"("id") 
        ON DELETE CASCADE
      `);

      // Créer l'index pour améliorer les performances
      await queryRunner.query(`
        CREATE INDEX "IDX_audit_template_items_template" 
        ON "audit_template_items" ("template_id")
      `);
    }

    // 3. S'assurer que la fonction uuid_generate_v4() existe
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
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