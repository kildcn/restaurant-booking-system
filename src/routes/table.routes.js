const express = require('express');
const { check } = require('express-validator');
const {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  getTableAvailability
} = require('../controllers/table.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Only staff and admin can access tables
router.use(authorize('admin', 'manager', 'staff'));

// Get table availability for a date
router.get('/availability/:date', getTableAvailability);

// Table CRUD operations
router.route('/')
  .get(getTables)
  .post([
    check('tableNumber', 'Table number is required').not().isEmpty(),
    check('capacity', 'Capacity must be a number greater than 0').isInt({ min: 1 }),
    check('section', 'Section must be a valid option').isIn(['indoor', 'outdoor', 'bar', 'private', 'window', 'other']).optional()
  ], createTable);

router.route('/:id')
  .get(getTable)
  .put([
    check('tableNumber', 'Table number is required').not().isEmpty().optional(),
    check('capacity', 'Capacity must be a number greater than 0').isInt({ min: 1 }).optional(),
    check('section', 'Section must be a valid option').isIn(['indoor', 'outdoor', 'bar', 'private', 'window', 'other']).optional(),
    check('isActive', 'isActive must be a boolean').isBoolean().optional(),
    check('isReservable', 'isReservable must be a boolean').isBoolean().optional()
  ], updateTable)
  .delete(authorize('admin'), deleteTable);

module.exports = router;
