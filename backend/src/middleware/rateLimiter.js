const rateLimit = require('express-rate-limit');

// Rate limiter for login endpoint - prevents brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (only count failed ones)
  skipSuccessfulRequests: false,
  // Validate X-Forwarded-For header (for Vercel/production)
  validate: { xForwardedForHeader: false },
  // Custom handler
  handler: (req, res) => {
    res.status(429).json({
      message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// General API rate limiter - prevents DoS attacks
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

// Strict limiter for sensitive operations (password reset, account creation, etc.)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: 'Demasiadas solicitudes. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

module.exports = {
  loginLimiter,
  apiLimiter,
  strictLimiter
};
