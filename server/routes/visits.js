const express = require('express');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all visits
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, hostId } = req.query;
    const filter = { companyId: req.user.companyId };

    // Apply filters
    if (status) filter.status = status;
    if (hostId) filter.host = hostId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    // If user is a host, only show their visits
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    const visits = await Visit.find(filter)
      .populate('host', 'firstName lastName email profileImage')
      .sort({ scheduledDate: -1 });

    res.json(visits);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get single visit
router.get('/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('host', 'firstName lastName email profileImage');

    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Check if user has permission to view this visit
    if (req.user.role === 'host' && visit.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta visita' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Create new visit
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating visit - User:', req.user?.email, 'Company:', req.user?.companyId);
    const { visitorName, visitorCompany, reason, hostId, scheduledDate, visitorEmail, visitorPhone } = req.body;
    console.log('📝 Visit data:', { visitorName, visitorCompany, reason, hostId, scheduledDate });

    // Validate required fields
    if (!visitorName || !visitorCompany || !reason || !hostId || !scheduledDate) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verify host exists and is active
    const host = await User.findById(hostId);
    if (!host || !host.isActive || host.role !== 'host') {
      console.log('❌ Invalid host:', { hostId, found: !!host, active: host?.isActive, role: host?.role });
      return res.status(400).json({ message: 'Host no válido' });
    }

    // Get company settings for auto-approval
    const company = await Company.findOne({ _id: host.companyId });
    const autoApproval = company?.settings?.autoApproval || false;
    console.log('🏢 Company settings:', { autoApproval, companyId: host.companyId });

    const visit = new Visit({
      visitorName,
      visitorCompany,
      reason,
      host: hostId,
      scheduledDate: new Date(scheduledDate),
      companyId: req.user.companyId,
      visitorEmail,
      visitorPhone,
      status: autoApproval ? 'approved' : 'pending'
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    res.status(201).json(visit);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Self-register visit (public endpoint)
router.post('/register', async (req, res) => {
  try {
    const { visitorName, visitorCompany, reason, hostId, visitorPhoto, visitorEmail, visitorPhone } = req.body;

    // Validate required fields
    if (!visitorName || !visitorCompany || !reason || !hostId) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verify host exists and is active
    const host = await User.findById(hostId);
    if (!host || !host.isActive || host.role !== 'host') {
      return res.status(400).json({ message: 'Host no válido' });
    }

    const visit = new Visit({
      visitorName,
      visitorCompany,
      reason,
      host: hostId,
      scheduledDate: new Date(), // Current date for self-registration
      companyId: host.companyId,
      visitorPhoto,
      visitorEmail,
      visitorPhone,
      status: 'pending'
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    res.status(201).json(visit);
  } catch (error) {
    console.error('Self register visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update visit status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'checked-in', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const visit = await Visit.findById(id).populate('host', 'firstName lastName email');
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Check permissions
    if (req.user.role === 'host' && visit.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    const previousStatus = visit.status;

    // Update timestamps based on status
    const updateData = { status };
    
    if (status === 'checked-in' && !visit.checkInTime) {
      updateData.checkInTime = new Date();
    } else if (status === 'completed' && !visit.checkOutTime) {
      updateData.checkOutTime = new Date();
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('host', 'firstName lastName email profileImage');

    res.json(updatedVisit);
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update visit details
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.host;
    delete updates.companyId;

    const visit = await Visit.findById(id);
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Check permissions
    if (req.user.role === 'host' && visit.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('host', 'firstName lastName email profileImage');

    res.json(updatedVisit);
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Delete visit
router.delete('/:id', auth, authorize('admin', 'reception'), async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    res.json({ message: 'Visita eliminada exitosamente' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;