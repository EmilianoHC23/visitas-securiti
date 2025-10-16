// Test Email Script - Nodemailer
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing Nodemailer email service...');
  console.log('📊 Environment check:');
  console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
  console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Missing');
  console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');
  console.log('  - EMAIL_FROM:', process.env.EMAIL_FROM || 'Using SMTP_USER');

  try {
    const result = await emailService.sendTestEmail('22202002@utfv.edu.mx');
    console.log('✅ Test result:', result);
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEmail();