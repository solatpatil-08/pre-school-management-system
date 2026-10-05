const express = require('express');
const router = express.Router();
const {
  getParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
} = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const {
  createParentValidator,
  updateParentValidator,
} = require('../validators/parentValidator');

router.use(protect);

router
  .route('/')
  .get(authorize('admin'), getParents)
  .post(authorize('admin'), createParentValidator, createParent);

router
  .route('/:id')
  .get(authorize('admin', 'parent'), validateObjectId('id'), getParentById)
  .put(authorize('admin', 'parent'), validateObjectId('id'), updateParentValidator, updateParent)
  .delete(authorize('admin'), validateObjectId('id'), deleteParent);

module.exports = router;
