const express = require('express');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get company configuration
router.get('/config', auth, async (req, res) => {
  try {
    let company = await Company.findOne({ _id: req.user.companyId });
    
    if (!company) {
      // Create default company if not exists
      company = new Company({
        name: 'Mi Empresa',
        settings: {
          autoApproval: false,
          requirePhoto: true,
          enableSelfRegister: true,
          notificationEmail: null
        }
      });
      await company.save();
    }

    res.json(company);
  } catch (error) {
    console.error('Get company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update company configuration (Admin only)
router.put('/config', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, logo, settings } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { _id: req.user.companyId },
      { 
        name,
        logo,
        settings: {
          autoApproval: settings?.autoApproval || false,
          requirePhoto: settings?.requirePhoto || true,
          enableSelfRegister: settings?.enableSelfRegister || true,
          notificationEmail: settings?.notificationEmail || null
        }
      },
      { new: true, upsert: true }
    );

    res.json(company);
  } catch (error) {
    console.error('Update company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get company QR code
router.get('/qr-code', auth, async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Generate QR URL for self-registration
    const qrUrl = `${req.protocol}://${req.get('host')}/register/${company.qrCode}`;
    
    res.json({
      qrCode: company.qrCode,
      qrUrl: qrUrl,
      publicUrl: qrUrl
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;