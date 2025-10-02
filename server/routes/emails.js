const express = require('express');
const emailService = require('../services/emailService');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Test email endpoint - solo para admins
router.post('/test', auth, authorize(['admin']), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    console.log('🧪 Testing email service...');
    const result = await emailService.sendTestEmail(email, 'Test from Visitas SecuriTI');

    if (result.success) {
      res.json({ 
        message: 'Test email sent successfully', 
        messageId: result.messageId,
        emailService: emailService.isEnabled() ? 'enabled' : 'disabled'
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send test email', 
        error: result.error,
        emailService: emailService.isEnabled() ? 'enabled' : 'disabled'
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get email service status
router.get('/status', auth, authorize(['admin']), async (req, res) => {
  try {
    res.json({
      enabled: emailService.isEnabled(),
      configured: !!process.env.RESEND_API_KEY,
      fromDomain: process.env.EMAIL_FROM_DOMAIN || 'not configured',
      fromName: process.env.EMAIL_FROM_NAME || 'not configured'
    });
  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;