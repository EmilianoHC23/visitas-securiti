// Vercel Serverless Function - API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Ensure the URL starts with /api so it matches Express mount points
  // On Vercel, sometimes the function receives "/auth/login" (without /api)
  // and sometimes "/api/auth/login". Normalize to always include /api.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
