#!/usr/bin/env ts-node

/**
 * Script d'initialisation pour une base de données fraîche
 * À exécuter après les migrations sur une nouvelle base
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';

async function initFreshDatabase() {
  console.log('🚀 Initialisation de la base de données fraîche...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const tenantsService = app.get(TenantsService);

    // 1. Créer un tenant par défaut (Pizzalif)
    console.log('🏢 Création du tenant par défaut...');
    const tenant = await tenantsService.create({
      name: 'Pizzalif',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
    });
    
    console.log(`✅ Tenant créé: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Créer un admin global (sans tenant)
    console.log('👤 Création de l\'admin global...');
    const admin = await usersService.create(
      'admin@franchisedesk.com',
      'admin123',
      'admin',
      null, // pas de tenant_id pour admin global
      null  // pas de restaurant_id pour admin global
    );
    
    console.log(`✅ Admin global créé: ${admin.email} (ID: ${admin.id})`);

    // 3. Créer un manager pour le tenant
    console.log('🔧 Création du manager tenant...');
    const manager = await usersService.create(
      'manager@pizzalif.com',
      'manager123',
      'manager',
      tenant.id,
      null // pas de restaurant_id pour manager
    );
    
    console.log(`✅ Manager créé: ${manager.email} (ID: ${manager.id})`);

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('\n📝 Comptes créés:');
    console.log(`   Admin Global: admin@franchisedesk.com / admin123`);
    console.log(`   Manager: manager@pizzalif.com / manager123`);
    console.log(`\n🏢 Tenant: ${tenant.name} (ID: ${tenant.id})`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initFreshDatabase()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script échoué:', error);
      process.exit(1);
    });
}