const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const { createEventValidator } = require('../validators/eventValidator');

router.use(protect);

router
  .route('/')
  .get(getEvents)
  .post(authorize('admin'), createEventValidator, createEvent);

router
  .route('/:id')
  .get(validateObjectId('id'), getEventById)
  .put(authorize('admin'), validateObjectId('id'), updateEvent)
  .delete(authorize('admin'), validateObjectId('id'), deleteEvent);

module.exports = router;
