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
      visitorName,
      name, 
      reason,
      photo,
      identifierType,
      identifier,
      notes
    } = req.body;

    console.log('Blacklist add request:', JSON.stringify(req.body, null, 2));

    // Validate that user.companyId is valid
    if (!req.user.companyId || req.user.companyId.trim() === '') {
      console.log('❌ Invalid companyId for user:', { userId: req.user._id, companyId: req.user.companyId });
      return res.status(400).json({ message: 'Configuración de empresa inválida. Contacte al administrador.' });
    }

    // Support both legacy format and new format with visitorName
    let finalData;
    
    if (email && visitorName) {
      // New format with email and visitorName
      if (!email || !visitorName || !reason) {
        return res.status(400).json({ message: 'Email, nombre y razón son requeridos' });
      }
      
      finalData = {
        identifierType: 'email',
        identifier: email,
        visitorName,
        photo,
        reason,
        notes,
        // Set legacy fields for compatibility
        email,
        name: visitorName,
        addedBy: req.user._id,
        companyId: req.user.companyId
      };
    } else if (identifierType && identifier) {
      // Old format with identifierType
      if (!identifier || !reason) {
        return res.status(400).json({ message: 'Identificador y razón son requeridos' });
      }
      
      finalData = {
        identifierType,
        identifier,
        visitorName: name || identifier,
        photo,
        reason,
        notes,
        // Set legacy fields for compatibility
        email: identifierType === 'email' ? identifier : null,
        name: name || identifier,
        addedBy: req.user._id,
        companyId: req.user.companyId
      };
    } else {
      // Legacy format - adjust validation for empty email when not email type
      if (!name || !reason) {
        return res.status(400).json({ message: 'Nombre y razón son requeridos' });
      }
      
      // For legacy format, if email is empty, treat as non-email identifier
      const isEmailType = email && email.trim() !== '';
      
      finalData = {
        identifierType: isEmailType ? 'email' : 'document',
        identifier: isEmailType ? email : name,
        visitorName: name,
        photo,
        email: isEmailType ? email : null,
        name,
        reason,
        addedBy: req.user._id,
        companyId: req.user.companyId
      };
    }

    // Check if already exists (check both identifier and email for compatibility)
    const queryConditions = [
      { identifier: finalData.identifier, companyId: req.user.companyId, isActive: true }
    ];
    
    // Only add email condition if email is not null/empty
    if (finalData.email) {
      queryConditions.push({ email: finalData.email, companyId: req.user.companyId, isActive: true });
    }
    
    const existing = await Blacklist.findOne({ 
      $or: queryConditions
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

// Check if email is blacklisted (used internally) - Legacy endpoint
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

// Check if email is blacklisted and return full entry - New endpoint
router.get('/check', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json(null);
    }

    // Try to get companyId from auth user, or default to checking without company restriction
    const companyId = req.user?.companyId;
    
    const query = { 
      $or: [
        { email: email.toLowerCase() },
        { identifier: email.toLowerCase() }
      ],
      isActive: true 
    };

    if (companyId) {
      query.companyId = companyId;
    }

    const blacklisted = await Blacklist.findOne(query);

    // Return the full entry if found, or null if not blacklisted
    res.json(blacklisted);
  } catch (error) {
    console.error('Check blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;