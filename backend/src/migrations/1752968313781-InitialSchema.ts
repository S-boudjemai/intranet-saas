import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752968313781 implements MigrationInterface {
  name = 'InitialSchema1752968313781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'extension UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Table tenants
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "restaurant_type" character varying NOT NULL DEFAULT 'pizzeria',
        "primaryColor" character varying DEFAULT '#4F46E5',
        "secondaryColor" character varying DEFAULT '#10B981',
        "backgroundColor" character varying DEFAULT '#FFFFFF',
        "textColor" character varying DEFAULT '#1F2937',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Table users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying,
        "role" character varying NOT NULL DEFAULT 'manager',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "restaurant_id" integer,
        "oneSignalUserId" character varying,
        "userAgent" character varying,
        "platform" character varying,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Table restaurants
    await queryRunner.query(`
      CREATE TABLE "restaurants" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying NOT NULL,
        "address" character varying,
        "phone" character varying,
        "email" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurants" PRIMARY KEY ("id")
      )
    `);

    // Table categories
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category" PRIMARY KEY ("id")
      )
    `);

    // Table tags
    await queryRunner.query(`
      CREATE TABLE "tag" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying NOT NULL,
        "color" character varying DEFAULT '#6B7280',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tag" PRIMARY KEY ("id")
      )
    `);

    // Table documents
    await queryRunner.query(`
      CREATE TABLE "document" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "file_name" character varying NOT NULL,
        "file_path" character varying NOT NULL,
        "file_size" integer,
        "mime_type" character varying,
        "description" text,
        "category_id" integer,
        "created_by" integer NOT NULL,
        "is_public" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document" PRIMARY KEY ("id")
      )
    `);

    // Table tickets
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'ouverte',
        "priority" character varying NOT NULL DEFAULT 'moyenne',
        "category" character varying,
        "created_by" integer NOT NULL,
        "restaurant_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id")
      )
    `);

    // Table comments
    await queryRunner.query(`
      CREATE TABLE "comment" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "content" text NOT NULL,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comment" PRIMARY KEY ("id")
      )
    `);

    // Table announcements
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "priority" character varying NOT NULL DEFAULT 'normale',
        "is_urgent" boolean NOT NULL DEFAULT false,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )
    `);

    // Table notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "type" character varying NOT NULL DEFAULT 'info',
        "target_type" character varying,
        "target_id" character varying,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Table invites
    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'viewer',
        "tenant_id" integer,
        "restaurant_id" integer,
        "token" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invites_token" UNIQUE ("token")
      )
    `);

    // Table password_resets
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_resets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_resets_token" UNIQUE ("token")
      )
    `);

    // Tables audits
    await queryRunner.query(`
      CREATE TABLE "audit_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "category" character varying NOT NULL DEFAULT 'other',
        "frequency" character varying NOT NULL DEFAULT 'on_demand',
        "estimated_duration" integer,
        "is_mandatory" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "tenant_id" character varying NOT NULL,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_templates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_template_items" (
        "id" SERIAL NOT NULL,
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

    await queryRunner.query(`
      CREATE TABLE "audit_executions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "restaurant_id" integer,
        "inspector_id" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "scheduled_date" TIMESTAMP,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "notes" text,
        "tenant_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_executions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "execution_id" uuid NOT NULL,
        "item_id" integer NOT NULL,
        "response" text,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_responses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "corrective_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "execution_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "priority" character varying NOT NULL DEFAULT 'medium',
        "status" character varying NOT NULL DEFAULT 'pending',
        "assigned_to" integer,
        "due_date" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "verified_by" integer,
        "verified_at" TIMESTAMP,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corrective_actions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_archives" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "execution_id" uuid NOT NULL,
        "inspector_id" integer NOT NULL,
        "archived_by" integer NOT NULL,
        "archived_at" TIMESTAMP NOT NULL DEFAULT now(),
        "reason" text,
        CONSTRAINT "PK_audit_archives" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "non_conformities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "execution_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "severity" character varying NOT NULL DEFAULT 'medium',
        "status" character varying NOT NULL DEFAULT 'open',
        "responsible_user_id" integer,
        "due_date" TIMESTAMP,
        "resolved_at" TIMESTAMP,
        "resolution_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_non_conformities" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ticket_attachments" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "file_name" character varying NOT NULL,
        "file_path" character varying NOT NULL,
        "file_size" integer,
        "mime_type" character varying,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_attachments" PRIMARY KEY ("id")
      )
    `);

    // Clés étrangères
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "restaurants" ADD CONSTRAINT "FK_restaurants_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_category_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "tag" ADD CONSTRAINT "FK_tag_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_document_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_document_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_document_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_restaurant" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_invites_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_invites_restaurant" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_invites_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "password_resets" ADD CONSTRAINT "FK_password_resets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);

    // Clés étrangères pour audits
    await queryRunner.query(`ALTER TABLE "audit_templates" ADD CONSTRAINT "FK_audit_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_template_items" ADD CONSTRAINT "FK_audit_template_items_template" FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_executions" ADD CONSTRAINT "FK_audit_executions_template" FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_executions" ADD CONSTRAINT "FK_audit_executions_restaurant" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "audit_executions" ADD CONSTRAINT "FK_audit_executions_inspector" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_responses" ADD CONSTRAINT "FK_audit_responses_execution" FOREIGN KEY ("execution_id") REFERENCES "audit_executions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_responses" ADD CONSTRAINT "FK_audit_responses_item" FOREIGN KEY ("item_id") REFERENCES "audit_template_items"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "corrective_actions" ADD CONSTRAINT "FK_corrective_actions_execution" FOREIGN KEY ("execution_id") REFERENCES "audit_executions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "corrective_actions" ADD CONSTRAINT "FK_corrective_actions_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "corrective_actions" ADD CONSTRAINT "FK_corrective_actions_verified_by" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "audit_archives" ADD CONSTRAINT "FK_audit_archives_execution" FOREIGN KEY ("execution_id") REFERENCES "audit_executions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_archives" ADD CONSTRAINT "FK_audit_archives_inspector" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "audit_archives" ADD CONSTRAINT "FK_audit_archives_archived_by" FOREIGN KEY ("archived_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "non_conformities" ADD CONSTRAINT "FK_non_conformities_execution" FOREIGN KEY ("execution_id") REFERENCES "audit_executions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "non_conformities" ADD CONSTRAINT "FK_non_conformities_responsible" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "ticket_attachments" ADD CONSTRAINT "FK_ticket_attachments_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "ticket_attachments" ADD CONSTRAINT "FK_ticket_attachments_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse (audits d'abord)
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "non_conformities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_archives"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corrective_actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_responses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_executions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_template_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tag"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
