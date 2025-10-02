const express = require('express');
const emailService = require('../services/emailService');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Test email endpoint - solo para admins
router.post('/test', auth, authorize(['admin']), async (req, res) => {
  try {
    console.log('📧 Test email endpoint called by user:', req.user.email);
    const { email } = req.body;

    if (!email) {
      console.log('❌ No email provided in request');
      return res.status(400).json({ message: 'Email address is required' });
    }

    console.log('🧪 Testing email service for:', email);
    console.log('📊 Email service status:', {
      enabled: emailService.isEnabled(),
      configured: !!process.env.RESEND_API_KEY
    });

    const result = await emailService.sendTestEmail(email, 'Test from Visitas SecuriTI');

    console.log('📧 Email service result:', result);

    if (result.success) {
      res.json({ 
        message: 'Test email sent successfully', 
        messageId: result.messageId,
        emailService: emailService.isEnabled() ? 'enabled' : 'disabled'
      });
    } else {
      console.error('❌ Email service failed:', result.error);
      res.status(500).json({ 
        message: 'Failed to send test email', 
        error: result.error,
        emailService: emailService.isEnabled() ? 'enabled' : 'disabled'
      });
    }
  } catch (error) {
    console.error('❌ Email test endpoint error:', error);
    console.error('❌ Error stack:', error.stack);
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

// Public endpoint to check if email service is working (no auth required)
router.get('/health', async (req, res) => {
  try {
    res.json({
      emailServiceEnabled: emailService.isEnabled(),
      resendConfigured: !!process.env.RESEND_API_KEY,
      status: emailService.isEnabled() ? 'ready' : 'disabled'
    });
  } catch (error) {
    console.error('Email health check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;