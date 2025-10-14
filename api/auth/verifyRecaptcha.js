// verifyRecaptcha.js
// Verifica el token de Google reCAPTCHA v2 en el backend
const fetch = require('node-fetch');

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY not set');
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`
  });
  const data = await response.json();
  return data.success;
}

module.exports = verifyRecaptcha;
