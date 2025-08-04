import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SetupService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async fixProductionSchema() {
    try {
      // 1. Ajouter la colonne name à users
      await this.dataSource.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name character varying DEFAULT NULL
      `).catch(err => {
        console.log('Column name might already exist:', err.message);
      });

      // 2. Créer la table audit_template_items sans foreign key pour l'instant
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS audit_template_items (
          id SERIAL PRIMARY KEY,
          template_id integer,
          question text NOT NULL,
          category varchar(100) NOT NULL,
          response_type varchar(20) NOT NULL DEFAULT 'boolean',
          "order" integer NOT NULL DEFAULT 0,
          is_required boolean NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        )
      `).catch(err => {
        console.log('Table audit_template_items might already exist:', err.message);
      });

      // 3. Vérifier les résultats
      const checks = await this.dataSource.query(`
        SELECT 
          'users.name exists' as check_item,
          EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='name') as result
        UNION ALL
        SELECT 
          'audit_template_items exists',
          EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_name='audit_template_items')
      `);

      return {
        success: true,
        message: 'Schema fix applied',
        checks: checks,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fixing schema',
        error: error.message,
      };
    }
  }
}