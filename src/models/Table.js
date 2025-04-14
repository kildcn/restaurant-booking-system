const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Please add a table number or identifier'],
    trim: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify table capacity'],
    min: 1
  },
  section: {
    type: String,
    enum: ['indoor', 'outdoor', 'bar', 'private', 'window', 'other'],
    default: 'indoor'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isReservable: {
    type: Boolean,
    default: true
  },
  position: {
    x: Number,
    y: Number
  },
  shape: {
    type: String,
    enum: ['rectangle', 'round', 'square', 'custom'],
    default: 'rectangle'
  },
  dimensions: {
    width: Number,
    height: Number
  },
  attributes: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Table', TableSchema);
