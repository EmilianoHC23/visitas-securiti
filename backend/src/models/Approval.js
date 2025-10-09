const mongoose = require('mongoose');
const crypto = require('crypto');

const approvalSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'decided'], default: 'pending' },
  decision: { type: String, enum: ['approved', 'rejected', null], default: null },
    decidedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

  // Index for cleanup and performance
  approvalSchema.index({ expiresAt: 1 });
  approvalSchema.index({ token: 1, status: 1 });

approvalSchema.statics.generateToken = function() {
  return crypto.randomBytes(24).toString('hex');
};

  approvalSchema.statics.createWithExpiry = function(visitId, hostId, hoursToExpire = 48) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + hoursToExpire * 60 * 60 * 1000);
    return new this({ visitId, hostId, token, expiresAt });
  };

  approvalSchema.methods.isExpired = function() {
    return this.expiresAt < new Date();
  };

module.exports = mongoose.model('Approval', approvalSchema);
