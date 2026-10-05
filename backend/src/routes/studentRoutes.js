const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createStudentValidator,
  updateStudentValidator,
} = require('../validators/studentValidator');

// All student routes require authentication
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'teacher', 'parent'), getStudents)
  .post(authorize('admin'), createStudentValidator, createStudent);

router.get(
  '/class/:classId',
  authorize('admin', 'teacher'),
  validateObjectId('classId'),
  getStudentsByClass
);

router
  .route('/:id')
  .get(authorize('admin', 'teacher', 'parent'), validateObjectId('id'), getStudentById)
  .put(authorize('admin'), validateObjectId('id'), updateStudentValidator, updateStudent)
  .delete(authorize('admin'), validateObjectId('id'), deleteStudent);

module.exports = router;
