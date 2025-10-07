const express = require('express');
const mongoose = require('mongoose');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Enviar invitación
router.post('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    // Validar datos
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar que el email no esté ya registrado como usuario activo
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      invitationStatus: { $ne: 'pending' } // Permitir usuarios pendientes
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Ya existe un usuario activo con este email' });
    }

    // Verificar si ya hay un usuario pendiente con este email
    let user = await User.findOne({ 
      email: email.toLowerCase(),
      invitationStatus: 'pending'
    });

    // Si no existe usuario pendiente, crear uno
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        password: 'temp', // Contraseña temporal, será cambiada al completar registro
        firstName,
        lastName,
        role,
        companyId: req.user.companyId,
        invitationStatus: 'pending',
        isActive: false // Usuario inactivo hasta completar registro
      });
      await user.save();
    }

    // Verificar que no haya una invitación pendiente
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Ya existe una invitación pendiente para este email' });
    }

    // Crear invitación
    const invitation = new Invitation({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user._id,
      companyId: req.user.companyId
    });

    await invitation.save();

    // Enviar email de invitación
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitation.invitationToken}`;

    const emailResult = await emailService.sendInvitationEmail({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      invitationUrl,
      invitedBy: req.user.firstName + ' ' + req.user.lastName
    });

    if (!emailResult.success) {
      // Si falla el email, eliminar la invitación
      await Invitation.findByIdAndDelete(invitation._id);
      return res.status(500).json({ message: 'Error al enviar la invitación por email' });
    }

    res.status(201).json({
      message: 'Invitación enviada exitosamente',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar token de invitación
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invitación inválida o expirada' });
    }

    res.json({
      valid: true,
      invitation: {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        email: invitation.email,
        role: invitation.role
      }
    });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Completar registro desde invitación
router.post('/complete', async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invitación inválida o expirada' });
    }

    // Crear el usuario
    const user = new User({
      email: invitation.email,
      password,
      firstName: firstName || invitation.firstName,
      lastName: lastName || invitation.lastName,
      role: invitation.role,
      companyId: invitation.companyId,
      invitationStatus: 'registered'
    });

    await user.save();

    // Marcar invitación como aceptada
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Generar token JWT para login automático
    const jwt = require('jsonwebtoken');
    const token_jwt = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Registro completado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token: token_jwt
    });

  } catch (error) {
    console.error('Error completing registration:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un usuario con este email' });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener invitaciones (solo admin)
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const invitations = await Invitation.find({
      companyId: req.user.companyId
    })
    .populate('invitedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Reenviar invitación
router.post('/resend/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar el usuario
    const user = await User.findOne({ 
      _id: userId,
      companyId: req.user.companyId,
      invitationStatus: 'pending'
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario pendiente no encontrado' });
    }

    // Verificar que no haya una invitación pendiente reciente (menos de 5 minutos)
    const recentInvitation = await Invitation.findOne({
      email: user.email,
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
    });

    if (recentInvitation) {
      return res.status(400).json({ message: 'Ya se envió una invitación recientemente. Espera 5 minutos antes de reenviar.' });
    }

    // Crear nueva invitación
    const invitation = new Invitation({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      invitedBy: req.user._id,
      companyId: req.user.companyId
    });

    await invitation.save();

    // Enviar email de invitación
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitation.invitationToken}`;

    const emailResult = await emailService.sendInvitationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      invitationUrl,
      invitedBy: req.user.firstName + ' ' + req.user.lastName
    });

    if (!emailResult.success) {
      // Si falla el email, eliminar la invitación
      await Invitation.findByIdAndDelete(invitation._id);
      return res.status(500).json({ message: 'Error al reenviar la invitación por email' });
    }

    res.json({
      message: 'Invitación reenviada exitosamente',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;