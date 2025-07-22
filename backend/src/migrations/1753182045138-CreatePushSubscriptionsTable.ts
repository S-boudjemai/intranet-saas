import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushSubscriptionsTable1753182045138 implements MigrationInterface {
    name = 'CreatePushSubscriptionsTable1753182045138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "endpoint" text NOT NULL, "expirationTime" text, "p256dh" text NOT NULL, "auth" text NOT NULL, "userAgent" text, "platform" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c8a42b552ea8125bee461a470" ON "push_subscriptions" ("userId", "endpoint") `);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" ADD CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_4cc061875e9eecc311a94b3e431"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c8a42b552ea8125bee461a470"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
    }

}
