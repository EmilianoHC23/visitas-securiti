const mongoose = require('mongoose');

const accessSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['reunion', 'proyecto', 'evento', 'visita', 'otro'],
    default: 'reunion',
    required: true
  },
  creatorId: {
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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
    },
    enablePreRegistration: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'finalized'],
    default: 'active'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notifyUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitedUsers: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    invitationToken: {
      type: String,
      default: ''
    },
    invitationTokenCreatedAt: {
      type: Date
    },
    qrCode: {
      type: String,
      default: ''
    },
    attendanceStatus: {
      type: String,
      enum: ['pendiente', 'confirmo', 'asistio', 'no-asistio'],
      default: 'pendiente'
    },
    checkInTime: {
      type: Date
    },
    addedViaPreRegistration: {
      type: Boolean,
      default: false
    }
  }],
  additionalInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual getter para acceder fácilmente a noExpiration
accessSchema.virtual('noExpiration').get(function() {
  return this.settings?.noExpiration || false;
});

// Generar código único antes de guardar
accessSchema.pre('save', function(next) {
  if (!this.accessCode) {
    this.accessCode = `ACC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Access', accessSchema);