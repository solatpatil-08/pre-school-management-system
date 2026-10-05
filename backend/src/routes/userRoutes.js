const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const { createUserValidator } = require('../validators/userValidator');

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(createUserValidator, createUser);

router
  .route('/:id')
  .get(validateObjectId('id'), getUserById)
  .put(validateObjectId('id'), updateUser)
  .delete(validateObjectId('id'), deleteUser);

module.exports = router;
