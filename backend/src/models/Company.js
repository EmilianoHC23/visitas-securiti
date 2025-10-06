const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  settings: {
    autoApproval: {
      type: Boolean,
      default: false
    },
    requirePhoto: {
      type: Boolean,
      default: true
    },
    enableSelfRegister: {
      type: Boolean,
      default: true
    },
    notificationEmail: {
      type: String,
      default: null
    }
  },
  qrCode: {
    type: String,
    unique: true,
    default: function() {
      return `QR_${this.companyId}_${Date.now()}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);