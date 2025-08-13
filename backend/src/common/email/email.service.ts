import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.defaultFromEmail = this.configService.get<string>('MAIL_FROM') || 'noreply@franchisedesk.fr';
    this.defaultFromName = this.configService.get<string>('MAIL_FROM_NAME') || 'FranchiseDesk';
    
    // Configuration SMTP (Gmail obligatoire maintenant)
    const smtpHost = this.configService.get<string>('MAIL_HOST');
    const smtpPort = this.configService.get<string>('MAIL_PORT');
    const smtpUser = this.configService.get<string>('MAIL_USER');
    const smtpPass = this.configService.get<string>('MAIL_PASS');
    
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      
      this.logger.log(`🔧 EmailService initialisé avec SMTP (${smtpHost})`);
      this.logger.log(`🔧 From: ${this.defaultFromName} <${this.defaultFromEmail}>`);
      this.logger.log(`🔧 SMTP User: ${smtpUser}`);
      
    } else {
      this.logger.error(`❌ Configuration SMTP manquante !`);
      this.logger.error(`❌ Variables requises : MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS`);
      throw new Error('Configuration SMTP requise pour le service email');
    }
    
    this.logger.log(`🔧 Frontend URL: ${this.configService.get<string>('FRONTEND_URL')}`);
  }

  /**
   * Envoie un email via SMTP
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string; result?: any }> {
    try {
      if (!this.transporter) {
        throw new Error('Service email non configuré');
      }

      const fromAddress = options.from || `${this.defaultFromName} <${this.defaultFromEmail}>`;
      
      this.logger.log(`📧 Tentative envoi email depuis ${fromAddress} vers ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      this.logger.log(`📧 Sujet: ${options.subject}`);
      
      // Au moins une des deux propriétés (html ou text) doit être présente
      if (!options.html && !options.text) {
        throw new Error('Au moins un contenu HTML ou texte doit être fourni');
      }

      const mailOptions = {
        from: fromAddress,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email envoyé avec succès via SMTP!`);
      this.logger.log(`📧 Message ID: ${result.messageId}`);
      
      return { 
        success: true, 
        result: {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
        }
      };
      
    } catch (error) {
      this.logger.error(`❌ Erreur envoi email: ${error.message}`);
      this.logger.error(error.stack);
      
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
      };
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(to: string, name: string): Promise<{ success: boolean; error?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    
    return this.sendEmail({
      to,
      subject: 'Bienvenue sur FranchiseDesk !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FranchiseDesk</h1>
          </div>
          <h2 style="color: #333;">Bienvenue ${name} !</h2>
          <p style="color: #666; line-height: 1.6;">Votre compte a été créé avec succès sur FranchiseDesk.</p>
          <p style="color: #666; line-height: 1.6;">Vous pouvez maintenant vous connecter à votre espace :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Se connecter</a>
          </div>
          <p style="color: #666; line-height: 1.6;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">L'équipe FranchiseDesk</p>
        </div>
      `,
      text: `Bienvenue ${name} ! Votre compte a été créé. Connectez-vous sur ${frontendUrl}/login`,
    });
  }

  /**
   * Envoie un email d'invitation
   */
  async sendInviteEmail(to: string, inviteCode: string, tenantName: string): Promise<{ success: boolean; error?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const signupUrl = `${frontendUrl}/signup?invite=${inviteCode}`;
    
    return this.sendEmail({
      to,
      subject: `Invitation à rejoindre ${tenantName} sur FranchiseDesk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FranchiseDesk</h1>
          </div>
          <h2 style="color: #333;">Vous êtes invité à rejoindre ${tenantName}</h2>
          <p style="color: #666; line-height: 1.6;">Vous avez été invité à rejoindre l'équipe de <strong>${tenantName}</strong> sur FranchiseDesk.</p>
          <p style="color: #666; line-height: 1.6;">Cliquez sur le lien ci-dessous pour créer votre compte :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupUrl}" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Créer mon compte</a>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">Ou copiez ce lien dans votre navigateur :</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">${signupUrl}</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⏰ Important :</strong> Ce lien est valable pendant 7 jours.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">L'équipe FranchiseDesk</p>
        </div>
      `,
      text: `Vous êtes invité à rejoindre ${tenantName} sur FranchiseDesk. Créez votre compte sur : ${signupUrl} (valable 7 jours)`,
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/forgot-password?token=${resetToken}`;
    
    return this.sendEmail({
      to,
      subject: 'Réinitialisation de votre mot de passe FranchiseDesk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FranchiseDesk</h1>
          </div>
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p style="color: #666; line-height: 1.6;">Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p style="color: #666; line-height: 1.6;">Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">Ou copiez ce lien dans votre navigateur :</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">${resetUrl}</p>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-size: 14px;"><strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure seulement.</p>
          </div>
          <p style="color: #666; line-height: 1.6;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email en toute sécurité.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">L'équipe FranchiseDesk</p>
        </div>
      `,
      text: `Réinitialisez votre mot de passe FranchiseDesk sur : ${resetUrl} (valable 1 heure). Si vous n'avez pas demandé ceci, ignorez cet email.`,
    });
  }
}