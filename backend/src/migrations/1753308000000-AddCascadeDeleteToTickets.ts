import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeDeleteToTickets1753308000000 implements MigrationInterface {
  name = 'AddCascadeDeleteToTickets1753308000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cette migration est maintenant vide car InitialSchema crée déjà les FK avec CASCADE
    // Les contraintes FK sont déjà correctement configurées dans InitialSchema
    console.log('⚙️  AddCascadeDeleteToTickets: Les contraintes CASCADE sont déjà présentes dans InitialSchema');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rien à faire car cette migration est maintenant vide
    console.log('⚙️  AddCascadeDeleteToTickets rollback: Rien à faire');
  }
}