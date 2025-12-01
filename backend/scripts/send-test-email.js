const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const EmailService = require('../src/services/emailService');

(async () => {
  try {
    const to = process.argv[2] || 'marcostorres01502@gmail.com';
    const svc = new EmailService();
    const res = await svc.sendTestEmail(to);
    console.log('Result:', res);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
