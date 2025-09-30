const express = require('express');
const Access = require('../models/Access');
const Visit = require('../models/Visit');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all access codes
router.get('/', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { companyId: req.user.companyId };

    if (status) {
      filter.status = status;
    }

    // If user is host, only show their access codes
    if (req.user.role === 'host') {
      filter.createdBy = req.user._id;
    }

    const accesses = await Access.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(accesses);
  } catch (error) {
    console.error('Get accesses error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Create new access code
router.post('/', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      schedule, 
      maxUses,
      autoApproval,
      allowGuests
    } = req.body;

    if (!title || !schedule?.date) {
      return res.status(400).json({ message: 'Título y fecha son requeridos' });
    }

    // Convert date and time to proper Date objects
    const startDate = new Date(schedule.date);
    if (schedule.startTime) {
      const [hours, minutes] = schedule.startTime.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      startDate.setHours(9, 0, 0, 0); // Default 9:00 AM
    }

    const endDate = new Date(schedule.date);
    if (schedule.endTime) {
      const [hours, minutes] = schedule.endTime.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      endDate.setHours(17, 0, 0, 0); // Default 5:00 PM
    }

    // If end time is before start time, assume it's next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const access = new Access({
      title,
      description,
      createdBy: req.user._id,
      companyId: req.user.companyId,
      settings: {
        autoApproval: autoApproval || true,
        maxUses: maxUses || 1,
        allowGuests: allowGuests || false,
        requireApproval: !autoApproval || false
      },
      schedule: {
        startDate,
        endDate,
        startTime: schedule.startTime || '09:00',
        endTime: schedule.endTime || '17:00',
        recurrence: 'none'
      }
    });

    await access.save();
    await access.populate('createdBy', 'firstName lastName email');

    res.status(201).json(access);
  } catch (error) {
    console.error('Create access error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Redeem access code (public endpoint)
router.post('/redeem', async (req, res) => {
  try {
    const { accessCode, visitorData } = req.body;

    if (!accessCode || !visitorData) {
      return res.status(400).json({ message: 'Código de acceso y datos del visitante son requeridos' });
    }

    const access = await Access.findOne({ 
      accessCode, 
      status: 'active' 
    }).populate('createdBy', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no válido o expirado' });
    }

    // Check if access is within valid date range
    const now = new Date();
    if (now < access.schedule.startDate || now > access.schedule.endDate) {
      return res.status(400).json({ message: 'Código de acceso fuera del período válido' });
    }

    // Check usage limits
    if (access.usageCount >= access.settings.maxUses) {
      return res.status(400).json({ message: 'Código de acceso ha alcanzado el límite de usos' });
    }

    // Create visit from access code
    const visit = new Visit({
      visitorName: visitorData.name,
      visitorCompany: visitorData.company,
      visitorEmail: visitorData.email,
      visitorPhone: visitorData.phone,
      host: access.createdBy._id,
      reason: access.title,
      status: access.settings.autoApproval ? 'approved' : 'pending',
      visitType: 'access-code',
      accessCode: accessCode,
      accessId: access._id,
      scheduledDate: new Date(),
      companyId: access.companyId
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email');

    // Update access usage count
    access.usageCount += 1;
    await access.save();

    res.json({
      message: 'Código canjeado exitosamente',
      visit,
      autoApproved: access.settings.autoApproval
    });
  } catch (error) {
    console.error('Redeem access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get access details by code (public)
router.get('/public/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;

    const access = await Access.findOne({ 
      accessCode, 
      status: 'active' 
    }).populate('createdBy', 'firstName lastName');

    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no encontrado' });
    }

    // Return only necessary public information
    res.json({
      title: access.title,
      description: access.description,
      host: access.createdBy,
      schedule: access.schedule,
      settings: {
        requireApproval: access.settings.requireApproval,
        allowGuests: access.settings.allowGuests
      },
      usageCount: access.usageCount,
      maxUses: access.settings.maxUses
    });
  } catch (error) {
    console.error('Get public access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update access status
router.put('/:id/status', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const access = await Access.findOneAndUpdate(
      { 
        _id: id, 
        companyId: req.user.companyId,
        ...(req.user.role === 'host' ? { createdBy: req.user._id } : {})
      },
      { status },
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    res.json(access);
  } catch (error) {
    console.error('Update access status error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;