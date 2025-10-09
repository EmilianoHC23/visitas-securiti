const express = require('express');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
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

// Get hosts (for visit assignment)
router.get('/hosts', auth, async (req, res) => {
  try {
    const hosts = await User.find({ 
      role: 'host', 
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

// Delete/Deactivate user (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // force=true para eliminación completa

    // Don't allow admin to delete/deactivate themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si se solicita eliminación completa (force=true)
    if (force === 'true') {
      // Verificar si el usuario tiene invitaciones pendientes
      const pendingInvitation = await Invitation.findOne({
        email: user.email,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (pendingInvitation) {
        return res.status(400).json({ 
          message: 'No se puede eliminar el usuario porque tiene una invitación pendiente activa' 
        });
      }

      // Eliminar completamente el usuario
      await User.findByIdAndDelete(id);
      console.log(`🗑️ User completely deleted: ${user.email} (${user._id})`);
      
      res.json({ message: 'Usuario eliminado completamente del sistema' });
    } else {
      // Desactivación normal (comportamiento actual)
      await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
      console.log(`🚫 User deactivated: ${user.email} (${user._id})`);
      
      res.json({ message: 'Usuario desactivado exitosamente' });
    }
  } catch (error) {
    console.error('Delete/Deactivate user error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get hosts publicly (for visitor registration)
router.get('/public/hosts', async (req, res) => {
  try {
    // Get hosts from all companies for general registration
    const hosts = await User.find({ 
      role: 'host', 
      isActive: true 
    }).select('firstName lastName email _id companyId');
    res.json(hosts);
  } catch (error) {
    console.error('Get public hosts error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;