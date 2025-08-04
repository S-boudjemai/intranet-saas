import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptionsTableFixed1754500000000 implements MigrationInterface {
  name = 'CreatePushSubscriptionsTableFixed1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table push_subscriptions APRÈS que users existe
    await queryRunner.query(`
      CREATE TABLE "push_subscriptions" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "endpoint" character varying NOT NULL,
        "keys" text NOT NULL,
        "userAgent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id")
      )
    `);

    // Ajouter la clé étrangère vers users
    await queryRunner.query(`
      ALTER TABLE "push_subscriptions" 
      ADD CONSTRAINT "FK_push_subscriptions_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Index pour les performances
    await queryRunner.query(`
      CREATE INDEX "IDX_push_subscriptions_userId" 
      ON "push_subscriptions" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions"`);
  }
}