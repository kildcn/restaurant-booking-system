const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  openingHours: [{
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    }, // 0-6 for Sunday-Saturday
    open: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use format HH:MM']
    },
    close: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use format HH:MM']
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  maxCapacity: {
    type: Number,
    required: [true, 'Please specify maximum restaurant capacity']
  },
  bookingRules: {
    timeSlotDuration: {
      type: Number,
      default: 30,
      min: 15,
      max: 240
    }, // in minutes
    minAdvanceBooking: {
      type: Number,
      default: 60,
      min: 0
    }, // in minutes
    maxAdvanceBooking: {
      type: Number,
      default: 30,
      min: 1
    }, // in days
    maxDuration: {
      type: Number,
      default: 120,
      min: 30
    }, // maximum booking duration in minutes
    bufferBetweenBookings: {
      type: Number,
      default: 15,
      min: 0
    }, // in minutes
    maxPartySize: {
      type: Number,
      default: 10,
      min: 1
    }, // Maximum party size for online bookings
    maxCapacityThreshold: {
      type: Number,
      default: 90,
      min: 1,
      max: 100
    }, // Percentage of capacity allowed to be booked (e.g., 90%)
    allowedPartySizes: {
      min: {
        type: Number,
        default: 1,
        min: 1
      },
      max: {
        type: Number,
        default: 10,
        min: 1
      }
    }
  },
  closedDates: [{
    date: {
      type: Date,
      required: true
    },
    reason: String
  }],
  specialEvents: [{
    name: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    customOpeningHours: {
      open: String,
      close: String
    },
    customCapacity: Number,
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
