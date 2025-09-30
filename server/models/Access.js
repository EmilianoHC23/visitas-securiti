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
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  settings: {
    autoApproval: {
      type: Boolean,
      default: true
    },
    maxUses: {
      type: Number,
      default: 1
    },
    allowGuests: {
      type: Boolean,
      default: false
    },
    requireApproval: {
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
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  invitedEmails: [{
    email: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'opened', 'redeemed'],
      default: 'sent'
    }
  }]
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