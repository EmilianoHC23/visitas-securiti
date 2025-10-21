// Vercel Serverless Function - API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = async (req, res) => {
  // Log para debug
  console.log('🔍 Vercel Handler - Original URL:', req.url);
  console.log('🔍 Vercel Handler - Method:', req.method);
  
  // Normalize URL to exactly one /api prefix so it matches Express mount points
  // Vercel ya nos da la URL sin el /api, así que necesitamos agregarlo
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  } else {
    // Si ya tiene /api, asegurarnos de que no esté duplicado
    req.url = req.url.replace(/^\/api(?:\/api)+/, '/api');
  }
  
  console.log('✅ Vercel Handler - Normalized URL:', req.url);
  
  return app(req, res);
};
