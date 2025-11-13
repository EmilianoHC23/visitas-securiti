/**
 * Logger utility - Only logs in development mode
 * Prevents sensitive data exposure in production logs
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log without sensitive details
      console.error('[ERROR]', new Date().toISOString());
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  // Always log these critical events even in production (but sanitized)
  security: (message, metadata = {}) => {
    console.log('[SECURITY]', message, isDevelopment ? metadata : '');
  },
  
  audit: (action, userId, metadata = {}) => {
    console.log('[AUDIT]', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment ? metadata : {})
    });
  }
};

module.exports = logger;
