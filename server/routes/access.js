const express = require('express');
const Access = require('../models/Access');
const Visit = require('../models/Visit');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all access codes
router.get('/', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
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
    // Reception can see all access codes (read-only)

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
router.post('/', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
    console.log('=== CREATE ACCESS CODE DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', JSON.stringify(req.user, null, 2));

    const { 
      title, 
      description, 
      schedule, 
      settings,
      invitedEmails
    } = req.body;

    console.log('Extracted values:', {
      title,
      description,
      schedule,
      settings,
      invitedEmails
    });

    if (!title || (!schedule?.date && !schedule?.startDate)) {
      console.log('Validation failed: missing title or schedule date');
      return res.status(400).json({ message: 'Título y fecha son requeridos' });
    }

    // Handle both old format (date) and new format (startDate/endDate)
    let startDate, endDate;
    
    if (schedule.startDate && schedule.endDate) {
      // New format: direct startDate and endDate
      startDate = new Date(schedule.startDate);
      endDate = new Date(schedule.endDate);
    } else {
      // Old format: convert date + time to startDate/endDate
      console.log('Creating start date from:', schedule.date);
      startDate = new Date(schedule.date);
      if (schedule.startTime) {
        const [hours, minutes] = schedule.startTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        startDate.setHours(9, 0, 0, 0); // Default 9:00 AM
      }

      console.log('Creating end date from:', schedule.date);
      endDate = new Date(schedule.date);
      if (schedule.endTime) {
        const [hours, minutes] = schedule.endTime.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        endDate.setHours(17, 0, 0, 0); // Default 5:00 PM
      }
    }

    // If end time is before start time, assume it's next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    console.log('Computed dates:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const accessData = {
      title,
      description,
      createdBy: req.user._id,
      companyId: req.user.companyId,
      settings: {
        autoApproval: settings?.autoApproval || true,
        maxUses: settings?.maxUses || 1,
        allowGuests: settings?.allowGuests || false,
        requireApproval: settings?.requireApproval || false
      },
      schedule: {
        startDate,
        endDate,
        startTime: schedule.startTime || '09:00',
        endTime: schedule.endTime || '17:00',
        recurrence: schedule.recurrence || 'none'
      },
      invitedEmails: invitedEmails?.map(email => ({
        email,
        sentAt: new Date(),
        status: 'sent'
      })) || []
    };

    console.log('Access data to save:', JSON.stringify(accessData, null, 2));

    const access = new Access(accessData);
    console.log('Access model created, attempting to save...');
    
    await access.save();
    console.log('Access saved successfully');
    
    await access.populate('createdBy', 'firstName lastName email');
    console.log('Access populated successfully');

    res.status(201).json(access);
  } catch (error) {
    console.error('Create access error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Redeem access code (public endpoint)
router.post('/redeem', async (req, res) => {
  try {
    console.log('🎫 === REDEEM ACCESS CODE START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    const { accessCode, visitorData } = req.body;

    if (!accessCode || !visitorData) {
      console.log('❌ Missing required data:', { accessCode: !!accessCode, visitorData: !!visitorData });
      return res.status(400).json({ message: 'Código de acceso y datos del visitante son requeridos' });
    }

    console.log('🔍 Looking for access code:', accessCode);
    
    const access = await Access.findOne({ 
      accessCode, 
      status: 'active' 
    }).populate('createdBy', 'firstName lastName email');

    if (!access) {
      console.log('❌ Access code not found or inactive');
      // Let's also check if the code exists but is inactive
      const inactiveAccess = await Access.findOne({ accessCode });
      if (inactiveAccess) {
        console.log('📋 Found inactive access:', {
          id: inactiveAccess._id,
          status: inactiveAccess.status,
          title: inactiveAccess.title
        });
      } else {
        console.log('📋 No access code found with this code at all');
      }
      return res.status(404).json({ message: 'Código de acceso no válido o expirado' });
    }

    console.log('✅ Access code found:', {
      id: access._id,
      title: access.title,
      status: access.status,
      usageCount: access.usageCount,
      maxUses: access.settings.maxUses
    });

    // Check if access is within valid date range with flexible validation
    const now = new Date();
    const startDate = new Date(access.schedule.startDate);
    const endDate = new Date(access.schedule.endDate);
    
    // Extract just the date parts for comparison (ignore time completely)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();
    
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();
    
    // Create simple date numbers for comparison (YYYYMMDD format)
    const currentDateNum = currentYear * 10000 + currentMonth * 100 + currentDay;
    const startDateNum = startYear * 10000 + startMonth * 100 + startDay;
    const endDateNum = endYear * 10000 + endMonth * 100 + endDay;
    
    console.log('🕐 Date validation debug:');
    console.log('Access code:', accessCode);
    console.log('Access title:', access.title);
    console.log('Current date components:', { year: currentYear, month: currentMonth, day: currentDay });
    console.log('Start date components:', { year: startYear, month: startMonth, day: startDay });
    console.log('End date components:', { year: endYear, month: endMonth, day: endDay });
    console.log('Date numbers for comparison:');
    console.log('  - Current:', currentDateNum);
    console.log('  - Start:', startDateNum);
    console.log('  - End:', endDateNum);
    console.log('Validation checks:');
    console.log('  - Is after start?', currentDateNum >= startDateNum);
    console.log('  - Is before end?', currentDateNum <= endDateNum);
    
    // Simple numeric comparison avoids all timezone issues
    const isWithinDateRange = currentDateNum >= startDateNum && currentDateNum <= endDateNum;
    
    if (!isWithinDateRange) {
      console.log('❌ Access code date validation failed');
      console.log('📅 Detailed info:');
      console.log('  - Current date string:', now.toDateString());
      console.log('  - Start date string:', startDate.toDateString());
      console.log('  - End date string:', endDate.toDateString());
      console.log('  - Schedule object:', JSON.stringify(access.schedule, null, 2));
      
      return res.status(400).json({ 
        message: 'Código de acceso fuera del período válido',
        debug: {
          currentDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
          validFrom: `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
          validUntil: `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
          accessTitle: access.title,
          currentDateNum,
          startDateNum,
          endDateNum
        }
      });
    }
    
    console.log('✅ Date validation passed');

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
router.put('/:id/status', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Reception can only update status, not edit access details
    // Host can only update their own access codes
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

// Update access code
router.put('/:id', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('=== UPDATE ACCESS CODE DEBUG ===');
    console.log('Access ID:', id);
    console.log('Updates:', JSON.stringify(updates, null, 2));

    // Find the access code
    const access = await Access.findById(id);
    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no encontrado' });
    }

    // Check if user has permission to update this access
    if (req.user.role === 'host' && access.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tiene permisos para actualizar este código' });
    }

    // Verify company ownership
    if (access.companyId !== req.user.companyId) {
      return res.status(403).json({ message: 'No tiene permisos para actualizar este código' });
    }

    // Update the access code
    const updatedAccess = await Access.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    console.log('Access updated successfully');
    res.json(updatedAccess);
  } catch (error) {
    console.error('Update access error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Delete access code
router.delete('/:id', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETE ACCESS CODE DEBUG ===');
    console.log('Access ID:', id);
    console.log('User:', req.user.email);

    // Find the access code
    const access = await Access.findById(id);
    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no encontrado' });
    }

    // Check if user has permission to delete this access
    if (req.user.role === 'host' && access.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tiene permisos para eliminar este código' });
    }

    // Verify company ownership
    if (access.companyId !== req.user.companyId) {
      return res.status(403).json({ message: 'No tiene permisos para eliminar este código' });
    }

    // Delete the access code
    await Access.findByIdAndDelete(id);

    console.log('Access deleted successfully');
    res.json({ message: 'Código de acceso eliminado exitosamente' });
  } catch (error) {
    console.error('Delete access error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;