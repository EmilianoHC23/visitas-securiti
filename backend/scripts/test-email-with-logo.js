/**
 * Script de prueba para verificar que los emails con logos funcionan correctamente
 * usando el nuevo sistema de imágenes incrustadas (CID)
 * 
 * Uso:
 *   node scripts/test-email-with-logo.js tu-email@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('../src/services/emailService');
const Company = require('../src/models/Company');

async function testEmailWithLogo() {
  try {
    // Obtener email del argumento o usar uno por defecto
    const testEmail = process.argv[2] || 'test@example.com';
    
    console.log('🧪 Iniciando prueba de email con logo...');
    console.log(`📧 Email de destino: ${testEmail}`);
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visitas-securiti');
    console.log('✅ Conectado a la base de datos');
    
    // Obtener la empresa (asumiendo que existe una)
    const company = await Company.findOne();
    
    if (!company) {
      console.error('❌ No se encontró ninguna empresa en la base de datos');
      console.log('💡 Primero debes crear una empresa y configurar su logo desde el panel de administración');
      process.exit(1);
    }
    
    console.log(`🏢 Empresa encontrada: ${company.name}`);
    console.log(`📷 Logo configurado: ${company.logo ? 'Sí' : 'No'}`);
    
    if (company.logo) {
      const isBase64 = company.logo.startsWith('data:image');
      const isUrl = company.logo.startsWith('http');
      console.log(`   Tipo de logo: ${isBase64 ? 'Base64 (se incrustará)' : isUrl ? 'URL pública' : 'Desconocido'}`);
    }
    
    // Enviar email de prueba de invitación
    console.log('\n📤 Enviando email de prueba...');
    
    const result = await emailService.sendInvitationEmail({
      firstName: 'Usuario',
      lastName: 'de Prueba',
      email: testEmail,
      role: 'admin',
      token: 'TEST-TOKEN-123',
      companyName: company.name,
      invitedBy: 'Sistema de Pruebas',
      companyId: company.companyId,
      companyLogo: company.logo
    });
    
    if (result.success) {
      console.log('✅ Email enviado exitosamente!');
      console.log(`📬 Message ID: ${result.messageId}`);
      console.log('\n🎉 Prueba completada con éxito!');
      console.log('\n📋 Revisa tu bandeja de entrada:');
      console.log(`   - Email: ${testEmail}`);
      console.log('   - Asunto: Invitación para unirte a [empresa] - Visitas SecuriTI');
      console.log('   - El logo debe aparecer en el header del email');
      console.log('\n💡 Verifica también la carpeta de spam/correo no deseado');
    } else {
      console.error('❌ Error al enviar el email:', result.error);
      console.log('\n🔍 Posibles causas:');
      console.log('   1. Variables SMTP no configuradas en .env');
      console.log('   2. Credenciales SMTP incorrectas');
      console.log('   3. Firewall bloqueando conexiones SMTP');
      console.log('\n📝 Verifica tu archivo .env:');
      console.log('   SMTP_HOST=smtp.gmail.com');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_USER=tu-email@gmail.com');
      console.log('   SMTP_PASS=tu-contraseña-de-aplicación');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de la base de datos');
    process.exit(0);
  }
}

// Ejecutar la prueba
testEmailWithLogo();
