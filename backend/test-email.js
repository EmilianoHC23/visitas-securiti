// Script de prueba para envío de correos
const emailService = require('./src/services/emailService');

async function testEmail() {
  console.log('🧪 Probando envío de correos...\n');

  // Datos de prueba para una visita
  const testVisitData = {
    visitorName: 'Juan Pérez',
    visitorEmail: 'juan.perez@example.com',
    hostName: 'María García',
    hostEmail: 'maria.garcia@empresa.com',
    companyName: 'Empresa XYZ',
    scheduledDate: new Date().toLocaleString('es-ES'),
    reason: 'Reunión de proyecto'
  };

  try {
    console.log('📧 Enviando correo de aprobación...');
    await emailService.sendVisitApprovalEmail(testVisitData);
    console.log('✅ Correo de aprobación enviado exitosamente');

    console.log('📧 Enviando correo de rechazo...');
    await emailService.sendVisitRejectionEmail({
      ...testVisitData,
      rejectionReason: 'Conflicto de horario'
    });
    console.log('✅ Correo de rechazo enviado exitosamente');

  } catch (error) {
    console.error('❌ Error al enviar correos:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las credenciales SMTP sean correctas');
    console.log('2. Para Gmail: habilita la autenticación de 2 factores y genera una "contraseña de aplicación"');
    console.log('3. Asegúrate de que el firewall no bloquee el puerto SMTP (587)');
  }
}

// Ejecutar prueba
testEmail();