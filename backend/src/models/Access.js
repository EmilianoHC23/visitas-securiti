const mongoose = require('mongoose');

const accessSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['reunion', 'proyecto', 'evento', 'visita', 'otro'],
    default: 'reunion'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  accessCode: {
    type: String,
    unique: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  eventImage: {
    type: String, // Base64 o URL
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  settings: {
    autoApproval: {
      type: Boolean,
      default: true
    },
    maxUses: {
      type: Number,
      default: 0 // 0 = ilimitado
    },
    allowGuests: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    sendAccessByEmail: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    noExpiration: {
      type: Boolean,
      default: false
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'finalized'],
    default: 'active'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  notifyUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitedUsers: [{
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    attendance: {
      type: String,
      enum: ['pendiente', 'asistio', 'no-asistio'],
      default: 'pendiente'
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },
    qrScannedAt: Date
  }],
  additionalInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generar código único antes de guardar
accessSchema.pre('save', function(next) {
  if (!this.accessCode) {
    this.accessCode = `ACC_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  if (!this.qrCode) {
    this.qrCode = `QR_${this.accessCode}`;
  }
  next();
});

module.exports = mongoose.model('Access', accessSchema);