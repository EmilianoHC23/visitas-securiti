const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  identifierType: {
    type: String,
    enum: ['email', 'document', 'phone'],
    default: 'email'
  },
  identifier: {
    type: String,
    required: true,
    trim: true
  },
  visitorName: {
    type: String,
    trim: true,
    required: true
  },
  photo: {
    type: String // Base64 encoded image
  },
  // Mantener campos legacy para compatibilidad
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices compuestos para búsquedas rápidas optimizadas
blacklistSchema.index({ identifier: 1, companyId: 1, isActive: 1 });
blacklistSchema.index({ email: 1, companyId: 1, isActive: 1 }); // Legacy
// Índice adicional para consultas batch
blacklistSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Blacklist', blacklistSchema);