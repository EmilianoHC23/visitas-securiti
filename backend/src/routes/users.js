const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { 
      $or: [
        { isActive: true },
        { invitationStatus: 'pending' }
      ]
    };
    
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get hosts (for visit assignment) - Incluye hosts y admins
router.get('/hosts', auth, async (req, res) => {
  try {
    const hosts = await User.find({ 
      role: { $in: ['host', 'admin'] }, 
      isActive: true 
    }).select('-password');
    res.json(hosts);
  } catch (error) {
    console.error('Get hosts error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Create new user (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Ya existe un usuario con este email' });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      companyId: req.user.companyId // Same company as the admin
    });

    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update user (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates._id;

    // If email is being updated, check for duplicates
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: id } // Exclude current user
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Ya existe un usuario con este email' });
      }
      // Ensure email is stored in lowercase
      updates.email = updates.email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Deactivate user (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow admin to deactivate themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

  // Get hosts publicly (for visitor registration) - Incluye hosts y admins
router.get('/public/hosts', async (req, res) => {
  try {
    // Get hosts and admins from all companies for general registration
    const hosts = await User.find({ 
      role: { $in: ['host', 'admin'] }, 
      isActive: true 
    }).select('firstName lastName email _id companyId profileImage');
    res.json(hosts);
  } catch (error) {
    console.error('Get public hosts error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;