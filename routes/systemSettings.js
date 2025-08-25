const express = require('express');
const router = express.Router();
const systemSettingController = require('../controllers/systemSettingController');

router.get('/', systemSettingController.getAllSettings);
router.get('/public', systemSettingController.getPublicSettings);
router.get('/key/:key', systemSettingController.getSettingByKey);
router.get('/category/:category', systemSettingController.getSettingsByCategory);
router.post('/', systemSettingController.upsertSetting);
router.delete('/:id', systemSettingController.deleteSetting);

module.exports = router;
