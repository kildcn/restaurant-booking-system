const { validationResult } = require('express-validator');
const moment = require('moment');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const bookingUtils = require('../utils/bookingUtils');

// @desc    Check availability for a booking
// @route   POST /api/bookings/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { date, time, duration, partySize } = req.body;

    // Calculate start and end times
    const dateStr = moment(date).format('YYYY-MM-DD');
    const startTime = moment(`${dateStr} ${time}`).toDate();
    const endTime = moment(`${dateStr} ${time}`).add(duration || 120, 'minutes').toDate();

    // Check if restaurant is open
    const restaurantStatus = await bookingUtils.checkRestaurantOpen(
      moment(date).toDate(),
      startTime,
      endTime
    );

    if (!restaurantStatus.isOpen) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: restaurantStatus.reason
      });
    }

    // Check table availability
    const isStaff = req.user && ['admin', 'manager', 'staff'].includes(req.user.role);
    const availability = await bookingUtils.findAvailableTables(
      moment(date).toDate(),
      startTime,
      endTime,
      partySize,
      isStaff
    );

    return res.status(200).json({
      success: true,
      available: availability.available,
      reason: availability.reason,
      tables: availability.available ? availability.tables.map(t => ({
        id: t._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        section: t.section
      })) : []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public/Private
exports.createBooking = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      partySize,
      date,
      time,
      duration,
      tableIds,
      specialRequests
    } = req.body;

    // Calculate start and end times
    const dateStr = moment(date).format('YYYY-MM-DD');
    const startTime = moment(`${dateStr} ${time}`).toDate();
    const endTime = moment(`${dateStr} ${time}`).add(duration || 120, 'minutes').toDate();

    // If the user is not authenticated or is a customer, validate booking constraints
    const isStaff = req.user && ['admin', 'manager', 'staff'].includes(req.user.role);

    if (!isStaff) {
      // Check if restaurant is open
      const restaurantStatus = await bookingUtils.checkRestaurantOpen(
        moment(date).toDate(),
        startTime,
        endTime
      );

      if (!restaurantStatus.isOpen) {
        return res.status(400).json({
          success: false,
          message: restaurantStatus.reason
        });
      }

      // Validate party size against restaurant rules
      const restaurant = await Restaurant.findOne();
      if (partySize > restaurant.bookingRules.maxPartySize) {
        return res.status(400).json({
          success: false,
          message: `Online booking is limited to parties of ${restaurant.bookingRules.maxPartySize} or fewer. Please contact the restaurant directly.`
        });
      }

      // Check table availability
      const availability = await bookingUtils.findAvailableTables(
        moment(date).toDate(),
        startTime,
        endTime,
        partySize,
        false
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason
        });
      }

      // If tableIds are provided, validate they are actually available
      if (tableIds && tableIds.length > 0) {
        const requestedTableIds = new Set(tableIds);
        const availableTableIds = new Set(availability.tables.map(t => t._id.toString()));

        for (const tableId of requestedTableIds) {
          if (!availableTableIds.has(tableId)) {
            return res.status(400).json({
              success: false,
              message: 'One or more selected tables are not available'
            });
          }
        }
      }
    }

    // For staff bookings or if no specific tables are requested, assign tables automatically
    let assignedTableIds;
    if (!tableIds || tableIds.length === 0) {
      // If we've already checked availability for customers, use those tables
      if (!isStaff) {
        const availability = await bookingUtils.findAvailableTables(
          moment(date).toDate(),
          startTime,
          endTime,
          partySize,
          false
        );
        assignedTableIds = availability.tables.map(t => t._id);
      } else {
        // For staff bookings, find available tables without constraints
        const availability = await bookingUtils.findAvailableTables(
          moment(date).toDate(),
          startTime,
          endTime,
          partySize,
          true
        );
        assignedTableIds = availability.tables.map(t => t._id);
      }
    } else {
      assignedTableIds = tableIds;
    }

    // Create booking
    const bookingData = {
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      partySize,
      date: moment(date).startOf('day').toDate(),
      timeSlot: {
        start: startTime,
        end: endTime
      },
      duration: duration || 120,
      tables: assignedTableIds,
      specialRequests,
      status: isStaff ? 'confirmed' : 'pending',
      source: isStaff ? 'manual' : 'online',
      createdBy: req.user ? req.user.id : null
    };

    // If user is logged in, associate booking with user
    if (req.user) {
      bookingData.customer.userId = req.user.id;
    }

    const booking = await Booking.create(bookingData);

    // Update availability cache
    await bookingUtils.updateAvailabilityCache(moment(date).toDate());

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin/Staff
exports.getBookings = async (req, res) => {
  try {
    let query = {};

    // Filter by date if provided
    if (req.query.date) {
      const date = moment(req.query.date).startOf('day').toDate();
      query.date = date;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // For customers, only show their own bookings
    if (req.user.role === 'customer') {
      query['customer.userId'] = req.user.id;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate('tables', 'tableNumber capacity section')
      .sort({ 'timeSlot.start': 1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tables');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure the user has admin/staff permissions or is the booking owner
    if (
      req.user.role === 'customer' &&
      (!booking.customer.userId || booking.customer.userId.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    if (
      req.user.role === 'customer' &&
      (!booking.customer.userId || booking.customer.userId.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // If updating date, time, or tables, check availability unless staff
    if ((req.body.date || req.body.time || req.body.tableIds) && req.user.role === 'customer') {
      const isStaff = ['admin', 'manager', 'staff'].includes(req.user.role);

      // Calculate new date and time if being updated
      const dateStr = req.body.date
        ? moment(req.body.date).format('YYYY-MM-DD')
        : moment(booking.date).format('YYYY-MM-DD');

      const timeStr = req.body.time || moment(booking.timeSlot.start).format('HH:mm');

      const startTime = moment(`${dateStr} ${timeStr}`).toDate();
      const duration = req.body.duration ||
        moment(booking.timeSlot.end).diff(moment(booking.timeSlot.start), 'minutes');
      const endTime = moment(`${dateStr} ${timeStr}`).add(duration, 'minutes').toDate();

      // Check restaurant open status
      const restaurantStatus = await bookingUtils.checkRestaurantOpen(
        moment(dateStr).toDate(),
        startTime,
        endTime
      );

      if (!restaurantStatus.isOpen) {
        return res.status(400).json({
          success: false,
          message: restaurantStatus.reason
        });
      }

      // Check availability of tables
      const partySize = req.body.partySize || booking.partySize;
      const availability = await bookingUtils.findAvailableTables(
        moment(dateStr).toDate(),
        startTime,
        endTime,
        partySize,
        isStaff
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason
        });
      }
    }

    // Update the booking
    const updateData = { ...req.body };

    // Update nested fields if provided
    if (req.body.customerName) updateData['customer.name'] = req.body.customerName;
    if (req.body.customerEmail) updateData['customer.email'] = req.body.customerEmail;
    if (req.body.customerPhone) updateData['customer.phone'] = req.body.customerPhone;

    // Update timeSlot if date or time is provided
    if (req.body.date || req.body.time) {
      const dateStr = req.body.date
        ? moment(req.body.date).format('YYYY-MM-DD')
        : moment(booking.date).format('YYYY-MM-DD');

      const timeStr = req.body.time || moment(booking.timeSlot.start).format('HH:mm');

      const startTime = moment(`${dateStr} ${timeStr}`).toDate();
      const duration = req.body.duration ||
        moment(booking.timeSlot.end).diff(moment(booking.timeSlot.start), 'minutes');
      const endTime = moment(`${dateStr} ${timeStr}`).add(duration, 'minutes').toDate();

      updateData.timeSlot = {
        start: startTime,
        end: endTime
      };

      if (req.body.date) {
        updateData.date = moment(req.body.date).startOf('day').toDate();
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Update availability cache for both the original date and new date if changed
    await bookingUtils.updateAvailabilityCache(booking.date);
    if (req.body.date && req.body.date !== booking.date) {
      await bookingUtils.updateAvailabilityCache(moment(req.body.date).toDate());
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin/Staff
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update availability cache if status changes to cancelled or no-show
    if (status === 'cancelled' || status === 'no-show') {
      await bookingUtils.updateAvailabilityCache(booking.date);
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions - customers can only delete their own bookings
    if (
      req.user.role === 'customer' &&
      (!booking.customer.userId || booking.customer.userId.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this booking'
      });
    }

    const bookingDate = booking.date;

    // Using deleteOne instead of remove
    await Booking.deleteOne({ _id: req.params.id });

    // Update availability cache
    await bookingUtils.updateAvailabilityCache(bookingDate);

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
