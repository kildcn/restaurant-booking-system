const express = require('express');
const { check } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserBookings
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes for administrators only
router.use(authorize('admin'));

// User CRUD operations
router.route('/')
  .get(getUsers)
  .post([
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be admin, manager, staff, or customer').isIn(['admin', 'manager', 'staff', 'customer']).optional()
  ], createUser);

router.route('/:id')
  .get(getUser)
  .put([
    check('name', 'Name is required').not().isEmpty().optional(),
    check('email', 'Please include a valid email').isEmail().optional(),
    check('phone', 'Phone number is required').not().isEmpty().optional(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }).optional(),
    check('role', 'Role must be admin, manager, staff, or customer').isIn(['admin', 'manager', 'staff', 'customer']).optional()
  ], updateUser)
  .delete(deleteUser);

// Get user bookings - accessible by admin or the user themselves
router.get('/:id/bookings', getUserBookings);

module.exports = router;
