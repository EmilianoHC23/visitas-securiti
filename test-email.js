// Test del sistema de notificaciones por email
const emailService = require('./server/services/emailService');

const testEmailSystem = async () => {
  console.log('📧 Probando sistema de notificaciones por email...\n');

  try {
    // 1. Test de inicialización del servicio
    console.log('1. ✅ Verificando inicialización del servicio de email');
    console.log(`   Estado: ${emailService.initialized ? 'Inicializado' : 'No configurado'}`);

    if (!emailService.initialized) {
      console.log('   ⚠️  Email service no configurado - funcionará sin enviar emails');
      console.log('   💡 Para configurar emails, ver: EMAIL_SETUP.md');
      return;
    }

    // 2. Test de notificación a visitante
    console.log('\n2. 📨 Probando confirmación a visitante...');
    const visitantNotification = await emailService.sendVisitorConfirmation({
      visitorName: 'Roberto Silva',
      visitorEmail: 'test@example.com', // Cambiar por email real para pruebas
      visitorCompany: 'TechCorp Solutions',
      reason: 'Reunión estratégica de negocios',
      scheduledDate: new Date(),
      hostName: 'Juan Pérez',
      status: 'pending',
      companyName: 'Visitas SecuriTI'
    });
    
    console.log(`   Resultado: ${visitantNotification ? '✅ Enviado' : '❌ Error'}`);

    // 3. Test de notificación a anfitrión
    console.log('\n3. 🔔 Probando notificación a anfitrión...');
    const hostNotification = await emailService.sendNewVisitNotification({
      visitorName: 'Roberto Silva',
      visitorCompany: 'TechCorp Solutions',
      visitorEmail: 'roberto.silva@techcorp.com',
      visitorPhone: '+521234567890',
      reason: 'Reunión estratégica de negocios',
      scheduledDate: new Date(),
      hostName: 'Juan Pérez',
      status: 'pending'
    }, 'juan.perez@securiti.com', {});
    
    console.log(`   Resultado: ${hostNotification ? '✅ Enviado' : '❌ Error'}`);

    // 4. Test de notificación de aprobación
    console.log('\n4. ✅ Probando notificación de aprobación...');
    const approvalNotification = await emailService.sendVisitApprovalNotification({
      visitorName: 'Roberto Silva',
      visitorEmail: 'test@example.com',
      scheduledDate: new Date(),
      hostName: 'Juan Pérez',
      reason: 'Reunión estratégica de negocios',
      companyName: 'Visitas SecuriTI'
    });
    
    console.log(`   Resultado: ${approvalNotification ? '✅ Enviado' : '❌ Error'}`);

    // 5. Test de código de acceso
    console.log('\n5. 🎫 Probando envío de código de acceso...');
    const accessCodeNotification = await emailService.sendAccessCodeNotification({
      title: 'Reunión de Directorio',
      description: 'Acceso especial para la reunión mensual',
      accessCode: 'TEST123',
      createdBy: {
        firstName: 'Admin',
        lastName: 'Sistema'
      },
      schedule: {
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        recurrence: 'none'
      },
      settings: {
        requireApproval: false,
        maxUses: 1
      }
    }, ['test@example.com']);
    
    console.log(`   Resultado: ${accessCodeNotification ? '✅ Enviado' : '❌ Error'}`);

    // 6. Test de alerta administrativa
    console.log('\n6. 🚨 Probando alerta administrativa...');
    const adminAlert = await emailService.sendAdminNotification('system_alert', {
      message: 'Test del sistema de notificaciones',
      timestamp: new Date().toISOString(),
      type: 'test',
      details: 'Verificación automática del sistema de emails'
    });
    
    console.log(`   Resultado: ${adminAlert ? '✅ Enviado' : '❌ Error'}`);

    console.log('\n🎉 ¡Tests del sistema de email completados!');
    console.log('\n📝 Notas importantes:');
    console.log('   - Cambia test@example.com por emails reales para pruebas');
    console.log('   - Verifica la configuración SMTP en las variables de entorno');
    console.log('   - Revisa la carpeta de spam si no recibes los emails');
    console.log('   - El sistema funciona sin emails si no están configurados');

  } catch (error) {
    console.error('\n❌ Error en tests de email:', error.message);
    console.log('\n🔍 Posibles causas:');
    console.log('   - Variables SMTP no configuradas correctamente');
    console.log('   - Credenciales de email incorrectas');
    console.log('   - Problemas de conectividad');
    console.log('   - Revisar EMAIL_SETUP.md para configuración');
  }
};

// Ejecutar test solo si el archivo se ejecuta directamente
if (require.main === module) {
  testEmailSystem()
    .then(() => {
      console.log('\n✅ Tests completados');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en tests:', error);
      process.exit(1);
    });
}

module.exports = testEmailSystem;