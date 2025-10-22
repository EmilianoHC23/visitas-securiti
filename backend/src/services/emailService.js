// EmailService usando Nodemailer - Backend Email Service
const nodemailer = require('nodemailer');
const { formatFullDate, formatDateTime, formatShortDate, formatTime } = require('../utils/dateUtils');

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
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Permite certificados autofirmados
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
          <p>Fecha: ${formatDateTime(new Date())}</p>
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
              <p><strong>Fecha programada:</strong> ${formatDateTime(visitData.scheduledDate)}</p>
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

    // Usar logo dinámico de la empresa o fallback
    const COMPANY_LOGO_URL = data.companyLogo || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;

    try {
      const isApproved = data.status === 'approved';
      const statusText = isApproved ? 'APROBADA' : 'RECHAZADA';
      const primaryColor = '#000000'; // Negro moderno
      const secondaryColor = '#ffffff'; // Blanco
      const statusColor = isApproved ? '#10b981' : '#ef4444';

      // QR para futuras visitas - JSON compatible con el escáner del panel (VisitRegistrationSidePanel)
      // Solo debe prellenar: foto (si hay), nombre, email, empresa. El anfitrión y la razón se llenan manualmente.
      const qrDataForFutureVisits = JSON.stringify({
        type: 'visitor-info',
        email: data.visitorEmail,
        name: data.visitorName,
        company: data.visitorCompany || '',
        photo: data.visitorPhoto || ''
      });

      // QR específico para esta visita (check-in/check-out)
      const qrDataForThisVisit = JSON.stringify({
        type: 'visit-checkin',
        visitId: data.visitId,
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
        qrToken: data.qrToken
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
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 70px; margin-bottom: 20px;">
                        <h1 style="color: ${secondaryColor}; margin: 0; font-size: 28px; font-weight: 600;">Visita ${statusText}</h1>
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
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatFullDate(data.scheduledDate)}</td>
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
                          
                          <!-- QR Codes Section -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid ${primaryColor}; border-radius: 8px; margin: 25px 0;">
                            <tr>
                              <td style="padding: 30px;">
                                <h3 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Tus Códigos QR</h3>
                                
                                <!-- QR for this visit -->
                                <table width="100%" cellpadding="10" cellspacing="0">
                                  <tr>
                                    <td width="50%" style="text-align: center; vertical-align: top; padding: 10px;">
                                      <div style="background-color: #dcfce7; border: 2px dashed #10b981; border-radius: 8px; padding: 15px;">
                                        <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">QR para Esta Visita</h4>
                                        <p style="font-size: 12px; color: #064e3b; margin: 0 0 15px 0;">Úsalo hoy para entrada/salida</p>
                                        <div style="background-color: #ffffff; padding: 10px; display: inline-block; border-radius: 8px;">
                                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataForThisVisit)}" 
                                               alt="QR de esta visita" 
                                               style="width: 150px; height: 150px; display: block;" />
                                        </div>
                                        <p style="font-size: 11px; color: #065f46; margin: 10px 0 0 0; font-weight: 600;">✓ Válido solo para hoy</p>
                                      </div>
                                    </td>
                                    
                                    <td width="50%" style="text-align: center; vertical-align: top; padding: 10px;">
                                      <div style="background-color: #dbeafe; border: 2px dashed #3b82f6; border-radius: 8px; padding: 15px;">
                                        <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">QR Reutilizable</h4>
                                        <p style="font-size: 12px; color: #1e3a8a; margin: 0 0 15px 0;">Para futuras visitas</p>
                                        <div style="background-color: #ffffff; padding: 10px; display: inline-block; border-radius: 8px;">
                                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataForFutureVisits)}" 
                                               alt="QR reutilizable" 
                                               style="width: 150px; height: 150px; display: block;" />
                                        </div>
                                        <p style="font-size: 11px; color: #1e40af; margin: 10px 0 0 0; font-weight: 600;">♾️ Válido siempre</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                
                                <!-- Instructions for QR -->
                                <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-top: 20px; border: 1px solid #dbeafe;">
                                  <p style="font-size: 13px; color: #1e40af; margin: 0 0 10px 0; font-weight: 600; text-align: center;">📱 Cómo usar tus QR:</p>
                                  <table width="100%" cellpadding="5" cellspacing="0">
                                    <tr>
                                      <td style="font-size: 12px; color: #4b5563; line-height: 1.6; padding: 5px 0;">
                                        <strong style="color: #10b981;">• QR Verde:</strong> Muéstralo hoy en recepción para registrar tu entrada y salida rápidamente.
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="font-size: 12px; color: #4b5563; line-height: 1.6; padding: 5px 0;">
                                        <strong style="color: #3b82f6;">• QR Azul:</strong> Guárdalo para tus próximas visitas. Autocompletará tus datos en futuros registros.
                                      </td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Instructions -->
                          <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">Instrucciones Importantes</h4>
                            <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                              <li>Llega 10 minutos antes de tu hora programada</li>
                              <li>Trae una identificación oficial vigente</li>
                              <li>Muestra el QR verde al llegar a recepción</li>
                              <li>Guarda el QR azul para futuras visitas</li>
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
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Motivo de visita:</strong> ${data.reason}</p>
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Fecha solicitada:</strong> ${formatDateTime(data.scheduledDate)}</p>
                                ${data.rejectionReason ? `<p style="color: #991b1b; font-size: 14px; margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid #fecaca;"><strong>Razón de rechazo:</strong> ${data.rejectionReason}</p>` : ''}
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

    // Usar logo dinámico de la empresa o fallback
    const COMPANY_LOGO_URL = data.companyLogo || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#000000'; // Negro moderno
    const secondaryColor = '#ffffff'; // Blanco
    const accentColor = '#4b5563'; // Gris medio

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
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 70px; margin-bottom: 20px;">
                        <h1 style="color: ${secondaryColor}; margin: 0; font-size: 28px; font-weight: 600;">Nueva Solicitud de Visita</h1>
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
                              <!-- Visitor Photo/Icon -->
                              <div style="text-align: center; margin-bottom: 20px;">
                                ${data.visitorPhoto ? `
                                  <img src="${data.visitorPhoto}" alt="Foto del visitante" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid ${primaryColor}; object-fit: cover; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"/>
                                ` : `
                                  <div style="width: 120px; height: 120px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <svg width="70" height="70" viewBox="0 0 24 24" fill="#ffffff">
                                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                  </div>
                                `}
                              </div>
                              
                              <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 18px; text-align: center;">Información del Visitante</h3>
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
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatFullDate(data.scheduledDate)}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Motivo:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${data.reason}</td>
                                </tr>
                              </table>
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
                                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatShortDate(data.startDate)} a las ${data.startTime}</td>
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
                                <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Fecha:</strong> ${formatShortDate(data.startDate)} - ${data.startTime}</p>
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
                                <strong>Fecha:</strong> ${formatFullDate(data.eventDate)}
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

    // Usar logo dinámico de la empresa o fallback
    const COMPANY_LOGO_URL = data.companyLogo || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
    const primaryColor = '#000000'; // Negro moderno
    const secondaryColor = '#ffffff'; // Blanco

    // Calcular tiempo de permanencia (desde entrada física hasta salida)
    const checkInTime = new Date(data.checkInTime);
    const checkOutTime = new Date(data.checkOutTime);
    const registrationTime = new Date(data.registrationTime); // Hora de registro
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
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 70px; margin-bottom: 20px;">
                        <h1 style="color: ${secondaryColor}; margin: 0; font-size: 28px; font-weight: 600;">¡Hasta pronto!</h1>
                        <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 16px;">Gracias por tu visita</p>
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
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatShortDate(registrationTime)}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Hora de llegada:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatTime(registrationTime)}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Hora de entrada:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatTime(checkInTime)}</td>
                                </tr>
                                <tr>
                                  <td style="color: #4b5563; font-size: 14px; padding: 8px 0;"><strong>Hora de salida:</strong></td>
                                  <td style="color: #1f2937; font-size: 14px; padding: 8px 0;">${formatTime(checkOutTime)}</td>
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

  // ============================================
  // EMAILS PARA SISTEMA DE ACCESOS/EVENTOS
  // ============================================

  /**
   * Email 1: Confirmación de acceso creado (al creador)
   * @param {Object} data - { creatorEmail, creatorName, accessTitle, accessType, startDate, endDate, startTime, endTime, location, invitedCount, companyName, companyLogo, additionalInfo }
   */
  async sendAccessCreatedEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access created confirmation');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto; margin-bottom: 15px;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `Acceso ${data.accessTitle} creado exitosamente`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                        <div style="background-color: #10b981; width: 60px; height: 60px; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 32px;">✓</span>
                        </div>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                          ¡Acceso creado y enviado exitosamente!
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0 30px 0;">
                          Hola <strong>${data.creatorName}</strong>,
                        </p>

                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          Se ha creado tu acceso <strong>${data.accessTitle}</strong> exitosamente.
                        </p>

                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                          Tus visitantes recibirán una notificación con las instrucciones del acceso para agilizar su ingreso.
                        </p>

                        <!-- Detalles del acceso -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Detalles del acceso</h2>
                          
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Razón del acceso:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${data.accessType}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Fecha y hora de inicio:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${formatFullDate(new Date(data.startDate))} ${data.startTime}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Fecha y hora de fin:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${formatFullDate(new Date(data.endDate))} ${data.endTime}</td>
                            </tr>
                            ${data.location ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Lugar:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${data.location}</td>
                            </tr>
                            ` : ''}
                            ${data.additionalInfo ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Información adicional:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${data.additionalInfo}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </div>

                        <!-- Acceso enviado a -->
                        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <p style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.6;">
                            <strong>Acceso enviado a:</strong><br>
                            ${data.invitedCount} ${data.invitedCount === 1 ? 'invitado' : 'invitados'}
                          </p>
                        </div>

                        ${data.companyAddress || data.companyEmail ? `
                        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                        ` : ''}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access created email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access created email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 2: Invitación a acceso (a los invitados)
   * @param {Object} data - { invitedEmail, invitedName, hostName, accessTitle, accessType, startDate, endDate, startTime, endTime, location, qrCode, companyName, companyLogo, additionalInfo, companyAddress, companyEmail }
   */
  async sendAccessInvitationEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access invitation');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto; margin-bottom: 15px;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.invitedEmail,
        subject: `Invitación a ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px; font-weight: 600; text-align: center;">
                          Invitación a ${data.companyName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Hola <strong>${data.invitedName}</strong>,
                        </p>

                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          <strong>${data.hostName}</strong> de ${data.companyName} tiene un acceso para <strong>${data.accessTitle}</strong>, el ${formatFullDate(new Date(data.startDate))} ${data.startTime}.
                        </p>

                        <!-- Detalles del acceso -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">Detalles del acceso</h2>
                          
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Fecha y hora de inicio:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${formatFullDate(new Date(data.startDate))} ${data.startTime}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Fecha y hora de fin:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${formatFullDate(new Date(data.endDate))} ${data.endTime}</td>
                            </tr>
                            ${data.location ? `
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Lugar:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${data.location}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Anfitrión:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${data.hostName}</td>
                            </tr>
                            ${data.additionalInfo ? `
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Información adicional:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${data.additionalInfo}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </div>

                        <!-- QR Code -->
                        ${data.qrCode ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px;">
                          <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                            ${data.invitedName}
                          </p>
                          <img src="${data.qrCode}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
                        </div>
                        ` : ''}

                        <!-- Al llegar -->
                        <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                          <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            <strong>📱 Al llegar</strong><br>
                            Muestra este mensaje con una identificación y ¡Dirígete a las filas!
                          </p>
                        </div>

                        ${data.companyAddress || data.companyEmail ? `
                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 25px;">
                          Si tienes alguna duda sobre este acceso, puedes contactar a ${data.hostName}${data.companyEmail ? ` al correo ${data.companyEmail}` : ''}.
                        </p>
                        ` : ''}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access invitation email sent to:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 3: Recordatorio de acceso (al creador cuando el acceso inicia)
   * @param {Object} data - { creatorEmail, creatorName, accessTitle, startDate, startTime, location, companyName, companyLogo }
   */
  async sendAccessReminderToCreatorEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access reminder to creator');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `No olvides la cita ${data.accessTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          No olvides la cita <strong>${data.accessTitle}</strong> el día de hoy. Te notificaremos la llegada de tus visitantes.
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong>Detalles del acceso</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))} ${data.startTime}
                            ${data.location ? `<br><strong>Lugar:</strong> ${data.location}` : ''}
                          </p>
                        </div>

                        ${data.companyAddress || data.companyEmail ? `
                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 25px;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                        ` : ''}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access reminder sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access reminder to creator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 4: Recordatorio de acceso (al invitado cuando el acceso inicia)
   * @param {Object} data - { invitedEmail, invitedName, hostName, accessTitle, startDate, startTime, location, qrCode, companyName, companyLogo }
   */
  async sendAccessReminderToGuestEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access reminder to guest');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.invitedEmail,
        subject: `${data.hostName} de ${data.companyName} te espera para ${data.accessTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.invitedName} Chávez
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          ${data.hostName} de <strong>${data.companyName}</strong> te espera para <strong>${data.accessTitle}</strong>
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <p style="color: #1f2937; margin: 0; font-size: 14px; line-height: 1.8;">
                            <strong>Detalles del acceso</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))} ${data.startTime}<br>
                            ${data.location ? `<strong>Lugar:</strong> ${data.location}<br>` : ''}
                            <strong>Información adicional:</strong> ${data.additionalInfo || 'N/A'}
                          </p>
                        </div>

                        <!-- QR Code -->
                        ${data.qrCode ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                          <img src="${data.qrCode}" alt="QR Code" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
                          <p style="color: #6b7280; font-size: 13px; margin: 10px 0 0 0;">
                            ${data.invitedName}
                          </p>
                        </div>
                        ` : ''}

                        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                          <p style="color: #1e40af; margin: 0; font-size: 14px; text-align: center;">
                            <strong>Tu QR se activa una hora antes de la fecha y hora de inicio. Muéstralo para ingresar.</strong>
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                          Si tienes alguna duda sobre este acceso, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access reminder sent to guest:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access reminder to guest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 5: Notificación de check-in completado (al creador)
   * @param {Object} data - { creatorEmail, creatorName, guestName, accessTitle, companyName, companyLogo }
   */
  async sendGuestCheckedInEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send guest checked-in notification');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `${data.guestName} se aprobó la entrada de un nuevo visitante`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center; margin-top: 20px;">
                          <span style="font-size: 40px;">👤</span>
                        </div>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                          El acceso del visitante ya fue pre-aprobado. Está en espera que se le dé ingreso a tu organización.
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 25px; margin-bottom: 25px; text-align: left;">
                          <p style="color: #166534; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong>Detalle del acceso</strong><br><br>
                            <strong>Razón del acceso:</strong> ${data.accessTitle}<br>
                            <strong>Título:</strong> ${data.accessTitle}
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Guest checked-in email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending guest checked-in email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 6: Modificación de acceso (al creador)
   * @param {Object} data - { creatorEmail, creatorName, accessTitle, startDate, companyName, companyLogo }
   */
  async sendAccessModifiedToCreatorEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access modified to creator');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `Modificación del acceso`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          El acceso <strong>${data.accessTitle}</strong> ha sido modificado, se ha notificado a los demás usuarios y visitantes.
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.8;">
                            <strong>Detalle del acceso</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))} ${data.startTime}
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access modified email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access modified to creator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 7: Modificación de acceso (a los invitados)
   * @param {Object} data - { invitedEmail, invitedName, accessTitle, startDate, qrCode, companyName, companyLogo }
   */
  async sendAccessModifiedToGuestEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access modified to guest');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.invitedEmail,
        subject: `Modificación del acceso en ${data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.invitedName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          El acceso <strong>${data.accessTitle}</strong> se ha modificado.
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <p style="color: #1f2937; margin: 0; font-size: 14px; line-height: 1.8;">
                            <strong>Detalles del acceso</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))} ${data.startTime}
                          </p>
                        </div>

                        <!-- QR Code -->
                        ${data.qrCode ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                          <img src="${data.qrCode}" alt="QR Code" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
                          <p style="color: #6b7280; font-size: 13px; margin: 10px 0 0 0;">
                            ${data.invitedName}
                          </p>
                        </div>
                        ` : ''}

                        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                            Tu acceso ya se encuentra aprobado y es válido desde una hora antes de la fecha y hora de inicio.
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access modified email sent to guest:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access modified to guest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 8: Cancelación de acceso (al creador y a los invitados)
   * @param {Object} data - { recipientEmail, recipientName, accessTitle, startDate, companyName, companyLogo, isCreator }
   */
  async sendAccessCancelledEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access cancelled notification');
      return { success: false, disabled: true };
    }

    try {
      const logoHtml = data.companyLogo 
        ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-width: 150px; height: auto;" />`
        : `<h2 style="color: #1f2937; margin: 0;">${data.companyName}</h2>`;

      const message = data.isCreator 
        ? `El acceso <strong>${data.accessTitle}</strong> se ha cancelado exitosamente, ya hemos notificado a los demás usuarios y visitantes.`
        : `El acceso <strong>${data.accessTitle}</strong> ha sido cancelado y ya no se encuentra vigente.`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.recipientEmail,
        subject: `Acceso cancelado${data.isCreator ? '' : ' en ' + data.companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        ${logoHtml}
                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #fee2e2; display: inline-flex; align-items: center; justify-content: center; margin-top: 20px;">
                          <span style="font-size: 40px; color: #dc2626;">🏢</span>
                        </div>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px; text-align: center;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.recipientName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          ${message}
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: left;">
                          <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.8;">
                            <strong>Detalles del acceso</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))} ${data.startTime}
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Copyright © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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
      console.log('Access cancelled email sent to:', data.recipientEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access cancelled email:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = new EmailService();

