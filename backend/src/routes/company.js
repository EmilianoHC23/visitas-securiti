const express = require('express');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get company configuration
router.get('/config', auth, async (req, res) => {
  try {
    console.log('User data:', req.user);
    console.log('Looking for company ID:', req.user.companyId);

    let company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('Company not found, creating default company');
      // Create default company if not exists
      company = new Company({
        companyId: req.user.companyId,
        name: 'Mi Empresa',
        settings: {
          autoApproval: false,
          autoCheckIn: false,
          requirePhoto: true,
          enableSelfRegister: true,
          notificationEmail: null
        }
      });
      await company.save();
      console.log('Default company created:', company);
    }

    res.json(company);
  } catch (error) {
    console.error('Get company config error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Update company configuration (Admin only)
router.put('/config', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, logo, settings } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { companyId: req.user.companyId },
      { 
        name,
        logo,
        settings: {
          autoApproval: settings?.autoApproval || false,
          autoCheckIn: settings?.autoCheckIn || false,
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
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Get company QR code
router.get('/qr-code', auth, async (req, res) => {
  try {
    console.log('Getting QR code for company:', req.user.companyId);
    
    let company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('Company not found for QR, creating default company');
      // Create default company if not exists
      company = new Company({
        companyId: req.user.companyId,
        name: 'Mi Empresa',
        settings: {
          autoApproval: false,
          autoCheckIn: false,
          requirePhoto: true,
          enableSelfRegister: true,
          notificationEmail: null
        }
      });
      await company.save();
    }

    // Generate QR URL for self-registration
    const baseUrl = req.protocol + '://' + req.get('host');
    const qrUrl = `${baseUrl}/register/${company.qrCode}`;
    
    res.json({
      qrCode: company.qrCode,
      qrUrl: qrUrl,
      publicUrl: qrUrl,
      companyName: company.name
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;