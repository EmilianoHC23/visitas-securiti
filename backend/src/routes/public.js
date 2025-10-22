const express = require('express');
const Company = require('../models/Company');
const Blacklist = require('../models/Blacklist');
const User = require('../models/User');
const Visit = require('../models/Visit');

const router = express.Router();

// Get company info for public registration
router.get('/company/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const company = await Company.findOne({ qrCode, isActive: true });

    if (!company) {
      return res.status(404).json({ message: 'Código QR no válido' });
    }

    if (!company.settings.enableSelfRegister) {
      return res.status(403).json({ message: 'Auto-registro no habilitado para esta empresa' });
    }

    res.json({
      companyId: company._id,
      name: company.name,
      logo: company.logo,
      settings: {
        requirePhoto: company.settings.requirePhoto,
        autoApproval: company.settings.autoApproval
      }
    });
  } catch (error) {
    console.error('Get company for registration error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get available hosts for a company
router.get('/hosts/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    const hosts = await User.find({ 
      companyId,
      role: 'host',
      isActive: true 
    }).select('firstName lastName email profileImage');

    res.json(hosts);
  } catch (error) {
    console.error('Get hosts for registration error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Public visit registration
router.post('/visit', async (req, res) => {
  try {
    const { 
      companyId,
      visitorName,
      visitorCompany,
      visitorEmail,
      visitorPhone,
      hostId,
      reason,
      visitorPhoto
    } = req.body;

    // Validate required fields
    if (!companyId || !visitorName || !visitorCompany || !visitorEmail || !hostId || !reason) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser completados' });
    }

    // Get company settings
    const company = await Company.findById(companyId);
    if (!company || !company.settings.enableSelfRegister) {
      return res.status(403).json({ message: 'Auto-registro no habilitado' });
    }

    // Check blacklist
    const blacklisted = await Blacklist.findOne({ 
      email: visitorEmail.toLowerCase(),
      companyId,
      isActive: true 
    });

    if (blacklisted) {
      return res.status(403).json({ 
        message: 'No se puede registrar esta visita',
        reason: 'Usuario en lista negra'
      });
    }

    // Verify host exists
    const host = await User.findOne({ 
      _id: hostId, 
      companyId, 
      role: 'host', 
      isActive: true 
    });

    if (!host) {
      return res.status(400).json({ message: 'Anfitrión no válido' });
    }

    // Determinar estado inicial según configuración
    let initialStatus = 'pending';
    let checkInTime = null;
    let qrToken = null;
    let approvedAt = null;
    
    if (company.settings.autoApproval) {
      initialStatus = 'approved';
      qrToken = require('crypto').randomBytes(16).toString('hex');
      approvedAt = new Date();
      
      // Si auto check-in también está habilitado
      if (company.settings.autoCheckIn) {
        initialStatus = 'checked-in';
        checkInTime = new Date();
        console.log('🔄 [PUBLIC-REGISTER] Auto check-in enabled, visit created as checked-in');
      }
    }

    // Create visit
    const visit = new Visit({
      visitorName,
      visitorCompany,
      visitorEmail,
      visitorPhone,
      visitorPhoto,
      host: hostId,
      reason,
      status: initialStatus,
      visitType: 'spontaneous',
      scheduledDate: new Date(),
      companyId,
      checkInTime,
      qrToken,
      approvedAt
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email');

    // Si se hizo auto check-in, crear evento
    if (initialStatus === 'checked-in') {
      const VisitEvent = require('../models/VisitEvent');
      await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
      console.log('✅ [PUBLIC-REGISTER] Auto check-in event created');
    }

    res.status(201).json({
      message: 'Visita registrada exitosamente',
      visit,
      autoApproved: company.settings.autoApproval,
      autoCheckedIn: initialStatus === 'checked-in',
      requiresApproval: !company.settings.autoApproval
    });
  } catch (error) {
    console.error('Public visit registration error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;