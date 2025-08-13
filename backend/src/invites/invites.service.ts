// ==========================================================
// src/invites/invites.service.ts (Final)
// ==========================================================
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invite } from './entities/invite.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { randomBytes } from 'crypto';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private repo: Repository<Invite>,
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    tenant_id: number,
    invite_email: string,
    restaurant_name?: string,
    restaurant_city?: string,
  ) {
    // Récupérer le nom du tenant pour personnaliser l'email
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenant_id },
      select: ['name']
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant non trouvé');
    }

    const token = randomBytes(16).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    
    const invite = this.repo.create({
      tenant_id,
      invite_email,
      token,
      expires_at,
      restaurant_name,
      restaurant_city,
    });
    
    const savedInvite = await this.repo.save(invite);

    // Envoyer l'email d'invitation via notre EmailService
    const emailResult = await this.emailService.sendInviteEmail(
      invite_email,
      token,
      tenant.name
    );

    if (!emailResult.success) {
      // Log l'erreur mais ne pas faire échouer la création de l'invitation
      console.error('❌ Erreur envoi email invitation:', emailResult.error);
    }

    return savedInvite;
  }

  findAll(tenant_id: number) {
    return this.repo.find({ where: { tenant_id } });
  }

  async revoke(id: number) {
    const invite = await this.repo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    return this.repo.remove(invite);
  }

  // --- NOUVELLE MÉTHODE POUR VÉRIFIER UN TOKEN SANS L'UTILISER ---
  async checkToken(token: string): Promise<Invite> {
    const invite = await this.repo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Token invalide');
    if (invite.used_at) throw new ConflictException('Token déjà utilisé');
    if (invite.expires_at < new Date())
      throw new ConflictException('Token expiré');
    return invite;
  }

  // Cette méthode est maintenant appelée par le AuthService
  async useToken(token: string): Promise<Invite> {
    const invite = await this.checkToken(token); // On réutilise la logique de vérification
    invite.used_at = new Date();
    return this.repo.save(invite);
  }
}
