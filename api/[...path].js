// Vercel Serverless Function - API Handler
// This file handles all /api/* requests

const app = require('../backend/src/index');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Do NOT strip the /api prefix because Express mounts routes under /api/*
  // Forward the request as-is so paths like /api/auth/login match correctly
  return app(req, res);
};
