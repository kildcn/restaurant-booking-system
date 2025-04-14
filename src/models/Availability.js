const mongoose = require('mongoose');

// This model caches availability data for quick lookups
const AvailabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  availableSlots: [{
    start: Date,
    end: Date
  }],
  blockedSlots: [{
    start: Date,
    end: Date,
    reason: {
      type: String,
      enum: ['booking', 'maintenance', 'event', 'closed', 'other'],
      default: 'booking'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for faster lookups
AvailabilitySchema.index({ date: 1, tableId: 1 }, { unique: true });

// Update lastUpdated timestamp on save
AvailabilitySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
