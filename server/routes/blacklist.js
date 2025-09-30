const express = require('express');
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
    const { email, name, reason } = req.body;

    if (!email || !name || !reason) {
      return res.status(400).json({ message: 'Email, nombre y razón son requeridos' });
    }

    // Check if already exists
    const existing = await Blacklist.findOne({ 
      email, 
      companyId: req.user.companyId,
      isActive: true 
    });

    if (existing) {
      return res.status(400).json({ message: 'Esta persona ya está en la lista negra' });
    }

    const blacklistEntry = new Blacklist({
      email,
      name,
      reason,
      addedBy: req.user._id,
      companyId: req.user.companyId
    });

    await blacklistEntry.save();
    await blacklistEntry.populate('addedBy', 'firstName lastName email');

    res.status(201).json(blacklistEntry);
  } catch (error) {
    console.error('Add to blacklist error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
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