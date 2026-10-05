const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createClassValidator,
  updateClassValidator,
} = require('../validators/classValidator');

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'teacher', 'parent'), getClasses)
  .post(authorize('admin'), createClassValidator, createClass);

router
  .route('/:id')
  .get(authorize('admin', 'teacher', 'parent'), validateObjectId('id'), getClassById)
  .put(authorize('admin'), validateObjectId('id'), updateClassValidator, updateClass)
  .delete(authorize('admin'), validateObjectId('id'), deleteClass);

module.exports = router;
