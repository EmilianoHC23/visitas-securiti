const mongoose = require('mongoose');

const visitEventSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  type: { type: String, enum: ['check-in', 'check-out', 'check-out-qr'], required: true },
  photos: { type: [String], default: [] },
  timestamp: { type: Date, default: () => new Date() }
}, { timestamps: true });

visitEventSchema.index({ visitId: 1, type: 1, timestamp: 1 });

module.exports = mongoose.model('VisitEvent', visitEventSchema);
