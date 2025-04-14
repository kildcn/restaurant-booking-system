const { validationResult } = require('express-validator');
const Table = require('../models/Table');
const Booking = require('../models/Booking');
const bookingUtils = require('../utils/bookingUtils');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private/Admin/Staff
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort('tableNumber');

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private/Admin/Staff
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private/Admin
exports.createTable = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const table = await Table.create(req.body);

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private/Admin
exports.updateTable = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // If table is marked as inactive, update future bookings
    if (table.isActive === false) {
      // Find future bookings with this table
      const futureBookings = await Booking.find({
        tables: table._id,
        date: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      });

      // Update availability cache for affected dates
      if (futureBookings.length > 0) {
        const affectedDates = new Set();
        futureBookings.forEach(booking => {
          affectedDates.add(booking.date.toISOString().split('T')[0]);
        });

        for (const dateStr of affectedDates) {
          await bookingUtils.updateAvailabilityCache(new Date(dateStr));
        }
      }
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
exports.deleteTable = async (req, res) => {
  try {
    // Check if table has any bookings
    const hasBookings = await Booking.findOne({ tables: req.params.id });

    if (hasBookings) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table with associated bookings. Update the table to inactive instead.'
      });
    }

    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get table availability for a date
// @route   GET /api/tables/availability/:date
// @access  Private/Admin/Staff
exports.getTableAvailability = async (req, res) => {
  try {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    // Update availability cache for the date
    await bookingUtils.updateAvailabilityCache(date);

    // Get all tables with their availability
    const tables = await Table.find({ isActive: true });

    // Get bookings for the date
    const bookings = await Booking.find({
      date: { $eq: new Date(date.setHours(0, 0, 0, 0)) },
      status: { $in: ['pending', 'confirmed', 'seated'] }
    }).select('tables timeSlot.start timeSlot.end partySize customer.name');

    // Create availability map for each table
    const availability = tables.map(table => {
      const tableBookings = bookings.filter(booking =>
        booking.tables.some(t => t.toString() === table._id.toString())
      );

      return {
        tableId: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        section: table.section,
        bookings: tableBookings.map(booking => ({
          bookingId: booking._id,
          start: booking.timeSlot.start,
          end: booking.timeSlot.end,
          partySize: booking.partySize,
          customerName: booking.customer.name
        }))
      };
    });

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
