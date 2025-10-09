const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  visitorName: {
    type: String,
    required: true,
    trim: true
  },
  visitorCompany: {
    type: String,
    required: true,
    trim: true
  },
  visitorPhoto: {
    type: String,
    default: null
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    default: 'SecurITI',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'checked-in', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  visitType: {
    type: String,
    enum: ['spontaneous', 'pre-registered', 'access-code'],
    default: 'spontaneous'
  },
  accessCode: {
    type: String,
    default: null
  },
  accessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Access',
    default: null
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  companyId: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  checkOutPhotos: [{
    type: String,
    default: []
  }],
  approvalDecision: {
    type: String,
    enum: ['approved', 'rejected', null],
    default: null
  },
  approvalTimestamp: {
    type: Date,
    default: null
  },
  approvalNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
}, {
  timestamps: true
});

// Index for better query performance
visitSchema.index({ scheduledDate: 1, status: 1 });
visitSchema.index({ host: 1, scheduledDate: 1 });
visitSchema.index({ companyId: 1, scheduledDate: 1 });

// Transform to JSON
visitSchema.methods.toJSON = function() {
  const visitObject = this.toObject();
  visitObject._id = visitObject._id.toString();
  if (visitObject.host && visitObject.host._id) {
    visitObject.host._id = visitObject.host._id.toString();
  }
  return visitObject;
};

module.exports = mongoose.model('Visit', visitSchema);