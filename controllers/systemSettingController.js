const { SystemSetting } = require('../models');

// Get all system settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get public settings only
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({ where: { is_public: true } });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ where: { setting_key: req.params.key } });
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get settings by category
exports.getSettingsByCategory = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({ where: { category: req.params.category } });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create or update setting
exports.upsertSetting = async (req, res) => {
  try {
    const { setting_key } = req.body;
    const [setting, created] = await SystemSetting.upsert({
      ...req.body,
      updated_by: req.user?.id
    });

    res.status(created ? 201 : 200).json({
      success: true,
      data: setting,
      message: created ? 'Setting created' : 'Setting updated'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
  try {
    const setting = await SystemSetting.findByPk(req.params.id);
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    await setting.destroy();
    res.json({ success: true, message: 'Setting deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
