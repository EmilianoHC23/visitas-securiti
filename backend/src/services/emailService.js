// EmailService usando Nodemailer - Backend Email Service
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
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

  /**
   * Genera URL temporal para foto de visitante
   * @param {string} visitId - ID de la visita
   * @returns {string} URL pública temporal con token JWT
   */
  generateVisitorPhotoUrl(visitId) {
    // Generar token JWT que expira en 30 días
    const token = jwt.sign(
      { 
        visitId: visitId,
        type: 'visitor-photo'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Construir URL pública
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const photoUrl = `${baseUrl}/api/visits/visitor-photo/${visitId}/${token}`;
    
    console.log(`🔗 URL temporal generada para visita ${visitId}`);
    return photoUrl;
  }

  /**
   * Genera URL temporal para logo de empresa
   * @param {string} companyId - ID de la empresa
   * @returns {string} URL pública temporal con token JWT
   */
  generateCompanyLogoUrl(companyId) {
    // Generar token JWT que expira en 90 días (logos cambian con menos frecuencia)
    const token = jwt.sign(
      { 
        companyId: companyId,
        type: 'company-logo'
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );
    
    // Construir URL pública
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const logoUrl = `${baseUrl}/api/company/logo/${companyId}/${token}`;
    
    console.log(`🏢 URL temporal generada para logo de empresa ${companyId}`);
    return logoUrl;
  }

  /**
   * Genera URL temporal para imagen de evento
   * @param {string} accessId - ID del acceso/evento
   * @returns {string} URL pública temporal con token JWT
   */
  generateEventImageUrl(accessId) {
    // Generar token JWT que expira en 60 días
    const token = jwt.sign(
      { 
        accessId: accessId,
        type: 'event-image'
      },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );
    
    // Construir URL pública
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/api/access/event-image/${accessId}/${token}`;
    
    console.log(`🖼️ URL temporal generada para imagen de evento ${accessId}`);
    return imageUrl;
  }

  /**
   * Genera URL temporal para foto de ubicación de empresa
   * @param {string} companyId - ID de la empresa
   * @returns {string} URL pública temporal con token JWT
   */
  generateLocationPhotoUrl(companyId) {
    // Generar token JWT que expira en 90 días (fotos de ubicación cambian con menos frecuencia)
    const token = jwt.sign(
      { 
        companyId: companyId,
        type: 'location-photo'
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' }
    );
    
    // Construir URL pública
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const photoUrl = `${baseUrl}/api/company/location-photo/${companyId}/${token}`;
    
    console.log(`📍 URL temporal generada para foto de ubicación de empresa ${companyId}`);
    return photoUrl;
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      // Es Base64, generar URL temporal
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [EMAIL] Logo empresa: Generando URL temporal con JWT');
      } else {
        // Fallback si no hay companyId
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [EMAIL] No companyId disponible, usando logo fallback');
      }
    } else if (data.companyLogo) {
      // Ya es una URL pública
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [EMAIL] Logo empresa: URL pública detectada');
    } else {
      // No hay logo, usar fallback
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [EMAIL] No logo disponible, usando fallback');
    }

    try {
      const isApproved = data.status === 'approved';
      const statusText = isApproved ? 'APROBADA' : 'RECHAZADA';
      const primaryColor = '#1e3a8a'; // Azul oscuro
      const secondaryColor = '#ffffff'; // Blanco
      const accentColor = '#f97316'; // Naranja
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
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px;">
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [APPROVAL] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [APPROVAL] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [APPROVAL] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [APPROVAL] Sin logo, usando fallback');
    }
    
    // 🔗 Generar URL temporal para foto del visitante (si existe y es Base64)
    let visitorPhotoUrl = null;
    if (data.visitorPhoto && data.visitorPhoto.startsWith('data:image')) {
      // Es Base64, generar URL temporal
      visitorPhotoUrl = this.generateVisitorPhotoUrl(data.visitId);
      console.log('🖼️ [Approval Request] Foto de visitante convertida a URL temporal');
    } else if (data.visitorPhoto) {
      // Ya es una URL pública, usarla directamente
      visitorPhotoUrl = data.visitorPhoto;
      console.log('🖼️ [Approval Request] Usando URL pública de foto de visitante');
    }
    
    const primaryColor = '#1e3a8a'; // Azul oscuro
    const secondaryColor = '#ffffff'; // Blanco
    const accentColor = '#f97316'; // Naranja

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
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px;">
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
                                ${visitorPhotoUrl ? `
                                  <img src="${visitorPhotoUrl}" alt="Foto del visitante" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid ${primaryColor}; object-fit: cover; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"/>
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (invitationData.companyLogo && invitationData.companyLogo.startsWith('data:image')) {
      if (invitationData.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(invitationData.companyId);
        console.log('🏢 [INVITATION] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [INVITATION] No companyId, usando fallback');
      }
    } else if (invitationData.companyLogo) {
      COMPANY_LOGO_URL = invitationData.companyLogo;
      console.log('🏢 [INVITATION] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [INVITATION] Sin logo, usando fallback');
    }

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
                        <img src="${COMPANY_LOGO_URL}" alt="${invitationData.companyName}" style="max-height: 50px; margin-bottom: 20px;">
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [CANCELLATION] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [CANCELLATION] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [CANCELLATION] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [CANCELLATION] Sin logo, usando fallback');
    }

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
                          <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px; filter: brightness(0) invert(1);">
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
                          <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                            Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
                          <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px;">
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
                          <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                            Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [REGISTRATION NOTIFICATION] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [REGISTRATION NOTIFICATION] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [REGISTRATION NOTIFICATION] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [REGISTRATION NOTIFICATION] Sin logo, usando fallback');
    }

    try {
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
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px;">
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [CHECKOUT] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [CHECKOUT] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [CHECKOUT] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [CHECKOUT] Sin logo, usando fallback');
    }
    
    const primaryColor = '#1e3a8a'; // Azul oscuro
    const secondaryColor = '#ffffff'; // Blanco
    const accentColor = '#f97316'; // Naranja

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
                      <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                        <img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-height: 50px; margin-bottom: 20px;">
                        <h1 style="color: ${secondaryColor}; margin: 0; font-size: 28px; font-weight: 600;">¡Hasta pronto!</h1>
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
  // Fallback para creatorName
  const creatorName = data.creatorName && typeof data.creatorName === 'string' && data.creatorName.trim() ? data.creatorName : 'Anfitrión';
  // Fallback para hora de inicio/fin
  const startTime = data.startTime && typeof data.startTime === 'string' && data.startTime.trim() ? data.startTime : '';
  const endTime = data.endTime && typeof data.endTime === 'string' && data.endTime.trim() ? data.endTime : '';
  const showTimeRange = startTime && endTime && startTime !== endTime;
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access created confirmation');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [ACCESS CREATED] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [ACCESS CREATED] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [ACCESS CREATED] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [ACCESS CREATED] Sin logo, usando fallback');
    }

    // Generar URL temporal para la imagen del evento si existe y es Base64
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [ACCESS CREATED] Imagen del evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [ACCESS CREATED] No accessId para imagen temporal');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
      console.log('🖼️ [ACCESS CREATED] Imagen del evento: URL pública');
    } else {
      EVENT_IMAGE_URL = null;
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto; margin-bottom: 15px;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

        // Generar URL temporal para la imagen del evento si existe y es Base64
        let EVENT_IMAGE_URL;
        if (data.eventImage && data.eventImage.startsWith('data:image')) {
          if (data.accessId) {
            EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
          } else {
            EVENT_IMAGE_URL = null;
          }
        } else if (data.eventImage) {
          EVENT_IMAGE_URL = data.eventImage;
        } else {
          EVENT_IMAGE_URL = null;
        }

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
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                          ¡Acceso creado y enviado exitosamente!
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0 30px 0;">
                          Hola <strong>${creatorName}</strong>,
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
                          
                          ${EVENT_IMAGE_URL ? `
                          <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${EVENT_IMAGE_URL}" alt="Imagen del evento" style="max-width: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                          </div>
                          ` : ''}
                          
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Razón del acceso:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${data.accessType}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Fecha y hora de inicio:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${formatFullDate(new Date(data.startDate))}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Fecha y hora de fin:</td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${formatFullDate(new Date(data.endDate))}</td>
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
                        <div style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access created email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access created email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 2: Invitación a acceso (a los invitados)
   * @param {Object} data - { invitedEmail, invitedName, hostName, accessTitle, accessType, startDate, endDate, startTime, endTime, location, qrCode, companyName, companyLogo, additionalInfo, companyAddress, companyEmail, eventImage, accessId, companyId }
   */
  async sendAccessInvitationEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access invitation');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [ACCESS INVITATION] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [ACCESS INVITATION] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [ACCESS INVITATION] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [ACCESS INVITATION] Sin logo, usando fallback');
    }

    // Generar URL temporal para la imagen del evento si existe y es Base64
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [ACCESS INVITATION] Imagen evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [ACCESS INVITATION] No accessId para imagen de evento');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
      console.log('🖼️ [ACCESS INVITATION] Imagen evento: URL pública');
    } else {
      EVENT_IMAGE_URL = null;
    }

    // Generar URL temporal para la foto de ubicación si existe y es Base64
    let LOCATION_PHOTO_URL;
    if (data.companyLocation?.photo && data.companyLocation.photo.startsWith('data:image')) {
      if (data.companyId) {
        LOCATION_PHOTO_URL = this.generateLocationPhotoUrl(data.companyId);
        console.log('📍 [ACCESS INVITATION] Foto de ubicación: URL temporal generada');
      } else {
        LOCATION_PHOTO_URL = null;
        console.warn('⚠️ [ACCESS INVITATION] No companyId para foto de ubicación');
      }
    } else if (data.companyLocation?.photo) {
      LOCATION_PHOTO_URL = data.companyLocation.photo;
      console.log('📍 [ACCESS INVITATION] Foto de ubicación: URL pública');
    } else {
      LOCATION_PHOTO_URL = null;
    }

    // Fallback para hostName
    const hostName = data.hostName && typeof data.hostName === 'string' && data.hostName.trim() ? data.hostName : (data.creatorName && typeof data.creatorName === 'string' && data.creatorName.trim() ? data.creatorName : 'Anfitrión');
    // Fallback para hora de inicio/fin
    const startTime = data.startTime && typeof data.startTime === 'string' && data.startTime.trim() ? data.startTime : '';
    const endTime = data.endTime && typeof data.endTime === 'string' && data.endTime.trim() ? data.endTime : '';
    const showTimeRange = startTime && endTime && startTime !== endTime;

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto; margin-bottom: 15px;" />`
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
                      <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
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
                          <strong>${hostName}</strong> de ${data.companyName} tiene un acceso para <strong>${data.accessTitle}</strong>, el ${formatFullDate(new Date(data.startDate))}.
                        </p>
                        <!-- Detalles del acceso -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">Detalles del acceso</h2>
                          ${EVENT_IMAGE_URL ? `
                          <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${EVENT_IMAGE_URL}" alt="Imagen del evento" style="max-width: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                          </div>
                          ` : ''}
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Fecha y hora de inicio:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${formatFullDate(new Date(data.startDate))}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Fecha y hora de fin:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${formatFullDate(new Date(data.endDate))}</td>
                            </tr>
                            ${data.location ? `
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Lugar:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${data.location}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Anfitrión:</td>
                              <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 500;">${hostName}</td>
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
                        ${data.qrData ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px;">
                          <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                            ${data.invitedName}
                          </p>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrData)}" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
                        </div>
                        ` : ''}

                        ${data.companyLocation && (data.companyLocation.street || LOCATION_PHOTO_URL) ? `
                        <!-- Dirección de la empresa -->
                        <div style="background-color: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                          <div style="flex items-center gap-2 mb-3">
                            <h3 style="color: #0c4a6e; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">📍 Ubicación</h3>
                          </div>
                          
                          ${data.companyLocation.street ? `
                          <p style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            ${data.companyLocation.googleMapsUrl ? `<a href="${data.companyLocation.googleMapsUrl}" target="_blank" style="color: #0c4a6e; text-decoration: none; font-weight: 500;">` : ''}
                            ${[
                              data.companyLocation.street,
                              data.companyLocation.colony,
                              data.companyLocation.postalCode,
                              data.companyLocation.city,
                              data.companyLocation.state,
                              data.companyLocation.country
                            ].filter(Boolean).join(', ')}
                            ${data.companyLocation.googleMapsUrl ? `</a>` : ''}
                          </p>
                          ` : ''}
                          
                          ${LOCATION_PHOTO_URL ? `
                          <div style="text-align: center; margin-top: 15px;">
                            <img src="${LOCATION_PHOTO_URL}" alt="Foto de la empresa" style="max-width: 100%; max-height: 200px; height: auto; border-radius: 8px; border: 1px solid #bae6fd;" />
                          </div>
                          ` : ''}
                        </div>
                        ` : ''}

                        <!-- Al llegar -->
                        <div style="background-color: #fef3c7; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            <strong>📱 Al llegar</strong><br>
                            ${data.companyLocation?.arrivalInstructions || 'Muestra este mensaje con una identificación y ¡Dirígete a las filas!'}
                          </p>
                        </div>
                        ${data.companyAddress || data.companyEmail ? `
                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 25px;">
                          Si tienes alguna duda sobre este acceso, puedes contactar a ${hostName}${data.companyEmail ? ` al correo ${data.companyEmail}` : ''}.
                        </p>
                        ` : ''}
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access invitation email sent to:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 3: Recordatorio de acceso (al creador cuando el acceso inicia)
   * @param {Object} data - { creatorEmail, creatorName, accessTitle, startDate, startTime, location, companyName, companyLogo, eventImage, accessId, companyId, additionalInfo }
   */
  async sendAccessReminderToCreatorEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access reminder to creator');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [REMINDER CREATOR] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [REMINDER CREATOR] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [REMINDER CREATOR] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [REMINDER CREATOR] Sin logo, usando fallback');
    }

    // Generar URL temporal para la imagen del evento si existe y es Base64
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [REMINDER CREATOR] Imagen del evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [REMINDER CREATOR] No accessId para imagen temporal');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
      console.log('🖼️ [REMINDER CREATOR] Imagen del evento: URL pública');
    } else {
      EVENT_IMAGE_URL = null;
    }

    // Fallbacks para variables usadas en la plantilla
    const creatorName = data.creatorName && typeof data.creatorName === 'string' && data.creatorName.trim()
      ? data.creatorName
      : 'Anfitrión';
    const startTime = data.startTime && typeof data.startTime === 'string' && data.startTime.trim()
      ? data.startTime
      : '';

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          No olvides la cita <strong>${data.accessTitle}</strong> el día de hoy. Te notificaremos la llegada de tus visitantes.
                        </p>

                        ${EVENT_IMAGE_URL ? `
                        <!-- Imagen del evento -->
                        <div style="text-align: center; margin-bottom: 25px;">
                          <img src="${EVENT_IMAGE_URL}" alt="Imagen del evento" style="max-width: 100%; max-height: 250px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                        </div>
                        ` : ''}

                        <!-- Detalles -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Detalles del acceso</h3>
                          
                          <p style="color: #4b5563; margin: 8px 0; font-size: 14px; line-height: 1.8;">
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))}<br>
                            <strong>Fecha y hora de fin:</strong> ${formatFullDate(new Date(data.endDate))}
                            ${data.location ? `<br><strong>Lugar:</strong> ${data.location}` : ''}
                            ${data.additionalInfo ? `<br><strong>Información adicional:</strong> ${data.additionalInfo}` : ''}
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 25px;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access reminder sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access reminder to creator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 4: Recordatorio de acceso (al invitado cuando el acceso inicia)
   * @param {Object} data - { invitedEmail, invitedName, hostName, accessTitle, startDate, startTime, location, qrCode, companyName, companyLogo, eventImage, accessId, companyId, additionalInfo }
   */
  async sendAccessReminderToGuestEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access reminder to guest');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [REMINDER GUEST] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [REMINDER GUEST] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [REMINDER GUEST] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [REMINDER GUEST] Sin logo, usando fallback');
    }

    // Generar URL temporal para la imagen del evento si existe y es Base64
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [REMINDER GUEST] Imagen del evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [REMINDER GUEST] No accessId para imagen temporal');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
      console.log('🖼️ [REMINDER GUEST] Imagen del evento: URL pública');
    } else {
      EVENT_IMAGE_URL = null;
    }

    // Fallbacks para variables usadas en la plantilla
    const hostName = data.hostName && typeof data.hostName === 'string' && data.hostName.trim()
      ? data.hostName
      : (data.creatorName && typeof data.creatorName === 'string' && data.creatorName.trim() ? data.creatorName : 'Anfitrión');
    const startTime = data.startTime && typeof data.startTime === 'string' && data.startTime.trim()
      ? data.startTime
      : '';

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.invitedEmail,
        subject: `${hostName} de ${data.companyName} te espera para ${data.accessTitle}`,
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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.invitedName}
                        </h1>
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          ${hostName} de <strong>${data.companyName}</strong> te espera para <strong>${data.accessTitle}</strong>
                        </p>

                        ${EVENT_IMAGE_URL ? `
                        <!-- Imagen del evento -->
                        <div style="text-align: center; margin-bottom: 25px;">
                          <img src="${EVENT_IMAGE_URL}" alt="Imagen del evento" style="max-width: 100%; max-height: 250px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                        </div>
                        ` : ''}

                        <!-- Detalles -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Detalles del acceso</h3>
                          
                          <p style="color: #4b5563; margin: 8px 0; font-size: 14px; line-height: 1.8;">
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))}<br>
                            <strong>Fecha y hora de fin:</strong> ${formatFullDate(new Date(data.endDate))}
                            ${data.location ? `<br><strong>Lugar:</strong> ${data.location}` : ''}
                            ${data.additionalInfo ? `<br><strong>Información adicional:</strong> ${data.additionalInfo}` : ''}
                          </p>
                        </div>

                        <!-- QR Code -->
                        ${data.qrData ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrData)}" alt="QR Code" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access reminder sent to guest:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access reminder to guest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 5: Notificación de check-in completado (al creador)
   * @param {Object} data - { creatorEmail, creatorName, guestName, guestEmail, guestCompany, guestPhoto, visitId, accessTitle, checkInTime, location, companyName, companyId, companyLogo }
   */
  async sendGuestCheckedInEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send guest checked-in notification');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [GUEST CHECKED IN] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [GUEST CHECKED IN] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [GUEST CHECKED IN] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [GUEST CHECKED IN] Sin logo, usando fallback');
    }

    // Generar URL temporal para la foto del visitante si existe
    let GUEST_PHOTO_URL;
    if (data.guestPhoto && data.guestPhoto.startsWith('data:image')) {
      if (data.visitId) {
        GUEST_PHOTO_URL = this.generateVisitorPhotoUrl(data.visitId);
        console.log('📸 [GUEST CHECKED IN] Foto de visitante: URL temporal generada');
      } else {
        GUEST_PHOTO_URL = null;
        console.warn('⚠️ [GUEST CHECKED IN] No visitId para foto temporal');
      }
    } else if (data.guestPhoto) {
      GUEST_PHOTO_URL = data.guestPhoto;
    } else {
      GUEST_PHOTO_URL = null;
    }

    // Generar URL temporal para la imagen del evento si existe
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [GUEST CHECKED IN] Imagen del evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [GUEST CHECKED IN] No accessId para imagen temporal');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
      console.log('🖼️ [GUEST CHECKED IN] Imagen del evento: URL pública');
    } else {
      EVENT_IMAGE_URL = null;
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `Entrada aprobada: ${data.guestName}`,
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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                          <strong>${data.guestName}</strong> ha completado el escaneo de QR y su <strong>entrada fue aprobada</strong>.
                        </p>

                        <!-- Información del Invitado -->
                        <div style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: left;">
                          <p style="color: #1f2937; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong style="color: ${primaryColor};">Información del Invitado</strong><br><br>
                          </p>
                          ${GUEST_PHOTO_URL ? `
                          <div style="text-align: center; margin: 15px 0;">
                            <img src="${GUEST_PHOTO_URL}" alt="Foto del invitado" style="max-width: 120px; max-height: 120px; border-radius: 50%; border: 3px solid ${accentColor}; object-fit: cover;" />
                          </div>
                          ` : ''}
                          <p style="color: #1f2937; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong>Nombre:</strong> ${data.guestName}<br>
                            ${data.guestEmail ? `<strong>Email:</strong> ${data.guestEmail}<br>` : ''}
                            ${data.guestCompany ? `<strong>Empresa:</strong> ${data.guestCompany}` : ''}
                          </p>
                        </div>

                        <!-- Detalles del Evento -->
                        <div style="background-color: #f9fafb; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: left;">
                          <p style="color: #1f2937; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong style="color: ${primaryColor};">Detalles del Evento</strong><br><br>
                          </p>
                          ${EVENT_IMAGE_URL ? `
                          <div style="text-align: center; margin: 15px 0;">
                            <img src="${EVENT_IMAGE_URL}" alt="Imagen del evento" style="max-width: 100%; max-height: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                          </div>
                          ` : ''}
                          <p style="color: #1f2937; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong>Evento/acceso:</strong> ${data.accessTitle}<br>
                            ${data.location ? `<strong>Lugar:</strong> ${data.location}<br>` : ''}
                            ${data.checkInTime ? `<strong>Hora de registro:</strong> ${formatFullDate(new Date(data.checkInTime))}` : ''}
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Guest checked-in email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending guest checked-in email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 6: Modificación de acceso (al creador) - SOLO si endDate fue extendida
   * @param {Object} data - { creatorEmail, creatorName, accessTitle, startDate, endDate, companyName, companyLogo, companyId }
   */
  async sendAccessModifiedToCreatorEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access modified to creator');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [MODIFIED CREATOR] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [MODIFIED CREATOR] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [MODIFIED CREATOR] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [MODIFIED CREATOR] Sin logo, usando fallback');
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `Fecha de fin extendida: ${data.accessTitle}`,
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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.creatorName}
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          La fecha de fin del acceso <strong>${data.accessTitle}</strong> ha sido extendida. Se ha notificado a los invitados.
                        </p>

                        <!-- Detalles -->
                        <div style="background-color: #eff6ff; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h3 style="color: ${primaryColor}; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Nueva fecha de fin</h3>
                          <p style="color: #1f2937; margin: 0; font-size: 15px; line-height: 1.8;">
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))}<br>
                            <strong style="color: ${accentColor};">Nueva fecha y hora de fin:</strong> ${formatFullDate(new Date(data.endDate))}
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [MODIFIED GUEST] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [MODIFIED GUEST] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [MODIFIED GUEST] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [MODIFIED GUEST] Sin logo, usando fallback');
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
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
                            <strong>Fecha y hora de inicio:</strong> ${formatFullDate(new Date(data.startDate))}
                          </p>
                        </div>

                        <!-- QR Code -->
                        ${data.qrData ? `
                        <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrData)}" alt="QR Code" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access modified email sent to guest:', data.invitedEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access modified to guest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email 8: Cancelación de acceso (al creador y a los invitados)
   * @param {Object} data - { recipientEmail, recipientName, accessTitle, startDate, endDate, startTime, endTime, eventImage, additionalInfo, companyName, companyId, companyLogo, isCreator }
   */
  async sendAccessCancelledEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send access cancelled notification');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [CANCELLED] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [CANCELLED] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [CANCELLED] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [CANCELLED] Sin logo, usando fallback');
    }

    // Generar URL temporal para la imagen del evento si existe y es Base64
    let EVENT_IMAGE_URL;
    if (data.eventImage && data.eventImage.startsWith('data:image')) {
      if (data.accessId) {
        EVENT_IMAGE_URL = this.generateEventImageUrl(data.accessId);
        console.log('🖼️ [CANCELLED] Imagen del evento: URL temporal generada');
      } else {
        EVENT_IMAGE_URL = null;
        console.warn('⚠️ [CANCELLED] No accessId para imagen temporal');
      }
    } else if (data.eventImage) {
      EVENT_IMAGE_URL = data.eventImage;
    } else {
      EVENT_IMAGE_URL = null;
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px; text-align: center;">
                        <h1 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                          Hola ${data.recipientName}
                        </h1>
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                          ${message}
                        </p>

                        ${EVENT_IMAGE_URL ? `
                        <!-- Imagen del evento -->
                        <div style="margin-bottom: 25px;">
                          <img src="${EVENT_IMAGE_URL}" alt="${data.accessTitle}" style="width: 100%; max-width: 520px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" />
                        </div>
                        ` : ''}

                        <!-- Detalles -->
                        <div style="background-color: #fef2f2; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: left;">
                          <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.8;">
                            <strong style="color: ${accentColor};">Detalles del acceso cancelado</strong><br><br>
                            <strong>Fecha y hora de inicio:</strong> <span style="color: ${primaryColor};">${formatFullDate(new Date(data.startDate))}</span><br>
                            ${data.endDate ? `<strong>Fecha y hora de fin:</strong> <span style="color: ${primaryColor};">${formatFullDate(new Date(data.endDate))}</span><br>` : ''}
                            ${data.hostName ? `<strong>Host encargado:</strong> <span style="color: ${primaryColor};">${data.hostName}</span>` : ''}
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
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Access cancelled email sent to:', data.recipientEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending access cancelled email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email: Notificación al organizador de que un invitado llegó y se registró
   * @param {Object} data - { visitId, creatorEmail, creatorName, guestName, guestEmail, guestCompany, guestPhoto, accessTitle, companyName, companyId, companyLogo }
   */
  async sendGuestArrivedEmail(data) {
    if (!this.isEnabled()) {
      console.log('Email service disabled - would send guest arrived notification');
      return { success: false, disabled: true };
    }

    // Generar URL temporal para el logo si existe y es Base64
    let COMPANY_LOGO_URL;
    if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
      if (data.companyId) {
        COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
        console.log('🏢 [GUEST ARRIVED] Logo empresa: URL temporal generada');
      } else {
        COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
        console.warn('⚠️ [GUEST ARRIVED] No companyId, usando fallback');
      }
    } else if (data.companyLogo) {
      COMPANY_LOGO_URL = data.companyLogo;
      console.log('🏢 [GUEST ARRIVED] Logo empresa: URL pública');
    } else {
      COMPANY_LOGO_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo_blanco.png`;
      console.log('🏢 [GUEST ARRIVED] Sin logo, usando fallback');
    }

    // Generar URL temporal para la foto del visitante si existe
    let GUEST_PHOTO_URL;
    if (data.guestPhoto && data.guestPhoto.startsWith('data:image')) {
      if (data.visitId) {
        GUEST_PHOTO_URL = this.generateVisitorPhotoUrl(data.visitId);
        console.log('📸 [GUEST ARRIVED] Foto de visitante: URL temporal generada');
      } else {
        GUEST_PHOTO_URL = null;
        console.warn('⚠️ [GUEST ARRIVED] No visitId para foto temporal');
      }
    } else if (data.guestPhoto) {
      GUEST_PHOTO_URL = data.guestPhoto;
    } else {
      GUEST_PHOTO_URL = null;
    }

    try {
      const primaryColor = '#1e3a8a';
      const accentColor = '#f97316';
      
      const logoHtml = COMPANY_LOGO_URL 
        ? `<img src="${COMPANY_LOGO_URL}" alt="${data.companyName}" style="max-width: 50px; height: auto;" />`
        : `<h2 style="color: #ffffff; margin: 0;">${data.companyName}</h2>`;

      const photoHtml = GUEST_PHOTO_URL 
        ? `<div style="margin: 20px 0; text-align: center;">
             <img src="${GUEST_PHOTO_URL}" alt="${data.guestName}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 3px solid #e5e7eb;" />
           </div>`
        : '';

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `🔔 ${data.guestName} ha llegado a tu evento/acceso`,
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
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 12px 12px 0 0;">
                        ${logoHtml}
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px; font-weight: 600; text-align: center;">
                          ¡Hola ${data.creatorName}!
                        </h1>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                          <strong>${data.guestName}</strong> ha llegado y completado su pre-registro para:
                        </p>

                        <!-- Evento Info -->
                        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                          <p style="color: #166534; margin: 0; font-size: 18px; font-weight: 600;">
                            📅 ${data.accessTitle}
                          </p>
                        </div>

                        ${photoHtml}

                        <!-- Detalles del Invitado -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                            Información del Invitado
                          </h3>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                <strong>Nombre:</strong>
                              </td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                ${data.guestName}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                                <strong>Email:</strong>
                              </td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">
                                ${data.guestEmail}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                                <strong>Empresa:</strong>
                              </td>
                              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">
                                ${data.guestCompany}
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Acción Requerida -->
                        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                            <strong>⏳ Acción requerida:</strong><br>
                            El invitado está esperando en la tabla "Respuesta recibida".<br>
                            Por favor, dirígete al panel de visitas y haz clic en <strong>"Registrar entrada"</strong> para darle acceso.
                          </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin: 0;">
                          Si tienes alguna duda, visita nuestro Centro de Ayuda o ponte en contacto con nosotros.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="SecuriTI" style="max-height: 30px; margin-bottom: 10px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          Este es un mensaje automático del Sistema de Gestión de Visitas SecuriTI<br>
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
      console.log('Guest arrived email sent to creator:', data.creatorEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending guest arrived email:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = new EmailService();

