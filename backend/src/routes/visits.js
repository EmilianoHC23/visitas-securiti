const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const Approval = require('../models/Approval');
const VisitEvent = require('../models/VisitEvent');

const router = express.Router();

// Get all visits
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, hostId, visitorName, visitorCompany, q, page = 1, limit = 10 } = req.query;
    const filter = { companyId: req.user.companyId };

    // Filtros avanzados
    if (status) filter.status = status;
    if (hostId) filter.host = hostId;
    if (visitorName) filter.visitorName = { $regex: visitorName, $options: 'i' };
    if (visitorCompany) filter.visitorCompany = { $regex: visitorCompany, $options: 'i' };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    if (q) {
      filter.$or = [
        { visitorName: { $regex: q, $options: 'i' } },
        { visitorCompany: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } },
      ];
    }

    // Si el usuario es anfitrión, solo mostrar sus visitas
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Visit.countDocuments(filter);
    const visits = await Visit.find(filter)
      .populate('host', 'firstName lastName email profileImage')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      visits,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
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
    // Obtener eventos de la visita para la línea de tiempo
    const events = await VisitEvent.find({ visitId: visit._id }).sort({ createdAt: 1 });
    res.json({ visit, events });
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
    if (!visitorName || !reason || !hostId || !scheduledDate) {
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
    let company = null;
    let autoApproval = false;
    
    try {
      // Validate that host.companyId is a valid ObjectId
      if (host.companyId && mongoose.Types.ObjectId.isValid(host.companyId)) {
        company = await Company.findOne({ _id: host.companyId });
        autoApproval = company?.settings?.autoApproval || false;
      } else {
        console.log('⚠️ Invalid companyId for host:', { hostId, companyId: host.companyId });
        // Use default company settings if companyId is invalid
        autoApproval = false;
      }
    } catch (error) {
      console.log('⚠️ Error fetching company settings:', error.message);
      autoApproval = false;
    }
    
    console.log('🏢 Company settings:', { autoApproval, companyId: host.companyId });

    const visit = new Visit({
      visitorName,
      visitorCompany: visitorCompany || '',
      reason,
      destination: req.body.destination || 'SecurITI',
      host: hostId,
      scheduledDate: new Date(scheduledDate),
      companyId: req.user.companyId,
      visitorEmail,
      visitorPhone,
      status: autoApproval ? 'approved' : 'pending'
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    // Create approval token and send email to host if not auto-approved
    if (!autoApproval) {
      const approval = Approval.createWithExpiry(visit._id, host._id, 48);
      await approval.save();

  const FE = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const approveUrl = `${FE}/api/visits/approve/${approval.token}`;
    const rejectUrl = `${FE}/api/visits/reject/${approval.token}`;
      await require('../services/emailService').sendApprovalRequestEmail({
        hostEmail: host.email,
        companyName: (company && company.name) || 'SecurITI',
        visitorName,
        visitorCompany,
        visitorPhoto: req.body.visitorPhoto,
        reason,
        scheduledDate,
        approveUrl,
        rejectUrl
      });
    }

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
    if (!visitorName || !reason || !hostId) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verify host exists and is active
    const host = await User.findById(hostId);
    if (!host || !host.isActive || host.role !== 'host') {
      return res.status(400).json({ message: 'Host no válido' });
    }

    const visit = new Visit({
      visitorName,
      visitorCompany: visitorCompany || '',
      reason,
      destination: req.body.destination || 'SecurITI',
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

    // Create approval token and email host
    const approval = Approval.createWithExpiry(visit._id, host._id, 48);
    await approval.save();
  const FE = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const approveUrl = `${FE}/api/visits/approve/${approval.token}`;
  const rejectUrl = `${FE}/api/visits/reject/${approval.token}`;
    await require('../services/emailService').sendApprovalRequestEmail({
      hostEmail: host.email,
      companyName: 'SecurITI',
      visitorName,
      visitorCompany,
      visitorPhoto,
      reason,
      scheduledDate: new Date(),
      approveUrl,
      rejectUrl
    });

    res.status(201).json(visit);
  } catch (error) {
    console.error('Self register visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update visit status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const id = req.params.id;
    const allowedStatuses = ['pending', 'approved', 'checked-in', 'completed', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado no válido. Estados permitidos: ' + allowedStatuses.join(', ') });
    }

    const visit = await Visit.findById(id).populate('host', 'firstName lastName email');
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Solo anfitrión o admin pueden modificar el estado
    if (
      req.user.role === 'host' && visit.host._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    const previousStatus = visit.status;

    // Validar transiciones de estado
    const validTransitions = {
      'pending': ['approved', 'rejected', 'cancelled'],
      'approved': ['checked-in', 'cancelled'],
      'checked-in': ['completed'],
      'completed': [],
      'rejected': [],
      'cancelled': [],
    };
    if (!validTransitions[previousStatus].includes(status)) {
      return res.status(400).json({ message: `Transición de estado no permitida: ${previousStatus} → ${status}` });
    }

    // Actualizar timestamps y qrToken según el estado
    const updateData = { status };
    if (status === 'rejected' && reason) {
      updateData.rejectionReason = reason;
    }
    let eventType = null;
    if (status === 'approved' && !visit.qrToken) {
      // Generar qrToken único
      updateData.qrToken = require('crypto').randomBytes(16).toString('hex');
    }
    if (status === 'checked-in') {
      updateData.checkInTime = new Date();
      eventType = 'check-in';
    }
    if (status === 'completed') {
      updateData.checkOutTime = new Date();
      updateData.qrToken = null; // invalidar QR tras check-out
      eventType = 'check-out';
    }

    const updated = await Visit.findByIdAndUpdate(id, updateData, { new: true });

    // Registrar evento si aplica
    if (eventType) {
      await new VisitEvent({ visitId: updated._id, type: eventType }).save();
    }

    // Enviar notificaciones al visitante cuando corresponda
    if ((status === 'approved' || status === 'rejected') && updated.visitorEmail) {
      const populated = await Visit.findById(updated._id).populate('host', 'firstName lastName');
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitId: updated._id.toString(),
          visitorEmail: populated.visitorEmail,
          visitorName: populated.visitorName,
          hostName: `${populated.host.firstName} ${populated.host.lastName}`,
          companyName: 'SecurITI',
          status,
          reason: populated.reason,
          scheduledDate: populated.scheduledDate,
          destination: populated.destination
        });
      } catch (mailErr) {
        console.warn('Email notify error:', mailErr?.message || mailErr);
      }
    }

  res.json(updated);
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Check-out vía QR (fuera del handler de estado)
router.post('/scan-qr', auth, async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ message: 'QR no proporcionado' });
    const visit = await Visit.findOne({ qrToken });
    if (!visit) return res.status(404).json({ message: 'QR inválido o visita no encontrada' });
    if (visit.status !== 'checked-in') {
      return res.status(400).json({ message: 'La visita no está dentro o ya fue finalizada' });
    }
    if (!visit.qrToken) {
      return res.status(400).json({ message: 'El QR ya fue usado para check-out' });
    }
    // Realizar check-out
    visit.status = 'completed';
    visit.checkOutTime = new Date();
    visit.qrToken = null;
    await visit.save();
    await new VisitEvent({ visitId: visit._id, type: 'check-out-qr' }).save();
    res.json({ message: 'Check-out realizado correctamente', visit });
  } catch (e) {
    console.error('Scan QR error:', e);
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

    // Si se está actualizando la razón de rechazo en una visita rechazada, enviar email
    if (updates.rejectionReason && updatedVisit.status === 'rejected' && updatedVisit.visitorEmail) {
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitId: updatedVisit._id.toString(),
          visitorEmail: updatedVisit.visitorEmail,
          visitorName: updatedVisit.visitorName,
          hostName: `${updatedVisit.host.firstName} ${updatedVisit.host.lastName}`,
          companyName: 'SecurITI',
          status: 'rejected',
          reason: updatedVisit.reason,
          scheduledDate: updatedVisit.scheduledDate,
          destination: updatedVisit.destination || 'SecurITI',
          rejectionReason: updatedVisit.rejectionReason
        });
        console.log('✅ Email de rechazo enviado con razón:', updatedVisit.rejectionReason);
      } catch (emailError) {
        console.warn('⚠️ Error enviando email de rechazo:', emailError?.message || emailError);
      }
    }

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

