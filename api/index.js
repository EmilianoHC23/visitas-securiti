// Vercel Serverless Function - Main API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = async (req, res) => {
  // Log para debug en Vercel
  console.log('🔍 API Handler - Original URL:', req.url);
  console.log('🔍 API Handler - Method:', req.method);
  console.log('🔍 API Handler - Path:', req.path);
  
  // Asegurarnos de que la URL tenga el prefijo /api
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  
  console.log('✅ API Handler - Final URL:', req.url);
  
  // Pasar la petición a Express
  return app(req, res);
};
