// Vercel Serverless Function - API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Normalize URL to exactly one /api prefix so it matches Express mount points
  // Cases seen on Vercel:
  //  - "/auth/login" (missing /api)
  //  - "/api/auth/login" (correct)
  //  - "/api/api/auth/login" (duplicated)
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  } else {
    req.url = req.url.replace(/^\/api(?:\/api)+/, '/api');
  }
  return app(req, res);
};