// Additional endpoints

// Get visit status by id (mapped)
// Assign/Update access resource for a visit
router.put('/:id/access', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { accessId } = req.body;

    const visit = await Visit.findById(id);
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });

    // Permissions: host can only edit their own visits; admin/reception allowed
    if (req.user.role === 'host' && visit.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    // Optionally validate Access exists
    if (accessId) {
      if (!mongoose.Types.ObjectId.isValid(accessId)) {
        return res.status(400).json({ message: 'accessId inválido' });
      }
      // Not strictly required to fetch Access, but we could ensure it belongs to same company
      // const Access = require('../models/Access');
      // const access = await Access.findById(accessId);
      // if (!access) return res.status(404).json({ message: 'Recurso de acceso no encontrado' });
    }

    visit.accessId = accessId || null;
    await visit.save();
    const populated = await Visit.findById(visit._id).populate('host', 'firstName lastName email profileImage');
    res.json(populated);
  } catch (error) {
    console.error('Update visit access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
router.get('/status/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    const estados = {
      PENDIENTE: 'en_espera',
      APROBADO: 'respuesta_recibida',
      RECHAZADO: 'respuesta_recibida',
      DENTRO: 'dentro',
      COMPLETADO: 'completado'
    };
    let mapped;
    switch (visit.status) {
      case 'pending': mapped = estados.PENDIENTE; break;
      case 'approved': mapped = estados.APROBADO; break;
      case 'rejected': mapped = estados.RECHAZADO; break;
      case 'checked-in': mapped = estados.DENTRO; break;
      case 'completed': mapped = estados.COMPLETADO; break;
      default: mapped = 'en_espera';
    }
    res.json({ status: visit.status, mapped });
  } catch (e) {
    console.error('Get status error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Approve/reject by token from email and redirect
router.get('/approve/:token', async (req, res) => {
  try {
    const approval = await Approval.findOne({ token: req.params.token });
    if (!approval || approval.status !== 'pending') return res.status(400).send('Token inválido o ya utilizado');
    if (approval.isExpired()) return res.status(400).send('El enlace de aprobación ha expirado');
    
    const visit = await Visit.findById(approval.visitId);
    if (!visit) return res.status(404).send('Visita no encontrada');
    
    visit.status = 'approved';
    if (!visit.qrToken) {
      visit.qrToken = require('crypto').randomBytes(16).toString('hex');
    }
    await visit.save();
    approval.status = 'decided';
    approval.decision = 'approved';
    approval.decidedAt = new Date();
    await approval.save();
    
    // Send notification to visitor if email exists
    if (visit.visitorEmail) {
      await visit.populate('host', 'firstName lastName');
      await require('../services/emailService').sendVisitorNotificationEmail({
        visitId: visit._id.toString(),
        visitorEmail: visit.visitorEmail,
        visitorName: visit.visitorName,
        hostName: `${visit.host.firstName} ${visit.host.lastName}`,
        companyName: 'SecurITI',
        status: 'approved',
        reason: visit.reason,
        scheduledDate: visit.scheduledDate,
        destination: visit.destination
      });
    }
    
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/visit-confirmation?result=approved`;
    res.redirect(302, redirect);
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).send('Error interno');
  }
});

router.get('/reject/:token', async (req, res) => {
  try {
    const approval = await Approval.findOne({ token: req.params.token });
      if (!approval || approval.status !== 'pending') return res.status(400).send('Token inválido o ya utilizado');
      if (approval.isExpired()) return res.status(400).send('El enlace de aprobación ha expirado');
    
    const visit = await Visit.findById(approval.visitId);
    if (!visit) return res.status(404).send('Visita no encontrada');
    
    visit.status = 'rejected';
    await visit.save();
    approval.status = 'decided';
    approval.decision = 'rejected';
    approval.decidedAt = new Date();
    await approval.save();
    
      // Send notification to visitor if email exists
      if (visit.visitorEmail) {
        await visit.populate('host', 'firstName lastName');
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          hostName: `${visit.host.firstName} ${visit.host.lastName}`,
          companyName: 'SecurITI',
          status: 'rejected',
          reason: visit.reason,
          scheduledDate: visit.scheduledDate,
          destination: visit.destination
        });
      }
    
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/visit-confirmation?result=rejected`;
    res.redirect(302, redirect);
  } catch (e) {
    console.error('Reject error:', e);
    res.status(500).send('Error interno');
  }
});

// Check-in
router.post('/checkin/:id', auth, async (req, res) => {
  try {
    const { assignedResource } = req.body;
    const visit = await Visit.findById(req.params.id).populate('host', 'firstName lastName');
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    visit.status = 'checked-in';
    visit.checkInTime = new Date();
    if (assignedResource) {
      visit.assignedResource = assignedResource;
    }
    await visit.save();
    await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
    // Optional: notify visitor of check-in confirmation
    if (visit.visitorEmail) {
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          hostName: `${visit.host.firstName} ${visit.host.lastName}`,
          companyName: 'SecurITI',
          status: 'checked-in',
          reason: visit.reason,
          scheduledDate: visit.scheduledDate,
          destination: visit.destination
        });
      } catch (mailErr) {
        console.warn('Email notify error (check-in):', mailErr?.message || mailErr);
      }
    }
    res.json(visit);
  } catch (e) {
    console.error('Check-in error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Check-out with up to 5 photos
router.post('/checkout/:id', auth, async (req, res) => {
  try {
    const { photos } = req.body; // array of base64 strings
    const visit = await Visit.findById(req.params.id).populate('host', 'firstName lastName');
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    visit.status = 'completed';
    visit.checkOutTime = new Date();
    await visit.save();
    const limitedPhotos = Array.isArray(photos) ? photos.slice(0, 5) : [];
    await new VisitEvent({ visitId: visit._id, type: 'check-out', photos: limitedPhotos }).save();
    const elapsedMs = visit.checkInTime ? (visit.checkOutTime - visit.checkInTime) : null;
    
    // Enviar email de despedida al visitante
    if (visit.visitorEmail) {
      try {
        await require('../services/emailService').sendCheckoutEmail({
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          visitorCompany: visit.visitorCompany || 'N/A',
          hostName: `${visit.host.firstName} ${visit.host.lastName}`,
          companyName: 'SecurITI',
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime
        });
      } catch (mailErr) {
        console.warn('Email checkout error:', mailErr?.message || mailErr);
      }
    }
    res.json({ visit, elapsedMs });
  } catch (e) {
    console.error('Check-out error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agenda endpoint
router.get('/agenda', auth, async (req, res) => {
  try {
    const { from, to, hostId, q } = req.query;
    const filter = { companyId: req.user.companyId };
    const now = new Date();
    const start = from ? new Date(from) : now;
    const end = to ? new Date(to) : new Date(now.getTime() + 30*24*60*60*1000);
    filter.scheduledDate = { $gte: start, $lte: end };
    if (hostId) filter.host = hostId;
    if (q) {
      filter.$or = [
        { visitorName: { $regex: q, $options: 'i' } },
        { visitorCompany: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } }
      ];
    }
    const visits = await Visit.find(filter).populate('host', 'firstName lastName email');
    res.json(visits);
  } catch (e) {
    console.error('Agenda error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});