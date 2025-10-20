// Vercel Serverless Function - API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Remove /api prefix from the URL
  req.url = req.url.replace(/^\/api/, '');
  
  // If url becomes empty, set it to /
  if (!req.url || req.url === '') {
    req.url = '/';
  }
  
  return app(req, res);
};
