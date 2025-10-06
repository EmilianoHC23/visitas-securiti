// EmailService simplificado - Solo para logs y compatibilidad
// El email real se maneja en el frontend con EmailJS

class EmailService {
  constructor() {
    console.log('📧 EmailService initialized (Frontend EmailJS mode)');
    this.enabled = false; // Deshabilitado en backend
  }

  isEnabled() {
    return false; // Siempre false, el email se maneja en frontend
  }

  async sendTestEmail(to) {
    console.log('📧 Email service disabled in backend - emails handled by frontend EmailJS');
    return { success: false, error: 'Email handled by frontend EmailJS' };
  }

  async sendVisitConfirmation(visitData) {
    console.log('📧 Email service disabled in backend - emails handled by frontend EmailJS');
    return { success: false, error: 'Email handled by frontend EmailJS' };
  }
}

module.exports = new EmailService();