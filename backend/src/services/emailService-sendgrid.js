const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.initializeSendGrid();
  }

  initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️  SENDGRID_API_KEY not configured. Email functionality will be disabled.');
      this.enabled = false;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.enabled = true;
      console.log('✅ EmailService initialized with SendGrid');
    } catch (error) {
      console.error('❌ Error initializing SendGrid:', error);
      this.enabled = false;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getFromAddress() {
    return process.env.EMAIL_FROM_ADDRESS || 'noreply@visitas-securiti.com';
  }

  getFromName() {
    return process.env.EMAIL_FROM_NAME || 'Visitas SecuriTI';
  }

  // Enviar email básico para testing
  async sendTestEmail(to, subject = 'Test Email from Visitas SecuriTI') {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send test email to:', to);
      return { success: false, error: 'Email service not configured' };
    }

    console.log('🧪 Attempting to send test email to:', to);
    console.log('🔧 From address:', this.getFromAddress());
    console.log('🌐 SendGrid API key configured:', !!process.env.SENDGRID_API_KEY);

    try {
      const msg = {
        to: to,
        from: {
          email: this.getFromAddress(),
          name: this.getFromName()
        },
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
        categories: ['test']
      };

      console.log('📤 Sending email with SendGrid...');
      const response = await sgMail.send(msg);
      
      console.log('✅ Test email sent successfully via SendGrid');
      console.log('📧 Email Log:', {
        to: to,
        subject: subject,
        template: 'test',
        status: 'sent',
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        messageId: response[0].headers['x-message-id'],
        provider: 'sendgrid'
      };

    } catch (error) {
      console.error('❌ SendGrid API error:', error.response?.body || error);
      console.log('📧 Email Log:', {
        to: to,
        subject: subject,
        template: 'test',
        status: 'failed',
        error: error.message,
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
      });

      return { 
        success: false, 
        error: error.response?.body?.errors?.[0]?.message || error.message 
      };
    }
  }

  // Enviar confirmación de visita
  async sendVisitConfirmation(visitData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send visit confirmation to:', visitData.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    console.log('📧 Sending visit confirmation email to:', visitData.visitorEmail);

    try {
      const msg = {
        to: visitData.visitorEmail,
        from: {
          email: this.getFromAddress(),
          name: this.getFromName()
        },
        subject: `Confirmación de Visita - ${visitData.companyName}`,
        html: this.generateVisitConfirmationHTML(visitData),
        categories: ['visit-confirmation']
      };

      console.log('📤 Sending visit confirmation with SendGrid...');
      const response = await sgMail.send(msg);

      console.log('✅ Visit confirmation email sent successfully via SendGrid');
      console.log('📧 Email Log:', {
        to: visitData.visitorEmail,
        subject: msg.subject,
        template: 'visit-confirmation',
        status: 'sent',
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        messageId: response[0].headers['x-message-id'],
        provider: 'sendgrid'
      };

    } catch (error) {
      console.error('❌ Error sending visit confirmation:', error.response?.body || error);
      console.log('📧 Email Log:', {
        to: visitData.visitorEmail,
        subject: `Confirmación de Visita - ${visitData.companyName}`,
        template: 'visit-confirmation',
        status: 'failed',
        error: error.message,
        provider: 'sendgrid',
        timestamp: new Date().toISOString()
      });

      return { 
        success: false, 
        error: error.response?.body?.errors?.[0]?.message || error.message 
      };
    }
  }

  generateVisitConfirmationHTML(visitData) {
    const formatDate = (date) => {
      return new Date(date).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Confirmación de Visita</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">${visitData.companyName}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af;">
              <strong>¡Hola ${visitData.visitorName}!</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #374151;">
              Tu visita ha sido registrada exitosamente. A continuación encontrarás los detalles:
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin-bottom: 15px; font-size: 16px;">Detalles de la Visita:</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Visitante:</td>
                <td style="padding: 8px 0; color: #374151;">${visitData.visitorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Anfitrión:</td>
                <td style="padding: 8px 0; color: #374151;">${visitData.hostName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Fecha y Hora:</td>
                <td style="padding: 8px 0; color: #374151;">${formatDate(visitData.scheduledDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Motivo:</td>
                <td style="padding: 8px 0; color: #374151;">${visitData.reason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Estado:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${visitData.status === 'pending' ? 'Pendiente' : visitData.status}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>Importante:</strong> Presenta una identificación válida al momento de tu llegada. 
              El personal de seguridad validará tu visita antes del acceso.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Gracias por usar nuestro sistema de visitas.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
              Este es un mensaje automático, por favor no responder a este email.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();