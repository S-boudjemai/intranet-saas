import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendService } from 'nestjs-resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFromEmail: string;
  private readonly defaultFromName: string;

  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {
    this.defaultFromEmail = this.configService.get<string>('MAIL_FROM') || 'noreply@franchisedesk.fr';
    this.defaultFromName = this.configService.get<string>('MAIL_FROM_NAME') || 'FranchiseDesk';
  }

  /**
   * Envoie un email via Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const fromAddress = options.from || `${this.defaultFromName} <${this.defaultFromEmail}>`;
      
      this.logger.log(`📧 Envoi email à ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      
      // Construire l'objet email avec les propriétés requises
      const emailData: any = {
        from: fromAddress,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      // Ajouter html ou text seulement s'ils sont définis
      if (options.html) {
        emailData.html = options.html;
      }
      if (options.text) {
        emailData.text = options.text;
      }

      // Au moins une des deux propriétés (html ou text) doit être présente
      if (!options.html && !options.text) {
        throw new Error('Au moins un contenu HTML ou texte doit être fourni');
      }

      const result = await this.resendService.send(emailData);

      this.logger.log(`✅ Email envoyé avec succès: ${JSON.stringify(result)}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Erreur envoi email:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Envoie un email d'invitation
   */
  async sendInvitationEmail(
    email: string, 
    inviteToken: string, 
    tenantName: string,
    restaurantName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://intranet-saas.vercel.app';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;
    
    const restaurantText = restaurantName ? ` pour le restaurant ${restaurantName}` : '';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Invitation FranchiseDesk</h2>
        <p>Bonjour,</p>
        <p>Vous êtes invité(e) à rejoindre la plateforme <strong>${tenantName}</strong>${restaurantText} sur FranchiseDesk.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accepter l'invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Cet email a été envoyé par FranchiseDesk. Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
        </p>
      </div>
    `;

    const text = `
      Invitation FranchiseDesk
      
      Bonjour,
      
      Vous êtes invité(e) à rejoindre la plateforme ${tenantName}${restaurantText} sur FranchiseDesk.
      
      Pour accepter l'invitation, cliquez sur ce lien : ${inviteUrl}
      
      Cordialement,
      L'équipe FranchiseDesk
    `;

    return this.sendEmail({
      to: email,
      subject: `Invitation à rejoindre ${tenantName} - FranchiseDesk`,
      html,
      text,
    });
  }

  /**
   * Envoie un email de reset de mot de passe
   */
  async sendPasswordResetEmail(
    email: string, 
    resetToken: string
  ): Promise<{ success: boolean; error?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://intranet-saas.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe sur FranchiseDesk.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #E53E3E; font-weight: bold;">
          ⚠️ Ce lien expire dans 1 heure pour des raisons de sécurité.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
        </p>
      </div>
    `;

    const text = `
      Réinitialisation de mot de passe - FranchiseDesk
      
      Bonjour,
      
      Vous avez demandé à réinitialiser votre mot de passe sur FranchiseDesk.
      
      Pour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetUrl}
      
      ⚠️ Ce lien expire dans 1 heure pour des raisons de sécurité.
      
      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
      
      Cordialement,
      L'équipe FranchiseDesk
    `;

    return this.sendEmail({
      to: email,
      subject: 'Réinitialisation de mot de passe - FranchiseDesk',
      html,
      text,
    });
  }
}