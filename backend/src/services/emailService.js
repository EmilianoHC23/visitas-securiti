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
      console.log('📧 Email service disabled - would send visitor notification to:', data.visitorEmail);
      return { success: false, error: 'Email service not configured' };
    }

    if (!data.visitorEmail) {
      console.log('📧 No visitor email provided, skipping notification');
      return { success: false, error: 'No visitor email' };
    }

    // Logo de la empresa (puedes usar una variable o URL fija)
    const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://securiti.mx/logo.png';

    try {
      const isApproved = data.status === 'approved';
      const statusText = isApproved ? 'APROBADA' : 'RECHAZADA';
      const statusColor = isApproved ? '#10b981' : '#ef4444';
      const statusIcon = isApproved ? '✅' : '❌';

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.visitorEmail,
        subject: `${statusIcon} Tu visita ha sido ${statusText.toLowerCase()} - ${data.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">${statusIcon} Visita ${statusText}</h1>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <div style="text-align:center; padding: 16px 0;">
                <img src="${COMPANY_LOGO_URL}" alt="Logo ${data.companyName}" style="height: 48px;" />
              </div>
              <p style="font-size: 18px; color: #1f2937;">Hola, ${data.visitorName}</p>
              
              ${isApproved ? `
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                  ¡Excelentes noticias! Tu visita a <strong>${data.companyName}</strong> ha sido <span style="color: ${statusColor}; font-weight: bold;">aprobada</span>.
                </p>
                <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #065f46;">Detalles de tu visita:</h3>
                  <p><strong>Anfitrión:</strong> ${data.hostName}</p>
                  <p><strong>Fecha:</strong> ${new Date(data.scheduledDate).toLocaleString('es-ES')}</p>
                  <p><strong>Motivo:</strong> ${data.reason}</p>
                  <p><strong>Destino:</strong> ${data.destination || 'SecurITI'}</p>
                </div>
                
                <!-- Código QR para check-in rápido -->
                <div style="background: #f9fafb; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <h3 style="margin-top: 0; color: #065f46;">Tu Pase de Visita</h3>
                  <p style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">Presenta este código QR en recepción para un check-in rápido</p>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ visitId: data.visitId, type: 'visit-checkin' }))}" 
                       alt="Código QR de visita" 
                       style="width: 200px; height: 200px; margin: 0 auto; display: block; border: 1px solid #e5e7eb; border-radius: 8px;" />
                  <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">ID de Visita: ${data.visitId}</p>
                </div>
                
                <p><strong>Próximos pasos:</strong></p>
                <ul>
                  <li>Llega 10 minutos antes de tu hora programada</li>
                  <li>Trae una identificación válida</li>
                  <li>Presenta tu código QR en recepción para el check-in</li>
                </ul>
              ` : `
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                  Lamentamos informarte que tu visita a <strong>${data.companyName}</strong> ha sido <span style="color: ${statusColor}; font-weight: bold;">rechazada</span>.
                </p>
                <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p><strong>Motivo de la visita:</strong> ${data.reason}</p>
                  <p><strong>Fecha solicitada:</strong> ${new Date(data.scheduledDate).toLocaleString('es-ES')}</p>
                </div>
                <p>Si tienes preguntas, puedes contactar directamente con ${data.hostName} o intentar programar una nueva visita.</p>
              `}
              
              <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                Sistema de Gestión de Visitas - ${data.companyName}
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Visitor notification email sent to: ${data.visitorEmail} (${statusText})`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending visitor notification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendApprovalRequestEmail(data) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send approval request to host:', data.hostEmail);
      console.log('🔗 Approve URL:', data.approveUrl);
      console.log('🔗 Reject URL:', data.rejectUrl);
      return { success: false, error: 'Email service not configured' };
    }

    // Logo de la empresa (puedes usar una variable o URL fija)
    const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://securiti.mx/logo.png';

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.hostEmail,
        subject: `Solicitud de visita - ${data.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="text-align:center; padding: 24px 0;">
              <img src="${COMPANY_LOGO_URL}" alt="Logo ${data.companyName}" style="height: 48px; margin-bottom: 8px;" />
            </div>
            <h2 style="color:#111827; text-align: center;">Solicitud de aprobación de visita</h2>
            <p style="text-align: center;">Tienes una solicitud de visita:</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 8px;"><strong>Nombre:</strong> ${data.visitorName}</li>
              <li style="margin-bottom: 8px;"><strong>Empresa:</strong> ${data.visitorCompany || 'No especificada'}</li>
              <li style="margin-bottom: 8px;"><strong>Razón:</strong> ${data.reason}</li>
              <li style="margin-bottom: 8px;"><strong>Fecha:</strong> ${new Date(data.scheduledDate).toLocaleString('es-ES')}</li>
            </ul>
            ${data.visitorPhoto ? `<div style="text-align: center; margin: 16px 0;"><img src="${data.visitorPhoto}" alt="Foto del visitante" style="max-width: 240px; border-radius: 8px;"/></div>` : ''}
            <div style="display: flex; justify-content: center; gap: 8px; margin: 24px 0;">
              <a href="${data.approveUrl}" style="background:#10b981;color:white;padding:12px 16px;border-radius:8px;text-decoration:none;">Aprobar</a>
              <a href="${data.rejectUrl}" style="background:#ef4444;color:white;padding:12px 16px;border-radius:8px;text-decoration:none;">Rechazar</a>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Approval request email sent to host:', data.hostEmail);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending approval email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvitationEmail(invitationData) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send invitation to:', invitationData.email);
      return { success: false, error: 'Email service not configured' };
    }

    // Logo de la empresa (puedes usar una variable o URL fija)
    const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://securiti.mx/logo.png';

    try {
      const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register/user?token=${invitationData.token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: invitationData.email,
        subject: `Invitación para unirte a ${invitationData.companyName} - Visitas SecuriTI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">¡Has sido invitado!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Únete al sistema de gestión de visitas</p>
            </div>

            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <div style="text-align:center; padding: 16px 0;">
                <img src="${COMPANY_LOGO_URL}" alt="Logo ${invitationData.companyName}" style="height: 48px;" />
              </div>
              <p style="font-size: 18px; color: #1f2937;">Hola,</p>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                Has sido invitado a unirte al sistema de gestión de visitas de <strong>${invitationData.companyName}</strong>.
                Tu rol asignado será: <strong>${invitationData.role}</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}"
                   style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                  Completar Registro
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

  async sendAccessCancellationEmail(data) {
    if (!this.isEnabled()) {
      console.log('📧 Email service disabled - would send cancellation emails');
      return { success: false, error: 'Email service not configured' };
    }

    const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://securiti.mx/logo.png';

    try {
      // Email para los invitados
      if (data.invitedEmails && data.invitedEmails.length > 0) {
        const inviteeMailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          bcc: data.invitedEmails, // Enviar a todos los invitados en BCC
          subject: `Acceso cancelado - ${data.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Acceso Cancelado</h1>
              </div>
              
              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                <div style="text-align:center; padding: 16px 0;">
                  <img src="${COMPANY_LOGO_URL}" alt="Logo ${data.companyName}" style="height: 48px;" />
                </div>
                
                <p style="font-size: 16px; color: #4b5563;">
                  Lamentamos informarte que el siguiente acceso/evento ha sido <strong>cancelado</strong>:
                </p>
                
                <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #991b1b;">Detalles del acceso cancelado:</h3>
                  <p><strong>Título:</strong> ${data.title}</p>
                  <p><strong>Razón:</strong> ${data.reason || 'No especificada'}</p>
                  <p><strong>Fecha programada:</strong> ${new Date(data.startDate).toLocaleDateString('es-ES')} a las ${data.startTime}</p>
                  ${data.location ? `<p><strong>Lugar:</strong> ${data.location}</p>` : ''}
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  Si tienes preguntas sobre esta cancelación, por favor contacta a la organización.
                </p>
                
                <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                  Sistema de Gestión de Visitas - ${data.companyName}
                </div>
              </div>
            </div>
          `
        };

        await this.transporter.sendMail(inviteeMailOptions);
        console.log(`✅ Cancellation email sent to ${data.invitedEmails.length} invitee(s)`);
      }

      // Email de confirmación para el creador
      if (data.creatorEmail) {
        const creatorMailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: data.creatorEmail,
          subject: `Confirmación: Acceso cancelado - ${data.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Acceso Cancelado Exitosamente</h1>
              </div>
              
              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                <div style="text-align:center; padding: 16px 0;">
                  <img src="${COMPANY_LOGO_URL}" alt="Logo ${data.companyName}" style="height: 48px;" />
                </div>
                
                <p style="font-size: 16px; color: #4b5563;">
                  El acceso <strong>${data.title}</strong> ha sido cancelado correctamente.
                </p>
                
                <div style="background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p><strong>Acciones realizadas:</strong></p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>El acceso ya no está disponible para nuevos registros</li>
                    ${data.invitedEmails && data.invitedEmails.length > 0 ? 
                      `<li>Se notificó a ${data.invitedEmails.length} invitado(s) sobre la cancelación</li>` : 
                      '<li>No había invitados para notificar</li>'
                    }
                  </ul>
                </div>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #374151;">Detalles del acceso:</h4>
                  <p><strong>Título:</strong> ${data.title}</p>
                  <p><strong>Fecha:</strong> ${new Date(data.startDate).toLocaleDateString('es-ES')} - ${data.startTime}</p>
                  ${data.location ? `<p><strong>Lugar:</strong> ${data.location}</p>` : ''}
                </div>
                
                <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                  Sistema de Gestión de Visitas - ${data.companyName}
                </div>
              </div>
            </div>
          `
        };

        await this.transporter.sendMail(creatorMailOptions);
        console.log(`✅ Cancellation confirmation email sent to creator: ${data.creatorEmail}`);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending cancellation emails:', error);
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
      console.log('📧 Email service disabled - Would have sent registration notification to creator');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const COMPANY_LOGO_URL = process.env.COMPANY_LOGO_URL || 'https://via.placeholder.com/150x50?text=Logo';

      const photoSection = data.visitorPhoto 
        ? `<div style="text-align: center; margin: 20px 0;">
             <img src="${data.visitorPhoto}" alt="Foto del visitante" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #3b82f6;">
           </div>`
        : '';

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.creatorEmail,
        subject: `🎉 Nuevo registro para tu evento: ${data.eventTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
            <!-- Header con gradiente -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <img src="${COMPANY_LOGO_URL}" alt="Logo" style="max-width: 150px; margin-bottom: 15px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Nuevo Registro!</h1>
            </div>

            <!-- Contenido -->
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Hola <strong>${data.creatorName}</strong>,
              </p>

              <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                Te informamos que una persona se ha registrado exitosamente para tu evento programado:
              </p>

              <!-- Tarjeta del evento -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px; border-radius: 6px;">
                <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">📅 ${data.eventTitle}</h2>
                <p style="color: #1e3a8a; margin: 5px 0; font-size: 14px;">
                  <strong>Fecha:</strong> ${new Date(data.eventDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              ${photoSection}

              <!-- Información del visitante -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Datos del Visitante</h3>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Nombre:</span><br>
                  <span style="color: #111827; font-weight: bold; font-size: 16px;">${data.visitorName}</span>
                </div>

                <div style="margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Email:</span><br>
                  <span style="color: #111827; font-size: 15px;">${data.visitorEmail}</span>
                </div>

                ${data.visitorCompany ? `
                <div style="margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Empresa:</span><br>
                  <span style="color: #111827; font-size: 15px;">${data.visitorCompany}</span>
                </div>
                ` : ''}

                ${data.visitorPhone ? `
                <div style="margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Teléfono:</span><br>
                  <span style="color: #111827; font-size: 15px;">${data.visitorPhone}</span>
                </div>
                ` : ''}
              </div>

              <!-- Estado de pre-aprobación -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ℹ️ <strong>Estado:</strong> Este visitante fue pre-aprobado automáticamente mediante tu código de acceso público.
                </p>
              </div>

              <!-- Mensaje de acción -->
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                Puedes ver y gestionar todos los registros para tu evento desde el panel de administración.
              </p>

              <!-- Divider -->
              <div style="border-top: 1px solid #e5e7eb; margin: 25px 0;"></div>

              <!-- Footer -->
              <div style="text-align: center; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">Este es un correo automático, por favor no responder.</p>
                <p style="margin: 5px 0;">Sistema de Gestión de Visitas - ${data.companyName}</p>
              </div>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Registration notification email sent to creator: ${data.creatorEmail}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending registration notification email:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = new EmailService();
