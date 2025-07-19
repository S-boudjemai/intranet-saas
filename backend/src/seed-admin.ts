import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { TenantsService } from './tenants/tenants.service';
import { RestaurantsService } from './restaurant/restaurant.service';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const tenantsService = app.get(TenantsService);
    const restaurantsService = app.get(RestaurantsService);

    // Créer un tenant par défaut
    const tenant = await tenantsService.create({
      name: 'Mon Entreprise',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937'
    });

    // Créer un restaurant par défaut
    const restaurant = await restaurantsService.create({
      name: 'Restaurant Principal',
      city: 'Paris',
      tenant_id: tenant.id
    });

    // Créer l'utilisateur admin
    const admin = await usersService.create({
      email: 'admin@admin.com',
      password: 'admin123',
      role: 'admin',
      tenant_id: tenant.id,
      restaurant_id: restaurant.id
    });

    console.log('✅ Admin créé avec succès !');
    console.log('Email: admin@admin.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await app.close();
  }
}

seedAdmin();