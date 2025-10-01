const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Headers:', req.headers.authorization ? 'Token present' : 'No token');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ message: 'No se proporcionó token de acceso' });
    }

    console.log('🔑 JWT_SECRET available:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ Auth failed: User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'Token inválido' });
    }

    if (!user.isActive) {
      console.log('❌ Auth failed: User inactive:', user.email);
      return res.status(401).json({ message: 'Usuario desactivado' });
    }

    console.log('✅ Auth successful for user:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token inválido' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Flatten array if roles is passed as array
    const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

module.exports = { auth, authorize };