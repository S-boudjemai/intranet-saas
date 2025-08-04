#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier le schéma de production
 * Exécution: node scripts/check-production-schema.js
 */
const { Client } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || '192.168.1.77',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'internet_saas',
    };

async function checkSchema() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté avec succès\n');

    // 1. Vérifier la colonne 'name' dans users
    console.log('📊 Vérification de la table users...');
    const userColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    const userColumns = userColumnsResult.rows.map(col => col.column_name);
    console.log('Colonnes trouvées:', userColumns);
    
    if (!userColumns.includes('name')) {
      console.log('❌ La colonne "name" manque dans la table users');
    } else {
      console.log('✅ La colonne "name" existe dans la table users');
    }

    // 2. Vérifier l'existence de la table audit_template_items
    console.log('\n📊 Vérification de la table audit_template_items...');
    const auditItemsExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_template_items'
      );
    `);
    
    const auditItemsExists = auditItemsExistsResult.rows[0].exists;
    if (!auditItemsExists) {
      console.log('❌ La table "audit_template_items" n\'existe pas');
    } else {
      console.log('✅ La table "audit_template_items" existe');
    }

    // 3. Vérifier l'existence d'autres tables critiques
    console.log('\n📊 Vérification des autres tables...');
    const tables = [
      'audit_templates',
      'audit_executions',
      'corrective_actions',
      'planning_tasks'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table "${table}": ${exists ? 'existe' : 'manque'}`);
    }

    // 4. Vérifier l'extension uuid-ossp
    console.log('\n📊 Vérification des extensions...');
    const extensionResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension 
        WHERE extname = 'uuid-ossp'
      );
    `);
    
    const uuidExists = extensionResult.rows[0].exists;
    console.log(`${uuidExists ? '✅' : '❌'} Extension uuid-ossp: ${uuidExists ? 'installée' : 'manquante'}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnexion');
  }
}

// Exécuter le diagnostic
checkSchema();