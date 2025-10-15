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

    // Logo de la empresa (puedes usar una variable o URL fija)
    const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://securiti.mx/logo.png';

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: visitData.visitorEmail,
        subject: `Confirmación de Visita - ${visitData.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align:center; padding: 24px 0 8px 0;">
              <img src="${COMPANY_LOGO_URL}" alt="Logo ${visitData.companyName}" style="height: 48px; margin-bottom: 8px;" />
            </div>
            <h1 style="color: #2563eb; margin: 0 0 16px 0; font-size: 28px; font-weight: bold;">Visita Confirmada</h1>
            <p style="font-size: 16px; color: #222;">Hola <strong>${visitData.visitorName}</strong>,</p>
            <p style="font-size: 16px; color: #222;">Tu visita ha sido registrada exitosamente en <strong>${visitData.companyName}</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Detalles de la Visita:</h3>
              <p><strong>Anfitrión:</strong> ${visitData.hostName}</p>
              <p><strong>Motivo:</strong> ${visitData.reason}</p>
              <p><strong>Fecha programada:</strong> ${new Date(visitData.scheduledDate).toLocaleString('es-ES')}</p>
              <p><strong>Estado:</strong> ${visitData.status}</p>
            </div>
            <p style="font-size: 15px; color: #222;">Por favor, llega 10 minutos antes de tu hora programada.</p>
            <p style="font-size: 15px; color: #222;">Si tienes alguna pregunta, contacta a recepción.</p>
            <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align:center;">
              Sistema de Gestión de Visitas - ${visitData.companyName}
            </div>
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

  async sendVisitorNotificationEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send visitor notification to:', data.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    if (!data.visitorEmail) {
      console.log('No visitor email provided, skipping notification');
      return { success: false, error: 'No visitor email' };
    }

    const COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;

    try {
      const isApproved = data.status === 'approved';
      const statusText = isApproved ? 'APROBADA' : 'RECHAZADA';
      const primaryColor = '#1e3a8a'; // Azul oscuro SecuriTI
      const accentColor = '#f97316'; // Naranja SecuriTI
      const statusColor = isApproved ? '#10b981' : '#ef4444';

      // QR para futuras visitas - incluye datos del visitante
      const qrDataForFutureVisits = JSON.stringify({
        type: 'visitor-info',
        visitorName: data.visitorName,
        visitorCompany: data.visitorCompany || '',
        visitorEmail: data.visitorEmail,
        hostId: data.hostId
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.visitorEmail,
        subject: `Tu visita ha sido ${statusText.toLowerCase()} - ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Visita ${statusText}</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hola, <strong>${data.visitorName}</strong></p>
                        
                        ${isApproved ? `
                          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                            Excelentes noticias. Tu solicitud de visita a <strong>${data.companyName}</strong> ha sido <strong style="color: ${statusColor};">aprobada</strong>.
                          </p>
                          
                          <!-- Visit Details Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid ${statusColor}; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">Detalles de tu Visita</h3>
                                <table width="100%" cellpadding="5" cellspacing="0">
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Anfitrión:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.hostName}</td>
                                  </tr>
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Fecha:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${new Date(data.scheduledDate).toLocaleString('es-ES', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</td>
                                  </tr>
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Motivo:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.reason}</td>
                                  </tr>
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Destino:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.destination || 'SecurITI'}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- QR Code Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 30px; text-align: center;">
                                <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 20px;">Tu Código QR Personal</h3>
                                <p style="font-size: 14px; color: #4b5563; margin: 0 0 20px 0;">Usa este código en tus próximas visitas para un registro más rápido</p>
                                <div style="background-color: #ffffff; padding: 15px; display: inline-block; border-radius: 8px;">
                                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataForFutureVisits)}" 
                                       alt="Código QR de visitante" 
                                       style="width: 200px; height: 200px; display: block;" />
                                </div>
                                <p style="font-size: 13px; color: #4b5563; margin: 15px 0 5px 0; font-weight: 600;">En tu próxima visita:</p>
                                <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0; line-height: 1.6;">
                                  Tan solo escanea este código QR y tu información se completará automáticamente,<br>
                                  haciendo tu ingreso mucho más sencillo y rápido.
                                </p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Instructions -->
                          <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">Instrucciones Importantes</h4>
                            <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                              <li>Llega 10 minutos antes de tu hora programada</li>
                              <li>Trae una identificación oficial vigente</li>
                              <li>Guarda este código QR para futuras visitas</li>
                            </ul>
                          </div>
                        ` : `
                          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                            Lamentamos informarte que tu solicitud de visita a <strong>${data.companyName}</strong> ha sido <strong style="color: ${statusColor};">rechazada</strong>.
                          </p>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid ${statusColor}; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Detalles de la Solicitud</h3>
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Motivo:</strong> ${data.reason}</p>
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Fecha solicitada:</strong> ${new Date(data.scheduledDate).toLocaleString('es-ES')}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                            Si tienes preguntas sobre esta decisión, puedes contactar directamente con <strong>${data.hostName}</strong> o intentar programar una nueva visita.
                          </p>
                        `}
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas<br>
                          <strong>${data.companyName}</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Visitor notification email sent to: ${data.visitorEmail} (${statusText})`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending visitor notification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendApprovalRequestEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send approval request to host:', data.hostEmail);
      console.log('Approve URL:', data.approveUrl);
      console.log('Reject URL:', data.rejectUrl);
      return { success: false, error: 'Email service not configured' };
    }

    const COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#1e3a8a';
    const accentColor = '#f97316';

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.hostEmail,
        subject: `Nueva solicitud de visita de ${data.visitorName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Nueva Solicitud de Visita</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hola, <strong>${data.hostName}</strong></p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                          <strong>${data.visitorName}</strong> ha solicitado visitarte. Por favor revisa los detalles y responde a la solicitud.
                        </p>
                        
                        <!-- Visitor Details Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 18px;">Información del Visitante</h3>
                              <table width="100%" cellpadding="5" cellspacing="0">
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0; width: 40%;"><strong>Nombre:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.visitorName}</td>
                                </tr>
                                ${data.visitorCompany ? `
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Empresa:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.visitorCompany}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Fecha solicitada:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${new Date(data.scheduledDate).toLocaleString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Motivo:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.reason}</td>
                                </tr>
                              </table>
                              ${data.visitorPhoto ? `
                              <div style="text-align: center; margin-top: 20px;">
                                <img src="${data.visitorPhoto}" alt="Foto del visitante" style="max-width: 200px; border-radius: 8px; border: 2px solid #e5e7eb;"/>
                              </div>
                              ` : ''}
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Action Buttons -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 0 10px;">
                                    <a href="${data.approveUrl}" 
                                       style="background: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                                      Aprobar Visita
                                    </a>
                                  </td>
                                  <td style="padding: 0 10px;">
                                    <a href="${data.rejectUrl}" 
                                       style="background: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);">
                                      Rechazar Visita
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 15px; margin: 25px 0;">
                          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                            <strong>Recordatorio:</strong> Por favor responde a esta solicitud lo antes posible para que el visitante pueda planificar su visita adecuadamente.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas<br>
                          <strong>${data.companyName}</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Approval request email sent to host:', data.hostEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending approval email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvitationEmail(invitationData) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send invitation to:', invitationData.email);
      return { success: false, error: 'Email service not configured' };
    }

    const COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#1e3a8a';
    const accentColor = '#f97316';

    try {
      const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register/user?token=${invitationData.token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: invitationData.email,
        subject: `Invitación para unirte a ${invitationData.companyName} - Visitas SecuriTI`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${invitationData.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Has sido invitado</h1>
                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Únete al sistema de gestión de visitas</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hola,</p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                          Has sido invitado a unirte al sistema de gestión de visitas de <strong>${invitationData.companyName}</strong>.
                        </p>
                        
                        <!-- Role Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px 0;"><strong>Tu rol asignado:</strong></p>
                              <p style="color: ${primaryColor}; font-size: 18px; font-weight: 600; margin: 0;">${invitationData.role}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                          <tr>
                            <td align="center">
                              <a href="${registrationUrl}" 
                                 style="background: linear-gradient(135deg, ${accentColor} 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                                Completar Registro
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Warning Box -->
                        <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                          <p style="color: #92400e; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Importante:</p>
                          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                            Este enlace expirará en <strong>7 días</strong> por razones de seguridad.
                            Si el enlace no funciona, copia y pega esta URL en tu navegador:
                          </p>
                          <p style="margin: 12px 0 0 0; word-break: break-all; color: #92400e; font-family: 'Courier New', monospace; font-size: 12px; background-color: #ffffff; padding: 10px; border-radius: 4px;">
                            ${registrationUrl}
                          </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                          Si no esperabas esta invitación, puedes ignorar este email de forma segura.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Sistema de Gestión de Visitas - SecuriTI<br>
                          <strong>${invitationData.companyName}</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Invitation email sent to:', invitationData.email);
      console.log('Message ID:', result.messageId);
      console.log('Response:', result.response);
      return { success: true, messageId: result.messageId, response: result.response };
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAccessCancellationEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send cancellation emails');
      return { success: false, error: 'Email service not configured' };
    }

    const COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#1e3a8a';
    const accentColor = '#f97316';

    try {
      // Email para los invitados
      if (data.invitedEmails && data.invitedEmails.length > 0) {
        const inviteeMailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          bcc: data.invitedEmails,
          subject: `Acceso cancelado - ${data.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                          <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px; filter: brightness(0) invert(1);">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Acceso Cancelado</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                            Lamentamos informarte que el siguiente acceso/evento ha sido <strong>cancelado</strong>:
                          </p>
                          
                          <!-- Event Details Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 25px;">
                                <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Detalles del acceso cancelado</h3>
                                <table width="100%" cellpadding="5" cellspacing="0">
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0; width: 40%;"><strong>Título:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.title}</td>
                                  </tr>
                                  ${data.reason ? `
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Razón:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.reason}</td>
                                  </tr>
                                  ` : ''}
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Fecha programada:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${new Date(data.startDate).toLocaleDateString('es-ES')} a las ${data.startTime}</td>
                                  </tr>
                                  ${data.location ? `
                                  <tr>
                                    <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Lugar:</strong></td>
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.location}</td>
                                  </tr>
                                  ` : ''}
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                            Si tienes preguntas sobre esta cancelación, por favor contacta a la organización.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                            Sistema de Gestión de Visitas<br>
                            <strong>${data.companyName}</strong>
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        };

        await this.transporter.sendMail(inviteeMailOptions);
        console.log(`Cancellation email sent to ${data.invitedEmails.length} invitee(s)`);
      }

      // Email de confirmación para el creador
      if (data.creatorEmail) {
        const creatorMailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: data.creatorEmail,
          subject: `Confirmación: Acceso cancelado - ${data.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                          <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Acceso Cancelado Exitosamente</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                            El acceso <strong>${data.title}</strong> ha sido cancelado correctamente.
                          </p>
                          
                          <!-- Actions Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 25px;">
                                <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 18px;">Acciones realizadas</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                                  <li>El acceso ya no está disponible para nuevos registros</li>
                                  ${data.invitedEmails && data.invitedEmails.length > 0 ? 
                                    `<li>Se notificó a ${data.invitedEmails.length} invitado(s) sobre la cancelación</li>` : 
                                    '<li>No había invitados para notificar</li>'
                                  }
                                </ul>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Event Details -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 20px;">
                                <h4 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">Detalles del acceso</h4>
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Título:</strong> ${data.title}</p>
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Fecha:</strong> ${new Date(data.startDate).toLocaleDateString('es-ES')} - ${data.startTime}</p>
                                ${data.location ? `<p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Lugar:</strong> ${data.location}</p>` : ''}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                            Sistema de Gestión de Visitas<br>
                            <strong>${data.companyName}</strong>
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        };

        await this.transporter.sendMail(creatorMailOptions);
        console.log(`Cancellation confirmation email sent to creator: ${data.creatorEmail}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending cancellation emails:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Enviar notificación al creador del evento cuando alguien se auto-registra
   * @param {Object} data - Datos del visitante y evento
   * @param {string} data.creatorEmail - Email del creador del evento
   * @param {string} data.creatorName - Nombre del creador
   * @param {string} data.eventTitle - Título del evento
   * @param {string} data.eventDate - Fecha del evento
   * @param {string} data.visitorName - Nombre del visitante registrado
   * @param {string} data.visitorEmail - Email del visitante
   * @param {string} data.visitorCompany - Empresa del visitante
   * @param {string} data.visitorPhone - Teléfono del visitante
   * @param {string} data.visitorPhoto - URL de la foto del visitante
   * @param {string} data.companyName - Nombre de la empresa anfitriona
   */
  async sendAccessRegistrationNotification(data) {
    if (!this.checkEnabled()) {
      console.log('Email service disabled - Would have sent registration notification to creator');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`;
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `Nuevo registro para tu evento: ${data.eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Nuevo Registro</h1>
                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Evento: ${data.eventTitle}</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hola, <strong>${data.creatorName}</strong></p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                          Te informamos que una persona se ha registrado exitosamente para tu evento programado.
                        </p>
                        
                        <!-- Event Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <h2 style="color: ${primaryColor}; margin: 0 0 10px 0; font-size: 18px;">${data.eventTitle}</h2>
                              <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
                                <strong>Fecha:</strong> ${new Date(data.eventDate).toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        ${data.visitorPhoto ? `
                        <!-- Visitor Photo -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                          <tr>
                            <td align="center">
                              <img src="${data.visitorPhoto}" alt="Foto del visitante" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid ${accentColor};">
                            </td>
                          </tr>
                        </table>
                        ` : ''}
                        
                        <!-- Visitor Details Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 25px 0;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Datos del Visitante</h3>
                              
                              <div style="margin-bottom: 15px;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Nombre:</p>
                                <p style="color: #111827; font-weight: bold; font-size: 16px; margin: 0;">${data.visitorName}</p>
                              </div>
                              
                              <div style="margin-bottom: 15px;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Email:</p>
                                <p style="color: #111827; font-size: 15px; margin: 0;">${data.visitorEmail}</p>
                              </div>
                              
                              ${data.visitorCompany ? `
                              <div style="margin-bottom: 15px;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Empresa:</p>
                                <p style="color: #111827; font-size: 15px; margin: 0;">${data.visitorCompany}</p>
                              </div>
                              ` : ''}
                              
                              ${data.visitorPhone ? `
                              <div style="margin-bottom: 15px;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Teléfono:</p>
                                <p style="color: #111827; font-size: 15px; margin: 0;">${data.visitorPhone}</p>
                              </div>
                              ` : ''}
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Status Notice -->
                        <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 15px; margin: 25px 0;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                            <strong>Estado:</strong> Este visitante fue pre-aprobado automáticamente mediante tu código de acceso público.
                          </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                          Puedes ver y gestionar todos los registros para tu evento desde el panel de administración.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un correo automático, por favor no responder<br>
                          Sistema de Gestión de Visitas - <strong>${data.companyName}</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Registration notification email sent to creator: ${data.creatorEmail}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending registration notification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCheckoutEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send checkout email to:', data.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    if (!data.visitorEmail) {
      console.log('No visitor email provided, skipping checkout email');
      return { success: false, error: 'No visitor email' };
    }

    const COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#1e3a8a';
    const accentColor = '#f97316';

    // Calcular tiempo de permanencia
    const checkInTime = new Date(data.checkInTime);
    const checkOutTime = new Date(data.checkOutTime);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const timeStayed = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`;

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.visitorEmail,
        subject: `Gracias por tu visita - ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">¡Hasta pronto!</h1>
                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Gracias por tu visita</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hola, <strong>${data.visitorName}</strong></p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 25px 0;">
                          Queremos agradecerte por visitar <strong>${data.companyName}</strong>. Esperamos que tu visita haya sido productiva y satisfactoria.
                        </p>
                        
                        <!-- Visit Summary Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 18px;">Resumen de tu Visita</h3>
                              <table width="100%" cellpadding="5" cellspacing="0">
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0; width: 45%;"><strong>Anfitrión:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.hostName}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Fecha de visita:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${checkInTime.toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric'
                                  })}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Hora de entrada:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${checkInTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Hora de salida:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${checkOutTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Tiempo de permanencia:</strong></td>
                                  <td style="color: #10b981; font-size: 14px; padding: 8px 0; font-weight: 600;">${timeStayed}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Thank You Message -->
                        <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                          <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.8; text-align: center;">
                            <strong>¡Esperamos verte pronto!</strong><br>
                            Siempre serás bienvenido en <strong>${data.companyName}</strong>
                          </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
                          Si tienes algún comentario o sugerencia sobre tu visita,<br>
                          no dudes en contactarnos.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas<br>
                          <strong>${data.companyName}</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Checkout email sent to: ${data.visitorEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending checkout email:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = new EmailService();
