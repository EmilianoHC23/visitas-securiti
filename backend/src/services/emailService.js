// EmailService usando Nodemailer - Backend Email Service
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.initializeNodemailer();
  }

  initializeNodemailer() {
    // Inicialización básica - las variables se verificarán en tiempo de ejecución
    this.enabled = null; // null = no verificado aún
    this.transporter = null;
  }

  // Verificar si el servicio está habilitado (lazy initialization)
  checkEnabled() {
    if (this.enabled === null) {
      // Verificar que tengamos las credenciales necesarias
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('⚠️  SMTP credentials not configured');
        this.enabled = false;
        return false;
      }

      // Configuración SMTP
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      try {
        this.transporter = nodemailer.createTransport(smtpConfig);
        this.enabled = true;
        console.log('✅ EmailService initialized with Nodemailer');
        
        // Verificar la conexión de forma asíncrona
        this.verifyConnection();
        
        return true;
      } catch (error) {
        console.error('❌ Error initializing Nodemailer:', error);
        this.enabled = false;
        return false;
      }
    }
    
    return this.enabled;
  }

  async verifyConnection() {
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified successfully');
      }
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      this.enabled = false;
    }
  }

  isEnabled() {
    return this.checkEnabled();
  }

  async sendTestEmail(to) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: to,
        subject: 'Test Email - Visitas SecuriTI',
        html: `
          <h1>🧪 Test Email</h1>
          <p>Este es un email de prueba del sistema Visitas SecuriTI.</p>
          <p>Si recibes este email, la configuración de Nodemailer está funcionando correctamente.</p>
          <br>
          <p>Fecha: ${new Date().toLocaleString()}</p>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully via Nodemailer');
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVisitConfirmation(visitData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send confirmation to:', visitData.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: visitData.visitorEmail,
        subject: `Confirmación de Visita - ${visitData.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">✅ Visita Confirmada</h1>

            <p>Hola <strong>${visitData.visitorName}</strong>,</p>

            <p>Tu visita ha sido registrada exitosamente en <strong>${visitData.companyName}</strong>.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Detalles de la Visita:</h3>
              <p><strong>Anfitrión:</strong> ${visitData.hostName}</p>
              <p><strong>Motivo:</strong> ${visitData.reason}</p>
              <p><strong>Fecha programada:</strong> ${new Date(visitData.scheduledDate).toLocaleString('es-ES')}</p>
              <p><strong>Estado:</strong> ${visitData.status}</p>
            </div>

            <p>Por favor, llega 10 minutos antes de tu hora programada.</p>

            <p>Si tienes alguna pregunta, contacta a recepción.</p>

            <br>
            <p style="color: #6b7280; font-size: 14px;">
              Sistema de Gestión de Visitas - SecuriTI
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Visit confirmation email sent to:', visitData.visitorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending visit confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVisitNotification(visitData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send notification to host');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Aquí podrías enviar notificación al anfitrión
      // Por ahora, solo log
      console.log('📧 Would send notification to host:', visitData.hostEmail);
      return { success: true, message: 'Notification logged' };
    } catch (error) {
      console.error('❌ Error sending visit notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvitationEmail(invitationData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send invitation to:', invitationData.email);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitationData.token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: invitationData.email,
        subject: `Invitación para unirte a ${invitationData.companyName} - Visitas SecuriTI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 ¡Has sido invitado!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Únete al sistema de gestión de visitas</p>
            </div>

            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px; color: #1f2937;">Hola,</p>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                Has sido invitado a unirte al sistema de gestión de visitas de <strong>${invitationData.companyName}</strong>.
                Tu rol asignado será: <strong>${invitationData.role}</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}"
                   style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                  🚀 Completar Registro
                </a>
              </div>

              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este enlace expirará en 7 días por razones de seguridad.
                  Si el enlace no funciona, copia y pega esta URL en tu navegador:
                </p>
                <p style="margin: 10px 0 0 0; word-break: break-all; color: #92400e; font-family: monospace; font-size: 12px;">
                  ${registrationUrl}
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                Si no esperabas esta invitación, puedes ignorar este email de forma segura.
              </p>

              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Sistema de Gestión de Visitas - SecuriTI
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Invitation email sent to:', invitationData.email);
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 Response:', result.response);
      return { success: true, messageId: result.messageId, response: result.response };
    } catch (error) {
      console.error('❌ Error sending invitation email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();