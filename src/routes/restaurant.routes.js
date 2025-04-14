const express = require('express');
const { check } = require('express-validator');
const {
  getRestaurantSettings,
  createRestaurantSettings,
  updateRestaurantSettings,
  updateOpeningHours,
  addSpecialEvent,
  addClosedDate,
  updateBookingRules
} = require('../controllers/restaurant.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getRestaurantSettings);

// Protected routes
router.use(protect);

// Admin only routes
router.post(
  '/',
  authorize('admin'),
  [
    check('name', 'Restaurant name is required').not().isEmpty(),
    check('maxCapacity', 'Maximum capacity is required').isNumeric()
  ],
  createRestaurantSettings
);

router.put(
  '/',
  authorize('admin', 'manager'),
  [
    check('name', 'Restaurant name is required').not().isEmpty().optional(),
    check('maxCapacity', 'Maximum capacity must be a number').isNumeric().optional()
  ],
  updateRestaurantSettings
);

router.put(
  '/opening-hours',
  authorize('admin', 'manager'),
  [
    check('openingHours', 'Opening hours are required').isArray(),
    check('openingHours.*.day', 'Day must be between 0 and 6').isInt({ min: 0, max: 6 }),
    check('openingHours.*.open', 'Open time must be in format HH:MM').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check('openingHours.*.close', 'Close time must be in format HH:MM').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  ],
  updateOpeningHours
);

router.post(
  '/special-events',
  authorize('admin', 'manager'),
  [
    check('name', 'Event name is required').not().isEmpty(),
    check('date', 'Valid date is required').isISO8601().toDate()
  ],
  addSpecialEvent
);

router.post(
  '/closed-dates',
  authorize('admin', 'manager'),
  [
    check('date', 'Valid date is required').isISO8601().toDate(),
    check('reason', 'Reason is required').not().isEmpty()
  ],
  addClosedDate
);

router.put(
  '/booking-rules',
  authorize('admin', 'manager'),
  [
    check('timeSlotDuration', 'Time slot duration must be a number').isNumeric().optional(),
    check('minAdvanceBooking', 'Minimum advance booking time must be a number').isNumeric().optional(),
    check('maxAdvanceBooking', 'Maximum advance booking days must be a number').isNumeric().optional(),
    check('maxDuration', 'Maximum booking duration must be a number').isNumeric().optional(),
    check('bufferBetweenBookings', 'Buffer time must be a number').isNumeric().optional(),
    check('maxPartySize', 'Maximum party size must be a number').isNumeric().optional()
  ],
  updateBookingRules
);

module.exports = router;
