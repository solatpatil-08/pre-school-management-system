const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createTeacherValidator,
  updateTeacherValidator,
} = require('../validators/teacherValidator');

// All teacher routes require authentication
router.use(protect);

// Current logged-in teacher profile shortcut
router.get('/me', authorize('admin', 'teacher'), (req, res, next) => {
  req.params.id = 'me';
  next();
}, getTeacherById);

router
  .route('/')
  .get(authorize('admin', 'teacher'), getTeachers)
  .post(authorize('admin'), createTeacherValidator, createTeacher);

router
  .route('/:id')
  .get(authorize('admin', 'teacher'), validateObjectId('id'), getTeacherById)
  .put(authorize('admin'), validateObjectId('id'), updateTeacherValidator, updateTeacher)
  .delete(authorize('admin'), validateObjectId('id'), deleteTeacher);

module.exports = router;
