import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles/roles.guard';
import { Roles } from '../../auth/roles/roles.decorator';
import { Role } from '../../auth/roles/roles.enum';

@Controller('api/email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @Roles(Role.Admin) // Seuls les admins peuvent tester
  async testEmail(@Body() body: { to: string; subject?: string }) {
    const result = await this.emailService.sendEmail({
      to: body.to,
      subject: body.subject || 'Test Resend - FranchiseDesk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Test Email Resend</h2>
          <p>Ceci est un email de test depuis FranchiseDesk.</p>
          <p>Si vous recevez cet email, l'intégration Resend fonctionne correctement ! ✅</p>
          <p style="color: #666; font-size: 14px;">
            Envoyé le ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `,
      text: `
        Test Email Resend - FranchiseDesk
        
        Ceci est un email de test depuis FranchiseDesk.
        
        Si vous recevez cet email, l'intégration Resend fonctionne correctement !
        
        Envoyé le ${new Date().toLocaleString('fr-FR')}
      `,
    });

    return {
      success: result.success,
      error: result.error,
      result: result.result,
      message: result.success 
        ? 'Email de test envoyé avec succès' 
        : 'Erreur lors de l\'envoi'
    };
  }

  @Get('config')
  @Roles(Role.Admin) // Debug config pour admins seulement
  async getConfig() {
    // Ne pas exposer les secrets, juste vérifier leur présence
    return {
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.MAIL_FROM || 'noreply@franchisedesk.fr',
      fromName: process.env.MAIL_FROM_NAME || 'FranchiseDesk',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
    };
  }
}