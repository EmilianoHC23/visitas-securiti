const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { email, password, recaptchaToken } = req.body;
    
    console.log('Login attempt for:', email);
    console.log('Password provided:', !!password);
    console.log('reCAPTCHA token provided:', !!recaptchaToken);

    if (!email || !password) {
      console.log('Missing credentials - email:', !!email, 'password:', !!password);
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Validar reCAPTCHA (opcional en desarrollo)
    if (recaptchaToken && process.env.NODE_ENV === 'production') {
      try {
        console.log('reCAPTCHA token length:', recaptchaToken.length);
        console.log('reCAPTCHA token preview:', recaptchaToken.substring(0, 50) + '...');
        
        const recaptchaResponse = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify`,
          null,
          {
            params: {
              secret: process.env.RECAPTCHA_SECRET_KEY,
              response: recaptchaToken
            }
          }
        );

        console.log('reCAPTCHA validation result:', recaptchaResponse.data);

        if (!recaptchaResponse.data.success) {
          console.log('reCAPTCHA validation failed. Error codes:', recaptchaResponse.data['error-codes']);
          return res.status(400).json({ 
            message: 'Validación de reCAPTCHA fallida',
            errors: recaptchaResponse.data['error-codes']
          });
        }
        
        console.log('reCAPTCHA validation successful');
      } catch (recaptchaError) {
        console.error('Error validating reCAPTCHA:', recaptchaError.message);
        return res.status(500).json({ message: 'Error al validar reCAPTCHA' });
      }
    } else {
      console.log('Warning: reCAPTCHA validation skipped (development mode or no token)');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    if (!user.isActive) {
      console.log('User is inactive:', email);
      return res.status(401).json({ message: 'Usuario desactivado' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
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

    console.log('Login successful for:', email);

    // Return user without password
    const userResponse = user.toJSON();

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get me error:', error);
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
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DEBUG: Get available users (temporal - remove in production)
router.get('/debug/users', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    const users = await User.find({}, 'email firstName lastName role isActive');
    res.json({
      message: 'Available users for testing',
      users: users.map(user => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;