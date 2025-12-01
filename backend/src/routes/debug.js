const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');

// Endpoint temporal de debug para verificar variables de entorno
router.get('/debug-env', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deploymentType: 'local',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    viteEnvironment: process.env.VITE_ENVIRONMENT,
    // NO mostrar los valores reales por seguridad
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    databaseUrlStart: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT_SET'
  };

  res.json(debugInfo);
});

module.exports = router;

// Enviar email de prueba para verificar configuración SMTP
router.post('/debug/send-test-email', async (req, res) => {
  try {
    const to = req.body?.visitorEmail || req.body?.to || 'test@example.com';
    const svc = new EmailService();
    const result = await svc.sendTestEmail(to);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});