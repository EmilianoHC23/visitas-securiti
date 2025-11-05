const express = require('express');
const mongoose = require('mongoose');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Company = require('../models/Company');
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
    
    const { firstName, lastName, email, role, profileImage } = req.body;

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
      if (profileImage) existingUser.profileImage = profileImage;
      existingUser.invitationStatus = 'pending';
      existingUser.isActive = false; // Desactivar hasta que complete el registro
      
      await existingUser.save();
      user = existingUser;
    } 
    // Si existe un usuario pendiente, usar ese
    else if (existingUser && existingUser.invitationStatus === 'pending') {
      console.log('✅ Using existing pending user:', existingUser._id);
      // Actualizar datos si se proporciona nueva imagen
      if (profileImage) {
        existingUser.profileImage = profileImage;
        await existingUser.save();
      }
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
        profileImage: profileImage || '',
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

    // Verificar si ya existe alguna invitación para este email (independientemente del estado)
    console.log('🔍 Checking for any existing invitation for email...');
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase()
    });
    console.log('📊 Existing invitation check result:', existingInvitation ? `Found (status: ${existingInvitation.status})` : 'Not found');

    let invitation;
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');

    if (existingInvitation) {
      // Actualizar invitación existente con nuevos datos
      console.log('🔄 Updating existing invitation...');
      existingInvitation.firstName = firstName;
      existingInvitation.lastName = lastName;
      existingInvitation.role = role;
      existingInvitation.invitedBy = req.user._id;
      existingInvitation.companyId = req.user.companyId;
      existingInvitation.invitationToken = invitationToken;
      existingInvitation.status = 'pending';
      existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
      existingInvitation.createdAt = new Date();
      
      invitation = existingInvitation;
    } else {
      // Crear nueva invitación
      console.log('📧 Creating new invitation...');
      invitation = new Invitation({
        firstName,
        lastName,
        email: email.toLowerCase(),
        role,
        invitedBy: req.user._id,
        companyId: req.user.companyId,
        invitationToken
      });
    }

    try {
      await invitation.save();
      console.log(`✅ Invitation ${existingInvitation ? 'updated' : 'created'} successfully:`, invitation._id);
    } catch (invitationError) {
      console.error('❌ Error saving invitation:', invitationError);
      throw invitationError;
    }

    // Enviar email de invitación
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitation.invitationToken}`;
    console.log('📧 Email service enabled:', emailService.isEnabled());
    console.log('📧 Sending invitation email to:', email.toLowerCase());

    // Obtener el nombre de la compañía
    const company = await Company.findOne({ companyId: req.user.companyId });
    const companyName = company ? company.name : 'Visitas SecuriTI';

    const emailResult = await emailService.sendInvitationEmail({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      token: invitation.invitationToken,
      companyName,
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
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Obtener el nombre de la compañía
    const company = await Company.findOne({ companyId: invitation.companyId });
    const companyName = company ? company.name : 'Visitas SecuriTI';

    res.json({
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        companyName
      }
    });

  } catch (error) {
    console.error('Error verifying invitation token:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Completar registro desde invitación
router.post('/complete', async (req, res) => {
  try {
    const { token, password, firstName, lastName, profileImage } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    console.log('🔍 Looking for invitation with token:', token);
    console.log('🔍 Found invitation:', invitation ? 'YES' : 'NO');
    if (invitation) {
      console.log('🔍 Invitation status:', invitation.status);
      console.log('🔍 Invitation expiresAt:', invitation.expiresAt);
      console.log('🔍 Current time:', new Date());
      console.log('🔍 Is expired?', invitation.expiresAt <= new Date());
    }

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
    if (profileImage) {
      existingUser.profileImage = profileImage; // Guardar foto si se proporcionó
    }
    existingUser.invitationStatus = 'registered';
    existingUser.isActive = true;

    // Asegurar que la contraseña se marque como modificada para que se hashee
    existingUser.markModified('password');

    console.log('🔐 Updating user password for:', existingUser.email);
    await existingUser.save();
    console.log('✅ User updated successfully, password hashed');

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

    // Verificar que no haya una invitación pendiente reciente (menos de 1 minuto)
    const recentInvitation = await Invitation.findOne({
      email: user.email,
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - 1 * 60 * 1000) } // Último 1 minuto
    });

    if (recentInvitation) {
      return res.status(400).json({ message: 'Ya se envió una invitación recientemente. Espera 1 minuto antes de reenviar.' });
    }

    // Buscar invitación existente para este email
    let invitation = await Invitation.findOne({ email: user.email });

    if (invitation) {
      // Actualizar la invitación existente sin cambiar el token
      console.log('🔄 Updating existing invitation for email:', user.email);
      console.log('🔄 Current invitation token:', invitation.invitationToken);
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
      invitation.status = 'pending';
      invitation.createdAt = new Date();
      
      await invitation.save();
      console.log('✅ Invitation updated successfully:', invitation._id);
      console.log('✅ Updated invitation token:', invitation.invitationToken);
      console.log('✅ Updated invitation expiresAt:', invitation.expiresAt);
    } else {
      // Crear nueva invitación si no existe
      console.log('📧 Creating new invitation for email:', user.email);
      const crypto = require('crypto');
      const invitationToken = crypto.randomBytes(32).toString('hex');
      
      invitation = new Invitation({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        invitedBy: req.user._id,
        companyId: req.user.companyId,
        invitationToken
      });

      await invitation.save();
      console.log('✅ Invitation created successfully:', invitation._id);
    }

    // Enviar email de invitación
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${invitation.invitationToken}`;

    // Obtener el nombre de la compañía
    const company = await Company.findOne({ companyId: req.user.companyId });
    const companyName = company ? company.name : 'Visitas SecuriTI';

    const emailResult = await emailService.sendInvitationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: invitation.invitationToken,
      companyName,
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

// Eliminar invitación y usuario (sin restricciones de estado)
router.delete('/:userId', auth, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🗑️ Deleting user and invitation:', userId);

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar y eliminar la invitación asociada (si existe)
    const invitation = await Invitation.findOne({ email: user.email });
    if (invitation) {
      await Invitation.findByIdAndDelete(invitation._id);
      console.log('🗑️ Invitation deleted:', invitation._id);
    }

    // Eliminar el usuario (sin importar el estado)
    await User.findByIdAndDelete(userId);
    console.log('🗑️ User deleted:', userId);

    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;