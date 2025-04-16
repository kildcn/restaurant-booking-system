const express = require('express');
const { check } = require('express-validator');
const {
  checkAvailability,
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  lookupBooking
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post(
  '/check-availability',
  [
    check('date', 'Valid date is required').isISO8601().toDate(),
    check('time', 'Valid time is required in format HH:MM').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check('partySize', 'Party size must be a number').isNumeric()
  ],
  checkAvailability
);

// Add the booking lookup route (must be before protect middleware)
router.post(
  '/lookup',
  [
    check('reference', 'Reference number is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail()
  ],
  lookupBooking
);

// Booking creation can be done by anyone, but with restrictions for non-authenticated users
router.post(
  '/',
  [
    check('customerName', 'Customer name is required').not().isEmpty(),
    check('customerEmail', 'Valid email is required').isEmail(),
    check('customerPhone', 'Phone number is required').not().isEmpty(),
    check('partySize', 'Party size must be a number').isNumeric(),
    check('date', 'Valid date is required').isISO8601().toDate(),
    check('time', 'Valid time is required in format HH:MM').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  ],
  createBooking
);

// Protected routes
router.use(protect);

// Get all bookings - Admin/Staff can see all, customers see only their own
router.get('/', getBookings);

// Get, update, delete specific booking
router.route('/:id')
  .get(getBooking)
  .put([
    check('customerName', 'Customer name is required').not().isEmpty().optional(),
    check('customerEmail', 'Valid email is required').isEmail().optional(),
    check('customerPhone', 'Phone number is required').not().isEmpty().optional(),
    check('partySize', 'Party size must be a number').isNumeric().optional(),
    check('date', 'Valid date is required').isISO8601().toDate().optional(),
    check('time', 'Valid time is required in format HH:MM').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
  ], updateBooking)
  .delete(deleteBooking);

// Update booking status (admin/staff only)
router.put(
  '/:id/status',
  authorize('admin', 'manager', 'staff'),
  [
    check('status', 'Status is required').isIn([
      'pending',
      'confirmed',
      'seated',
      'completed',
      'cancelled',
      'no-show'
    ])
  ],
  updateBookingStatus
);

module.exports = router;
