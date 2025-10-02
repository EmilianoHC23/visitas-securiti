const { Resend } = require('resend');

class EmailService {
  constructor() {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not configured. Email functionality will be disabled.');
      this.resend = null;
      return;
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromDomain = process.env.EMAIL_FROM_DOMAIN || 'onboarding.resend.dev';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Visitas SecuriTI';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    console.log('✅ EmailService initialized with Resend');
  }

  // Método para verificar si el servicio está disponible
  isEnabled() {
    return this.resend !== null;
  }

  // Construir dirección "from"
  getFromAddress() {
    // Para cuentas gratuitas de Resend, usar un email verificado del usuario
    // En lugar de un dominio personalizado
    return process.env.EMAIL_FROM_ADDRESS || `${this.fromName} <onboarding@resend.dev>`;
  }

  // Enviar email básico para testing
  async sendTestEmail(to, subject = 'Test Email from Visitas SecuriTI') {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send test email to:', to);
      return { success: false, error: 'Email service not configured' };
    }

    console.log('🧪 Attempting to send test email to:', to);
    console.log('🔧 From address:', this.getFromAddress());
    console.log('🌐 Resend API key configured:', !!process.env.RESEND_API_KEY);

    try {
      const emailData = {
        from: this.getFromAddress(),
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Hola desde Visitas SecuriTI!</h2>
            <p>Este es un email de prueba para verificar que el sistema de notificaciones está funcionando correctamente.</p>
            <p>Si recibes este mensaje, ¡todo está configurado perfectamente! 🎉</p>
            <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Este email fue enviado automáticamente por el sistema Visitas SecuriTI.
            </p>
          </div>
        `,
        tags: [
          { name: 'category', value: 'test' }
        ]
      };

      console.log('📤 Sending email with data:', JSON.stringify(emailData, null, 2));

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('❌ Resend API error:', error);
        return { success: false, error: error.message || JSON.stringify(error) };
      }

      console.log('✅ Test email sent successfully:', data.id);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Exception sending test email:', error);
      console.error('❌ Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  // Log de emails enviados (por ahora solo console.log, después haremos modelo de DB)
  async logEmail(emailData) {
    console.log('📧 Email Log:', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      status: emailData.status,
      messageId: emailData.messageId,
      timestamp: new Date().toISOString()
    });
  }

  // Método principal para enviar confirmación de visita (placeholder por ahora)
  async sendVisitConfirmation(visitData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send visit confirmation to:', visitData.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    // Por ahora enviamos un email simple, después haremos template React
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.getFromAddress(),
        to: [visitData.visitorEmail],
        subject: `Confirmación de Visita - ${visitData.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Hola ${visitData.visitorName}!</h2>
            <p>Tu visita a <strong>${visitData.companyName}</strong> ha sido registrada exitosamente.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Detalles de tu visita:</h3>
              <p><strong>Host:</strong> ${visitData.hostName}</p>
              <p><strong>Fecha:</strong> ${new Date(visitData.scheduledDate).toLocaleDateString()}</p>
              <p><strong>Motivo:</strong> ${visitData.reason}</p>
              <p><strong>Estado:</strong> ${visitData.status === 'pending' ? 'Pendiente de aprobación' : 'Aprobada'}</p>
            </div>

            <p>Recibirás otra notificación cuando tu visita sea aprobada.</p>
            
            <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Este email fue enviado automáticamente por ${visitData.companyName}.
            </p>
          </div>
        `,
        tags: [
          { name: 'category', value: 'visit-confirmation' },
          { name: 'company', value: visitData.companyId }
        ]
      });

      if (error) {
        console.error('❌ Error sending visit confirmation:', error);
        await this.logEmail({
          to: visitData.visitorEmail,
          subject: 'Visit Confirmation',
          template: 'visit-confirmation',
          status: 'failed',
          error: error.message
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Visit confirmation sent:', data.id);
      await this.logEmail({
        to: visitData.visitorEmail,
        subject: 'Visit Confirmation',
        template: 'visit-confirmation',
        status: 'sent',
        messageId: data.id
      });

      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Exception sending visit confirmation:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia singleton
module.exports = new EmailService();