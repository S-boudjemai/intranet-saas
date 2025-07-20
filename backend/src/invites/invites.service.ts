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
import { randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private repo: Repository<Invite>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    tenant_id: number,
    invite_email: string,
    restaurant_name?: string,
    restaurant_city?: string,
  ) {
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
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5174';
    const invitationLink = `${frontendUrl}/signup?invite=${token}`;

    // Email personnalisé selon si un restaurant est spécifié
    const restaurantInfo = restaurant_name
      ? `<p><strong>Restaurant:</strong> ${restaurant_name}${restaurant_city ? ` - ${restaurant_city}` : ''}</p>`
      : '';

    await this.mailerService.sendMail({
      to: invite_email,
      subject: 'Vous êtes invité(e) à rejoindre FranchiseHUB !',
      html: `
        <p>Pour finaliser votre inscription, veuillez cliquer sur le lien ci-dessous :</p>
        ${restaurantInfo}
        <a href="${invitationLink}">Créer mon compte</a>
      `,
    });
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
