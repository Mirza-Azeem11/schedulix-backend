const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);
router.get('/user/:userId', notificationController.getNotificationsByUser);
router.post('/', notificationController.createNotification);
router.put('/:id/read', notificationController.markAsRead);
router.put('/user/:userId/read-all', notificationController.markAllAsReadForUser);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
