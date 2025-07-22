import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNotificationsAndAddPushSubscriptions1753193784878 implements MigrationInterface {
    name = 'FixNotificationsAndAddPushSubscriptions1753193784878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. D'abord supprimer les notifications avec target_id NULL
        await queryRunner.query(`DELETE FROM "notifications" WHERE "target_id" IS NULL`);
        
        // 1.5. Changer le type de target_id de integer à varchar
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "target_id" TYPE VARCHAR USING target_id::VARCHAR`);
        
        // 2. Créer la table push_subscriptions si elle n'existe pas
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "push_subscriptions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "userId" integer NOT NULL,
            "endpoint" text NOT NULL,
            "expirationTime" text,
            "p256dh" text NOT NULL,
            "auth" text NOT NULL,
            "userAgent" text,
            "platform" text,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id")
        )`);
        
        // 3. Créer l'index unique
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_9c8a42b552ea8125bee461a470" ON "push_subscriptions" ("userId", "endpoint")`);
        
        // 4. Ajouter la clé étrangère si elle n'existe pas
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_4cc061875e9eecc311a94b3e431') 
                THEN
                    ALTER TABLE "push_subscriptions" 
                    ADD CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" 
                    FOREIGN KEY ("userId") REFERENCES "users"("id") 
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: supprimer la table push_subscriptions
        await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions"`);
    }

}
