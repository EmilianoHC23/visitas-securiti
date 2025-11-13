const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

// Login - Protected with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    logger.log('Login request received');
    
    const { email, password } = req.body;

    if (!email || !password) {
      logger.log('Missing credentials');
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email });
    
    if (!user) {
      logger.security('Login attempt for non-existent user', { email });
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      logger.security('Login attempt for locked account', { email });
      return res.status(423).json({ 
        message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${lockTimeRemaining} minutos.`,
        lockUntil: user.lockUntil
      });
    }

    if (!user.isActive) {
      logger.security('Login attempt for inactive user', { email });
      return res.status(401).json({ message: 'Usuario desactivado' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      logger.security('Failed login attempt', { email, attempts: user.loginAttempts + 1 });
      
      // Increment login attempts
      await user.incLoginAttempts();
      
      // Reload user to get updated attempts
      const updatedUser = await User.findById(user._id);
      const attemptsLeft = 5 - updatedUser.loginAttempts;
      
      if (updatedUser.isLocked) {
        return res.status(423).json({ 
          message: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente por 30 minutos.'
        });
      }
      
      return res.status(401).json({ 
        message: `Credenciales incorrectas. ${attemptsLeft} intentos restantes.`
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await user.resetLoginAttempts();
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.audit('Login successful', user._id, { email: user.email, role: user.role });

    // Return user without password
    const userResponse = user.toJSON();

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = jwt.sign(
      { 
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;