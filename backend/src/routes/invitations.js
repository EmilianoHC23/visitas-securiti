const express = require('express');
const mongoose = require('mongoose');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Endpoint de prueba para verificar configuración SMTP
router.get('/test-smtp', auth, (req, res) => {
  console.log('🧪 Testing SMTP configuration...');
  console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
  console.log('📧 SMTP_PORT:', process.env.SMTP_PORT);
  console.log('📧 SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
  console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
  console.log('📧 EMAIL_FROM:', process.env.EMAIL_FROM);
  
  const emailService = require('../services/emailService');
  const isEnabled = emailService.isEnabled();
  
  // Verificar manualmente las credenciales
  const hasCredentials = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  
  res.json({
    smtpConfigured: hasCredentials, // Usar verificación manual en lugar de isEnabled()
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER ? 'Configured' : 'Not configured',
    smtpPass: process.env.SMTP_PASS ? 'Configured' : 'Not configured',
    emailFrom: process.env.EMAIL_FROM,
    timestamp: new Date().toISOString()
  });
});

// Enviar invitación
router.post('/', auth, authorize(['admin']), async (req, res) => {
  try {
    console.log('📧 Starting invitation process for:', req.body.email);
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 User from token:', req.user ? req.user.email : 'No user');
    
    const { firstName, lastName, email, role } = req.body;

    // Validar datos
    if (!firstName || !lastName || !email || !role) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si ya existe un usuario con este email
    const existingUser = await User.findOne({ 
      email: email.toLowerCase()
    });

    // Si existe un usuario registrado, permitir reinvitación pero actualizar sus datos
    if (existingUser && existingUser.invitationStatus === 'registered') {
      console.log('🔄 User already registered, updating for reinvitation...');
      
      // Actualizar datos del usuario existente
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.role = role;
      existingUser.invitationStatus = 'pending';
      existingUser.isActive = false; // Desactivar hasta que complete el registro
      
      await existingUser.save();
      user = existingUser;
    } 
    // Si existe un usuario pendiente, usar ese
    else if (existingUser && existingUser.invitationStatus === 'pending') {
      console.log('✅ Using existing pending user:', existingUser._id);
      user = existingUser;
    }
    // Si no existe, crear uno nuevo
    else {
      console.log('👤 Creating new pending user...');
      user = new User({
        email: email.toLowerCase(),
        password: 'temp123', // Contraseña temporal, será cambiada al completar registro
        firstName,
        lastName,
        role,
        companyId: req.user.companyId,
        invitationStatus: 'pending',
        isActive: false // Usuario inactivo hasta completar registro
      });
      
      try {
        await user.save();
        console.log('✅ User created successfully:', user._id);
      } catch (userError) {
        console.error('❌ Error creating user:', userError.message);
        console.error('❌ Error code:', userError.code);
        
        // Si es un error de duplicado (email ya existe)
        if (userError.code === 11000) {
          return res.status(400).json({ 
            message: 'Ya existe un usuario registrado con este email',
            error: 'DUPLICATE_EMAIL'
          });
        }
        
        return res.status(500).json({ 
          message: 'Error al crear el usuario',
          error: userError.message
        });
      }
    }

    // Verificar que no haya una invitación pendiente
    console.log('🔍 Checking for existing pending invitations...');
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    console.log('📊 Existing invitation check result:', existingInvitation ? 'Found' : 'Not found');

    if (existingInvitation) {
      console.log('❌ Invitation already exists');
      return res.status(400).json({ message: 'Ya existe una invitación pendiente para este email' });
    }

    // Crear invitación
    console.log('📧 Creating invitation...');
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    
    const invitation = new Invitation({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user._id,
      companyId: req.user.companyId,
      invitationToken
    });

    try {
      await invitation.save();
      console.log('✅ Invitation created successfully:', invitation._id);
    } catch (invitationError) {
      console.error('❌ Error creating invitation:', invitationError);
      throw invitationError;
    }

    // Enviar email de invitación
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitation.invitationToken}`;
    console.log('📧 Email service enabled:', emailService.isEnabled());
    console.log('📧 Sending invitation email to:', email.toLowerCase());

    const emailResult = await emailService.sendInvitationEmail({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      token: invitation.invitationToken,
      companyName: 'Visitas SecuriTI', // TODO: Obtener de la compañía
      invitedBy: req.user.firstName + ' ' + req.user.lastName
    });

    console.log('📧 Email result:', emailResult);

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      // En lugar de eliminar la invitación, la guardamos y permitimos reenviarla
      console.log('⚠️ Invitation saved but email failed. User can resend later.');
      return res.status(201).json({
        message: 'Invitación creada pero el email no pudo enviarse. El usuario puede reenviar la invitación desde la tabla.',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: 'email_failed',
          expiresAt: invitation.expiresAt
        },
        warning: 'Email no enviado. Verifica la configuración SMTP.'
      });
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
    console.error('💥 CRITICAL ERROR in invitation process:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error message:', error.message);
    
    // En desarrollo, devolver más detalles del error
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ 
        message: 'Error interno del servidor', 
        error: error.message,
        stack: error.stack
      });
    }
    
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

    // Buscar el usuario pendiente creado durante la invitación
    const existingUser = await User.findOne({
      email: invitation.email,
      invitationStatus: 'pending'
    });

    if (!existingUser) {
      return res.status(400).json({ message: 'Usuario invitado no encontrado' });
    }

    // Actualizar el usuario existente con los datos proporcionados
    existingUser.password = password;
    existingUser.firstName = firstName || invitation.firstName;
    existingUser.lastName = lastName || invitation.lastName;
    existingUser.invitationStatus = 'registered';
    existingUser.isActive = true;

    await existingUser.save();

    // Marcar invitación como aceptada
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Generar token JWT para login automático
    const jwt = require('jsonwebtoken');
    const token_jwt = jwt.sign(
      { userId: existingUser._id, email: existingUser.email, role: existingUser.role, companyId: existingUser.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Registro completado exitosamente',
      user: {
        id: existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        role: existingUser.role
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

    // Eliminar cualquier invitación existente para este email antes de crear una nueva
    console.log('🗑️ Removing existing invitations for email:', user.email);
    await Invitation.deleteMany({ email: user.email });

    // Crear nueva invitación
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    
    const invitation = new Invitation({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      invitedBy: req.user._id,
      companyId: req.user.companyId,
      invitationToken
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

// Eliminar invitación y usuario pendiente
router.delete('/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🗑️ Deleting invitation for user:', userId);

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que sea un usuario pendiente
    if (user.invitationStatus !== 'pending') {
      return res.status(400).json({ message: 'Solo se pueden eliminar usuarios con invitación pendiente' });
    }

    // Buscar y eliminar la invitación asociada
    const invitation = await Invitation.findOne({ email: user.email });
    if (invitation) {
      await Invitation.findByIdAndDelete(invitation._id);
      console.log('🗑️ Invitation deleted:', invitation._id);
    }

    // Eliminar el usuario pendiente
    await User.findByIdAndDelete(userId);
    console.log('🗑️ User deleted:', userId);

    res.json({ message: 'Invitación eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;