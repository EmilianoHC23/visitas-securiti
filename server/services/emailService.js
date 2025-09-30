const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Configuración SMTP para producción
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'notificaciones@securiti.com',
          pass: process.env.SMTP_PASS || 'tu-password-app'
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar conexión
      if (process.env.NODE_ENV === 'production') {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('📧 Email notifications will be disabled');
      this.initialized = false;
    }
  }

  async sendEmail(options) {
    if (!this.initialized) {
      console.log('📧 Email service not initialized, skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_USER || 'notificaciones@securiti.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      return false;
    }
  }

  // Template para nueva visita registrada
  async sendNewVisitNotification(visitData, hostEmail, companySettings) {
    const subject = `Nueva visita registrada - ${visitData.visitorName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nueva Visita - Visitas SecuriTI</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .visit-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
          .status-pending { background-color: #ffc107; }
          .status-approved { background-color: #28a745; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .btn:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Visitas SecuriTI</h1>
            <p>Nueva visita registrada en el sistema</p>
          </div>
          
          <div class="content">
            <h2>Hola ${visitData.hostName},</h2>
            <p>Se ha registrado una nueva visita que requiere tu atención:</p>
            
            <div class="visit-details">
              <h3>Detalles de la Visita</h3>
              
              <div class="detail-row">
                <span class="detail-label">Visitante:</span>
                <span class="detail-value">${visitData.visitorName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Empresa:</span>
                <span class="detail-value">${visitData.visitorCompany}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${visitData.visitorEmail}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${visitData.visitorPhone}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Motivo:</span>
                <span class="detail-value">${visitData.reason}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha programada:</span>
                <span class="detail-value">${new Date(visitData.scheduledDate).toLocaleString('es-ES')}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="detail-value">
                  <span class="status-badge ${visitData.status === 'approved' ? 'status-approved' : 'status-pending'}">
                    ${visitData.status === 'approved' ? 'APROBADA' : 'PENDIENTE'}
                  </span>
                </span>
              </div>
            </div>
            
            ${visitData.status === 'pending' ? `
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Esta visita requiere tu aprobación.</strong></p>
                <a href="${process.env.FRONTEND_URL || 'https://visitas-securiti.vercel.app'}/visits" class="btn">
                  Ver en el Sistema
                </a>
              </div>
            ` : `
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Esta visita ha sido aprobada automáticamente.</strong></p>
                <a href="${process.env.FRONTEND_URL || 'https://visitas-securiti.vercel.app'}/visits" class="btn">
                  Ver en el Sistema
                </a>
              </div>
            `}
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del sistema Visitas SecuriTI</p>
            <p>Si no esperabas este mensaje, por favor contacta al administrador del sistema.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: hostEmail,
      subject: subject,
      html: html
    });
  }

  // Template para visitante - confirmación de registro
  async sendVisitorConfirmation(visitData) {
    const subject = `Confirmación de visita - ${visitData.companyName || 'Visitas SecuriTI'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmación de Visita</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .visit-summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
          .status-pending { background-color: #ffc107; }
          .status-approved { background-color: #28a745; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .important-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Visita Confirmada</h1>
            <p>Tu visita ha sido registrada exitosamente</p>
          </div>
          
          <div class="content">
            <h2>Hola ${visitData.visitorName},</h2>
            <p>Tu visita ha sido registrada en nuestro sistema. A continuación encontrarás los detalles:</p>
            
            <div class="visit-summary">
              <h3>Resumen de tu Visita</h3>
              
              <div class="detail-row">
                <span class="detail-label">Fecha y hora:</span>
                <span class="detail-value">${new Date(visitData.scheduledDate).toLocaleString('es-ES')}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Anfitrión:</span>
                <span class="detail-value">${visitData.hostName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Motivo:</span>
                <span class="detail-value">${visitData.reason}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="detail-value">
                  <span class="status-badge ${visitData.status === 'approved' ? 'status-approved' : 'status-pending'}">
                    ${visitData.status === 'approved' ? 'APROBADA' : 'PENDIENTE DE APROBACIÓN'}
                  </span>
                </span>
              </div>
            </div>
            
            ${visitData.status === 'pending' ? `
              <div class="important-note">
                <h4>⏳ Estado: Pendiente de Aprobación</h4>
                <p>Tu visita está pendiente de aprobación por parte del anfitrión. Recibirás una confirmación por email cuando sea aprobada.</p>
              </div>
            ` : `
              <div class="important-note">
                <h4>✅ Estado: Aprobada</h4>
                <p>Tu visita ha sido aprobada automáticamente. Puedes presentarte en la fecha y hora programada.</p>
              </div>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <h3>Instrucciones para el día de la visita:</h3>
              <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>Llega puntualmente a la hora programada</li>
                <li>Presenta una identificación válida en recepción</li>
                <li>Menciona el nombre de tu anfitrión: ${visitData.hostName}</li>
                <li>El personal de recepción te guiará al lugar correspondiente</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del sistema Visitas SecuriTI</p>
            <p>Si tienes alguna consulta, contacta directamente con tu anfitrión.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: visitData.visitorEmail,
      subject: subject,
      html: html
    });
  }

  // Template para aprobación de visita
  async sendVisitApprovalNotification(visitData) {
    const subject = `✅ Visita Aprobada - ${visitData.companyName || 'Visitas SecuriTI'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Visita Aprobada</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .visit-summary { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #155724; }
          .detail-value { color: #155724; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Visita Aprobada!</h1>
            <p>Tu visita ha sido aprobada y confirmada</p>
          </div>
          
          <div class="content">
            <h2>Hola ${visitData.visitorName},</h2>
            <p>Nos complace informarte que tu visita ha sido <strong>aprobada</strong> por ${visitData.hostName}.</p>
            
            <div class="visit-summary">
              <h3>✅ Detalles Confirmados</h3>
              
              <div class="detail-row">
                <span class="detail-label">Fecha y hora:</span>
                <span class="detail-value">${new Date(visitData.scheduledDate).toLocaleString('es-ES')}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Anfitrión:</span>
                <span class="detail-value">${visitData.hostName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Motivo:</span>
                <span class="detail-value">${visitData.reason}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h3>📋 Recordatorios importantes:</h3>
              <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li><strong>Llega puntualmente</strong> a la hora programada</li>
                <li><strong>Trae identificación válida</strong> para el registro</li>
                <li><strong>Dirigete a recepción</strong> y menciona a ${visitData.hostName}</li>
                <li><strong>Sigue las instrucciones</strong> del personal de seguridad</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <strong>¡Esperamos verte pronto!</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del sistema Visitas SecuriTI</p>
            <p>Si necesitas reprogramar o cancelar, contacta directamente con tu anfitrión.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: visitData.visitorEmail,
      subject: subject,
      html: html
    });
  }

  // Template para código de acceso QR
  async sendAccessCodeNotification(accessData, invitedEmails) {
    const subject = `Código de acceso QR - ${accessData.title}`;
    
    for (const email of invitedEmails) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Código de Acceso QR</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .access-details { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
            .access-code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 2px; margin: 20px 0; }
            .qr-link { display: inline-block; padding: 15px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .schedule-info { background: #e0f2fe; border: 1px solid #81d4fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Código de Acceso QR</h1>
              <p>Has sido invitado a: ${accessData.title}</p>
            </div>
            
            <div class="content">
              <h2>Hola,</h2>
              <p>${accessData.createdBy.firstName} ${accessData.createdBy.lastName} te ha enviado un código de acceso para:</p>
              
              <div class="access-details">
                <h3>${accessData.title}</h3>
                ${accessData.description ? `<p>${accessData.description}</p>` : ''}
                
                <div class="access-code">${accessData.accessCode}</div>
                
                <a href="${process.env.FRONTEND_URL || 'https://visitas-securiti.vercel.app'}/public/access/${accessData.accessCode}" class="qr-link">
                  🔗 Usar Código de Acceso
                </a>
              </div>
              
              <div class="schedule-info">
                <h4>📅 Horario disponible:</h4>
                <p><strong>Fecha:</strong> ${new Date(accessData.schedule.date).toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${accessData.schedule.startTime} - ${accessData.schedule.endTime}</p>
                ${accessData.schedule.recurrence !== 'none' ? `<p><strong>Recurrencia:</strong> ${accessData.schedule.recurrence}</p>` : ''}
              </div>
              
              <div style="margin: 30px 0;">
                <h3>Instrucciones de uso:</h3>
                <ol style="text-align: left;">
                  <li>Haz clic en el enlace de arriba para acceder al formulario</li>
                  <li>Completa tus datos de visitante</li>
                  <li>Envía el formulario y espera la confirmación</li>
                  <li>Presenta tu identificación el día de la visita</li>
                </ol>
              </div>
              
              ${accessData.settings.maxUses > 1 ? `
                <p><strong>Nota:</strong> Este código puede ser usado hasta ${accessData.settings.maxUses} veces.</p>
              ` : ''}
              
              ${accessData.settings.requireApproval ? `
                <p><strong>Importante:</strong> Tu visita requerirá aprobación del anfitrión antes de ser confirmada.</p>
              ` : `
                <p><strong>Aprobación automática:</strong> Tu visita será aprobada automáticamente.</p>
              `}
            </div>
            
            <div class="footer">
              <p>Este código de acceso fue generado por el sistema Visitas SecuriTI</p>
              <p>Si no esperabas este mensaje, puedes ignorarlo con seguridad.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail({
        to: email,
        subject: subject,
        html: html
      });
    }
  }

  // Template para notificación al administrador
  async sendAdminNotification(type, data) {
    const subjects = {
      'new_user': `Nuevo usuario registrado - ${data.userEmail}`,
      'visit_approved': `Visita aprobada - ${data.visitorName}`,
      'blacklist_added': `Nuevo elemento en lista negra - ${data.identifier}`,
      'system_alert': `Alerta del sistema - ${data.message}`
    };

    const subject = subjects[type] || 'Notificación del sistema';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notificación del Sistema</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #721c24; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Notificación del Sistema</h1>
            <p>Sistema de gestión de visitas</p>
          </div>
          
          <div class="content">
            <h2>Hola Administrador,</h2>
            
            <div class="alert-box">
              <h3>${subject}</h3>
              <p>Se ha producido una actividad que requiere tu atención:</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            
            <p>Revisa el sistema para más detalles o tomar las acciones necesarias.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://visitas-securiti.vercel.app'}/dashboard" 
                 style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
                Ir al Dashboard
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del sistema Visitas SecuriTI</p>
            <p>Timestamp: ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar a todos los admins activos
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      ['admin@securiti.com'];

    for (const adminEmail of adminEmails) {
      await this.sendEmail({
        to: adminEmail.trim(),
        subject: subject,
        html: html
      });
    }
  }
}

// Crear instancia singleton
const emailService = new EmailService();

module.exports = emailService;