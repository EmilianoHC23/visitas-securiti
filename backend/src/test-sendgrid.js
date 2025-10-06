// Test SendGrid Email Script
require('dotenv').config();
const emailService = require('./services/emailService');

async function testSendGrid() {
  console.log('🧪 Testing SendGrid email service...');
  console.log('📊 Environment check:');
  console.log('  - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS || '❌ Missing');
  
  try {
    // Puedes cambiar este email por cualquiera
    const result = await emailService.sendTestEmail('emilianohercha23@gmail.com');
    console.log('✅ Test result:', result);
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSendGrid();