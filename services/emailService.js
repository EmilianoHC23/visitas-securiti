import emailjs from '@emailjs/browser';

// Configuración de EmailJS
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_xxxxxxx',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_xxxxxxx',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key'
};

class EmailService {
  constructor() {
    this.initializeEmailJS();
  }

  initializeEmailJS() {
    try {
      // Inicializar EmailJS con la clave pública
      emailjs.init(EMAILJS_CONFIG.publicKey);
      this.enabled = true;
      console.log('✅ EmailJS initialized successfully');
      console.log('📧 EmailJS Config:', {
        serviceId: EMAILJS_CONFIG.serviceId,
        templateId: EMAILJS_CONFIG.templateId,
        publicKey: EMAILJS_CONFIG.publicKey?.substring(0, 8) + '...'
      });
    } catch (error) {
      console.error('❌ Error initializing EmailJS:', error);
      this.enabled = false;
    }
  }

  isEnabled() {
    return this.enabled && 
           EMAILJS_CONFIG.serviceId !== 'service_xxxxxxx' &&
           EMAILJS_CONFIG.templateId !== 'template_xxxxxxx' &&
           EMAILJS_CONFIG.publicKey !== 'your_public_key';
  }

  async sendVisitConfirmation(visitData) {
    if (!this.isEnabled()) {
      console.log('📧 EmailJS not configured - would send email to:', visitData.visitorEmail);
      return { success: false, error: 'EmailJS not configured' };
    }

    console.log('📧 Sending visit confirmation email via EmailJS to:', visitData.visitorEmail);

    try {
      // Formatear fecha
      const formatDate = (date) => {
        return new Date(date).toLocaleString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Parámetros para el template de EmailJS
      const templateParams = {
        to_email: visitData.visitorEmail,
        to_name: visitData.visitorName,
        visitor_name: visitData.visitorName,
        host_name: visitData.hostName,
        company_name: visitData.companyName || 'SecuriTI',
        scheduled_date: formatDate(visitData.scheduledDate),
        reason: visitData.reason,
        status: visitData.status === 'pending' ? 'Pendiente' : visitData.status,
        current_year: new Date().getFullYear()
      };

      console.log('📤 Sending email with EmailJS...');
      console.log('📋 Template params:', {
        to_email: templateParams.to_email,
        visitor_name: templateParams.visitor_name,
        host_name: templateParams.host_name
      });

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('✅ Visit confirmation email sent successfully via EmailJS');
      console.log('📧 Email Log:', {
        to: visitData.visitorEmail,
        status: 'sent',
        provider: 'emailjs',
        messageId: response.text,
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        messageId: response.text,
        provider: 'emailjs'
      };

    } catch (error) {
      console.error('❌ EmailJS error:', error);
      console.log('📧 Email Log:', {
        to: visitData.visitorEmail,
        status: 'failed',
        error: error.message || error.text,
        provider: 'emailjs',
        timestamp: new Date().toISOString()
      });

      return { 
        success: false, 
        error: error.message || error.text || 'Error sending email'
      };
    }
  }

  async sendTestEmail(toEmail, message = 'Test email from Visitas SecuriTI') {
    if (!this.isEnabled()) {
      console.log('📧 EmailJS not configured - would send test email to:', toEmail);
      return { success: false, error: 'EmailJS not configured' };
    }

    console.log('🧪 Sending test email via EmailJS to:', toEmail);

    try {
      const templateParams = {
        to_email: toEmail,
        to_name: 'Usuario',
        visitor_name: 'Usuario de Prueba',
        host_name: 'Sistema',
        company_name: 'SecuriTI',
        scheduled_date: new Date().toLocaleString('es-ES'),
        reason: 'Email de prueba del sistema',
        status: 'Prueba',
        current_year: new Date().getFullYear()
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('✅ Test email sent successfully via EmailJS');
      return { 
        success: true, 
        messageId: response.text,
        provider: 'emailjs'
      };

    } catch (error) {
      console.error('❌ EmailJS test error:', error);
      return { 
        success: false, 
        error: error.message || error.text || 'Error sending test email'
      };
    }
  }
}

export default new EmailService();