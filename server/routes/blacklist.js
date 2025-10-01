const express = require('express');
const mongoose = require('mongoose');
const Blacklist = require('../models/Blacklist');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all blacklisted entries
router.get('/', auth, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const blacklist = await Blacklist.find({ 
      companyId: req.user.companyId,
      isActive: true 
    })
    .populate('addedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.json(blacklist);
  } catch (error) {
    console.error('Get blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Add to blacklist
router.post('/', auth, authorize(['admin', 'reception']), async (req, res) => {
  try {
    console.log('🚫 Adding to blacklist - User:', req.user?.email, 'Company:', req.user?.companyId);
    
    const { 
      email, 
      name, 
      reason,
      identifierType,
      identifier,
      notes
    } = req.body;

    console.log('Blacklist add request:', JSON.stringify(req.body, null, 2));

    // Validate that user.companyId is valid
    if (!req.user.companyId || !mongoose.Types.ObjectId.isValid(req.user.companyId)) {
      console.log('❌ Invalid companyId for user:', { userId: req.user._id, companyId: req.user.companyId });
      return res.status(400).json({ message: 'Configuración de empresa inválida. Contacte al administrador.' });
    }

    // Support both legacy format (email, name, reason) and new format (identifierType, identifier, reason)
    let finalData;
    
    if (identifierType && identifier) {
      // New format
      if (!identifier || !reason) {
        return res.status(400).json({ message: 'Identificador y razón son requeridos' });
      }
      
      finalData = {
        identifierType,
        identifier,
        reason,
        notes,
        // Set legacy fields for compatibility
        email: identifierType === 'email' ? identifier : null,
        name: identifierType !== 'email' ? identifier : `Usuario (${identifierType})`,
        addedBy: req.user._id,
        companyId: req.user.companyId
      };
    } else {
      // Legacy format
      if (!email || !name || !reason) {
        return res.status(400).json({ message: 'Email, nombre y razón son requeridos' });
      }
      
      finalData = {
        identifierType: 'email',
        identifier: email,
        email,
        name,
        reason,
        addedBy: req.user._id,
        companyId: req.user.companyId
      };
    }

    // Check if already exists (check both identifier and email for compatibility)
    const existing = await Blacklist.findOne({ 
      $or: [
        { identifier: finalData.identifier, companyId: req.user.companyId, isActive: true },
        { email: finalData.email, companyId: req.user.companyId, isActive: true }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: 'Esta persona ya está en la lista negra' });
    }

    const blacklistEntry = new Blacklist(finalData);
    await blacklistEntry.save();
    await blacklistEntry.populate('addedBy', 'firstName lastName email');

    res.status(201).json(blacklistEntry);
  } catch (error) {
    console.error('Add to blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Remove from blacklist
router.delete('/:id', auth, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const { id } = req.params;

    const blacklistEntry = await Blacklist.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { isActive: false },
      { new: true }
    );

    if (!blacklistEntry) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json({ message: 'Removido de la lista negra exitosamente' });
  } catch (error) {
    console.error('Remove from blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Check if email is blacklisted (used internally)
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { companyId } = req.query;

    const blacklisted = await Blacklist.findOne({ 
      email: email.toLowerCase(),
      companyId,
      isActive: true 
    });

    res.json({ 
      isBlacklisted: !!blacklisted,
      reason: blacklisted?.reason || null
    });
  } catch (error) {
    console.error('Check blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;