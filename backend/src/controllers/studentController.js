const studentService = require('../services/studentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all students with query filters, search, pagination, and role-based scoping
 * @route   GET /api/students
 * @access  Private (Admin, Teacher, Parent)
 */
const getStudents = asyncHandler(async (req, res) => {
  const result = await studentService.getAllStudents(req.user, req.query);

  return ApiResponse.success(res, {
    message: 'Students retrieved successfully',
    data: {
      ...result,
      data: result.students,
    },
  });
});

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private (Admin, Teacher, Parent)
 */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id, req.user);

  return ApiResponse.success(res, {
    message: 'Student record retrieved successfully',
    data: {
      student,
      data: student,
    },
  });
});

/**
 * @desc    Create new student
 * @route   POST /api/students
 * @access  Private (Admin)
 */
const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);

  return ApiResponse.created(res, {
    message: 'Student registered successfully',
    data: {
      student,
      data: student,
    },
  });
});

/**
 * @desc    Update student details
 * @route   PUT /api/students/:id
 * @access  Private (Admin)
 */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);

  return ApiResponse.success(res, {
    message: 'Student record updated successfully',
    data: {
      student,
      data: student,
    },
  });
});

/**
 * @desc    Delete student
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const result = await studentService.deleteStudent(req.params.id);

  return ApiResponse.success(res, {
    message: result.message,
  });
});

/**
 * @desc    Get students in a specific class
 * @route   GET /api/students/class/:classId
 * @access  Private (Admin, Teacher)
 */
const getStudentsByClass = asyncHandler(async (req, res) => {
  const students = await studentService.getStudentsByClass(req.params.classId, req.user);

  return ApiResponse.success(res, {
    message: 'Class students retrieved successfully',
    data: {
      students,
      data: students,
    },
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
};
