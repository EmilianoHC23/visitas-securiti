// Test EmailJS Frontend
import emailService from './services/emailService.js';

// Función para probar EmailJS
window.testEmailJS = async function(email = 'test@example.com') {
  console.log('🧪 Testing EmailJS...');
  
  const testData = {
    visitorName: 'Usuario de Prueba',
    visitorEmail: email,
    companyName: 'SecuriTI',
    hostName: 'Anfitrión de Prueba',
    scheduledDate: new Date(),
    reason: 'Prueba del sistema de emails',
    status: 'pending'
  };

  try {
    const result = await emailService.sendVisitConfirmation(testData);
    console.log('✅ Resultado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
};

console.log('📧 EmailJS Test Ready! Usa: testEmailJS("tu-email@ejemplo.com")');