// src/invites/invites.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, Tenant]),
    EmailModule, // Utiliser notre EmailModule au lieu de MailerModule
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService], // <-- On exporte le service pour qu'il soit disponible dans d'autres modules
})
export class InvitesModule {}
