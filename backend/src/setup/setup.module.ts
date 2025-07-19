import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { RestaurantsModule } from '../restaurant/restaurant.module';

@Module({
  imports: [UsersModule, TenantsModule, RestaurantsModule],
  controllers: [SetupController],
})
export class SetupModule {}