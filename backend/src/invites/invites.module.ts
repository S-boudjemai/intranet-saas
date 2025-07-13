// src/invites/invites.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { MailerModule } from '@nestjs-modules/mailer'; // <-- On importe le module ici

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite]),
    MailerModule, // <-- On rend le service d'email disponible dans ce module
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService], // <-- On exporte le service pour qu'il soit disponible dans d'autres modules
})
export class InvitesModule {}
