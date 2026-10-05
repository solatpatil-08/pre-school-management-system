const express = require('express');
const router = express.Router();
const {
  getSchedules,
  getScheduleById,
  getSchedulesByClass,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createScheduleValidator,
  updateScheduleValidator,
} = require('../validators/scheduleValidator');

router.use(protect);

router
  .route('/')
  .get(getSchedules)
  .post(authorize('admin'), createScheduleValidator, createSchedule);

router.get(
  '/class/:classId',
  validateObjectId('classId'),
  getSchedulesByClass
);

router
  .route('/:id')
  .get(validateObjectId('id'), getScheduleById)
  .put(authorize('admin'), validateObjectId('id'), updateScheduleValidator, updateSchedule)
  .delete(authorize('admin'), validateObjectId('id'), deleteSchedule);

module.exports = router;
