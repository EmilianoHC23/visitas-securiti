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
  location: {
    street: {
      type: String,
      default: ''
    },
    colony: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    googleMapsUrl: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: null
    },
    arrivalInstructions: {
      type: String,
      default: ''
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  additionalInfo: {
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  settings: {
    autoApproval: {
      type: Boolean,
      default: false
    },
    autoCheckIn: {
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