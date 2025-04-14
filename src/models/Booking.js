const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Please add customer name']
    },
    email: {
      type: String,
      required: [true, 'Please add customer email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please add customer phone number']
    }
  },
  partySize: {
    type: Number,
    required: [true, 'Please specify party size'],
    min: 1
  },
  date: {
    type: Date,
    required: [true, 'Please specify booking date']
  },
  timeSlot: {
    start: {
      type: Date,
      required: [true, 'Please specify booking start time']
    },
    end: {
      type: Date,
      required: [true, 'Please specify booking end time']
    }
  },
  duration: {
    type: Number,
    required: [true, 'Please specify booking duration in minutes'],
    min: 15
  },
  tables: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['online', 'phone', 'walk-in', 'manual', 'third-party'],
    default: 'online'
  },
  specialRequests: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
BookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
