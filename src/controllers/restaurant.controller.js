const { validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');

// @desc    Get restaurant settings
// @route   GET /api/restaurant
// @access  Public
exports.getRestaurantSettings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create restaurant settings
// @route   POST /api/restaurant
// @access  Private/Admin
exports.createRestaurantSettings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if restaurant settings already exist
    const existingRestaurant = await Restaurant.findOne();
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant settings already exist. Use PUT to update.'
      });
    }

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update restaurant settings
// @route   PUT /api/restaurant
// @access  Private/Admin
exports.updateRestaurantSettings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Find and update restaurant settings
    const restaurant = await Restaurant.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update opening hours
// @route   PUT /api/restaurant/opening-hours
// @access  Private/Admin
exports.updateOpeningHours = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { openingHours } = req.body;

    // Find and update restaurant settings
    const restaurant = await Restaurant.findOneAndUpdate(
      {},
      { openingHours },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant.openingHours
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add special event
// @route   POST /api/restaurant/special-events
// @access  Private/Admin
exports.addSpecialEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const restaurant = await Restaurant.findOne();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    restaurant.specialEvents.push(req.body);
    await restaurant.save();

    res.status(201).json({
      success: true,
      data: restaurant.specialEvents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add closed date
// @route   POST /api/restaurant/closed-dates
// @access  Private/Admin
exports.addClosedDate = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const restaurant = await Restaurant.findOne();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    restaurant.closedDates.push(req.body);
    await restaurant.save();

    res.status(201).json({
      success: true,
      data: restaurant.closedDates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking rules
// @route   PUT /api/restaurant/booking-rules
// @access  Private/Admin
exports.updateBookingRules = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      {},
      { bookingRules: req.body },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant.bookingRules
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
