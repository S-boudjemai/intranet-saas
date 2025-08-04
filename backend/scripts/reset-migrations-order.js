#!/usr/bin/env node

/**
 * Script pour nettoyer et réorganiser les migrations
 * À exécuter avant de redéployer sur une base fraîche
 */

const fs = require('fs');
const path = require('path');

const migrationsPath = path.join(__dirname, '../src/migrations');

// Migrations à supprimer car elles causent des problèmes d'ordre
const migrationsToDelete = [
  '1753182045138-CreatePushSubscriptionsTable.ts', // FK vers users qui n'existe pas encore
  '1754340500000-FixProductionSchema.ts', // Plus nécessaire
];

// Migrations à garder dans l'ordre
const migrationsOrder = [
  '1752968313781-InitialSchema.ts', // DOIT ÊTRE EN PREMIER - crée toutes les tables de base
  '1753194983000-FixTargetIdType.ts',
  '1753307000000-CleanNullTargetIds.ts', 
  '1753308000000-AddArchivedTicketStatus.ts',
  '1753308000000-AddCascadeDeleteToTickets.ts',
  '1753309000000-CreateAnnouncementViewsTable.ts',
  '1753745169744-AddOneSignalToUser.ts',
  '1754000000000-CreatePlanningTasksTable.ts',
  '1754200000000-AddDeletedAtToCorrectiveActions.ts',
];

console.log('🧹 Nettoyage des migrations...');

// Supprimer les migrations problématiques
migrationsToDelete.forEach(migration => {
  const filePath = path.join(migrationsPath, migration);  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`❌ Supprimé: ${migration}`);
  }
});

// Vérifier que les migrations restantes existent
console.log('\n✅ Migrations conservées dans l\'ordre:');
migrationsOrder.forEach((migration, index) => {
  const filePath = path.join(migrationsPath, migration);
  if (fs.existsSync(filePath)) {
    console.log(`${index + 1}. ${migration}`);
  } else {
    console.log(`⚠️  MANQUANTE: ${migration}`);
  }
});

// Créer une nouvelle migration pour les push_subscriptions
const pushSubscriptionMigration = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptionsTableFixed1754500000000 implements MigrationInterface {
  name = 'CreatePushSubscriptionsTableFixed1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table push_subscriptions APRÈS que users existe
    await queryRunner.query(\`
      CREATE TABLE "push_subscriptions" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "endpoint" character varying NOT NULL,
        "keys" text NOT NULL,
        "userAgent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id")
      )
    \`);

    // Ajouter la clé étrangère vers users
    await queryRunner.query(\`
      ALTER TABLE "push_subscriptions" 
      ADD CONSTRAINT "FK_push_subscriptions_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    \`);

    // Index pour les performances
    await queryRunner.query(\`
      CREATE INDEX "IDX_push_subscriptions_userId" 
      ON "push_subscriptions" ("userId")
    \`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DROP TABLE IF EXISTS "push_subscriptions"\`);
  }
}`;

const newMigrationPath = path.join(migrationsPath, '1754500000000-CreatePushSubscriptionsTableFixed.ts');
fs.writeFileSync(newMigrationPath, pushSubscriptionMigration);
console.log(`\n✅ Créé: 1754500000000-CreatePushSubscriptionsTableFixed.ts`);

console.log('\n🎯 Migrations nettoyées et réorganisées !');
console.log('   La migration InitialSchema va maintenant créer toutes les tables de base.');
console.log('   Les autres migrations s\'exécuteront dans le bon ordre.');