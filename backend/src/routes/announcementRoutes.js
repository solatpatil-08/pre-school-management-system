const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../validators/commonValidators');
const { createAnnouncementValidator } = require('../validators/announcementValidator');

router.use(protect);

router
  .route('/')
  .get(getAnnouncements)
  .post(authorize('admin'), createAnnouncementValidator, createAnnouncement);

router.patch(
  '/:id/publish',
  authorize('admin'),
  validateObjectId('id'),
  publishAnnouncement
);

router
  .route('/:id')
  .get(validateObjectId('id'), getAnnouncementById)
  .put(authorize('admin'), validateObjectId('id'), updateAnnouncement)
  .delete(authorize('admin'), validateObjectId('id'), deleteAnnouncement);

module.exports = router;
