// Test Email Script
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing email service...');
  console.log('📊 Environment check:');
  console.log('  - RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS || '❌ Missing');
  
  try {
    const result = await emailService.sendTestEmail('22202002@utfv.edu.mx');
    console.log('✅ Test result:', result);
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEmail();