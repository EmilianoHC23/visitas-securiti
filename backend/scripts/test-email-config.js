// Script para probar la configuración de email
require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testEmailConfiguration() {
  console.log('\n🧪 Probando configuración de email...\n');
  
  console.log('📊 Variables de entorno:');
  console.log('  - SMTP_HOST:', process.env.SMTP_HOST);
  console.log('  - SMTP_PORT:', process.env.SMTP_PORT);
  console.log('  - SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('  - SMTP_USER:', process.env.SMTP_USER);
  console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configurada' : '❌ No configurada');
  console.log('  - EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('');

  try {
    console.log('📧 Enviando email de prueba...');
    
    // Cambiar este email por el tuyo para recibir la prueba
    const testEmail = 'visitantes@securiti.info';
    
    const result = await emailService.sendTestEmail(testEmail);
    
    console.log('✅ Email enviado exitosamente!');
    console.log('📬 Revisa la bandeja de entrada de:', testEmail);
    console.log('');
    console.log('Resultado:', result);
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    console.error('');
    console.error('Detalles completos:', error);
  }
}

testEmailConfiguration();
