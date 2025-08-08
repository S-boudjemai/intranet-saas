import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

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
    private readonly configService: ConfigService,
  ) {
    this.defaultFromEmail = this.configService.get<string>('MAIL_FROM') || 'noreply@franchisedesk.fr';
    this.defaultFromName = this.configService.get<string>('MAIL_FROM_NAME') || 'FranchiseDesk';
    
    // Configuration SendGrid
    const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
      this.logger.log(`🔧 EmailService initialisé avec SendGrid`);
      this.logger.log(`🔧 From: ${this.defaultFromName} <${this.defaultFromEmail}>`);
      this.logger.log(`🔧 SendGrid API Key: ${sendgridApiKey.substring(0, 10)}...`);
    } else {
      this.logger.error(`❌ SENDGRID_API_KEY non définie !`);
    }
    
    this.logger.log(`🔧 Frontend URL: ${this.configService.get<string>('FRONTEND_URL')}`);
  }

  /**
   * Envoie un email via SendGrid
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string; result?: any }> {
    try {
      const fromAddress = options.from || `${this.defaultFromName} <${this.defaultFromEmail}>`;
      
      this.logger.log(`📧 Tentative envoi email depuis ${fromAddress} vers ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      this.logger.log(`📧 Sujet: ${options.subject}`);
      
      // Construire l'objet email pour SendGrid
      const msg: any = {
        to: options.to,
        from: fromAddress,
        subject: options.subject,
      };

      // Ajouter html et/ou text
      if (options.html) {
        msg.html = options.html;
      }
      if (options.text) {
        msg.text = options.text;
      }

      // Au moins une des deux propriétés (html ou text) doit être présente
      if (!options.html && !options.text) {
        throw new Error('Au moins un contenu HTML ou texte doit être fourni');
      }

      this.logger.log(`📧 Configuration email: ${JSON.stringify({
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        hasHtml: !!msg.html,
        hasText: !!msg.text
      })}`);

      // Envoyer avec SendGrid
      const [response] = await sgMail.send(msg);

      this.logger.log(`✅ Email envoyé avec succès via SendGrid!`);
      this.logger.log(`✅ Status: ${response.statusCode}`);
      this.logger.log(`✅ Headers: ${JSON.stringify(response.headers)}`);
      
      return { 
        success: true, 
        result: {
          statusCode: response.statusCode,
          headers: response.headers,
        }
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur détaillée envoi email SendGrid:`);
      this.logger.error(`❌ Type d'erreur: ${error.constructor?.name}`);
      this.logger.error(`❌ Message: ${error.message}`);
      
      // Gestion spécifique des erreurs SendGrid
      if (error.response) {
        this.logger.error(`❌ SendGrid Status Code: ${error.response.statusCode}`);
        this.logger.error(`❌ SendGrid Response Body: ${JSON.stringify(error.response.body)}`);
        
        // Extraire le message d'erreur détaillé
        if (error.response.body?.errors?.length > 0) {
          const firstError = error.response.body.errors[0];
          this.logger.error(`❌ SendGrid Error Detail: ${firstError.message}`);
          return { 
            success: false, 
            error: firstError.message || 'Erreur SendGrid'
          };
        }
      }
      
      return { 
        success: false, 
        error: error.message || 'Erreur inconnue lors de l\'envoi'
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
   * Envoie un email de reset de mot de passe (utilisé par auth.service)
   * Note: Cette méthode envoie un code à 6 chiffres, pas un token URL
   */
  async sendPasswordResetCode(
    email: string, 
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <p>Voici votre code de validation :</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #4F46E5; margin: 0; letter-spacing: 5px; font-size: 32px;">${code}</h1>
        </div>
        <p style="color: #E53E3E; font-weight: bold;">⚠️ Ce code expire dans 15 minutes.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Cet email a été envoyé par FranchiseDesk. Ne répondez pas à cet email.
        </p>
      </div>
    `;

    const text = `
      Réinitialisation de mot de passe - FranchiseDesk
      
      Bonjour,
      
      Vous avez demandé une réinitialisation de votre mot de passe.
      
      Voici votre code de validation : ${code}
      
      ⚠️ Ce code expire dans 15 minutes.
      
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      
      Cordialement,
      L'équipe FranchiseDesk
    `;

    return this.sendEmail({
      to: email,
      subject: 'Code de réinitialisation - FranchiseDesk',
      html,
      text,
    });
  }

  /**
   * Envoie un email de reset de mot de passe avec URL (méthode legacy si besoin)
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