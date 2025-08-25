const { InvoiceItem, Invoice } = require('../models');

// Get all invoice items
exports.getAllInvoiceItems = async (req, res) => {
  try {
    const invoiceItems = await InvoiceItem.findAll({ include: [Invoice] });
    res.json({ success: true, data: invoiceItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get invoice item by ID
exports.getInvoiceItemById = async (req, res) => {
  try {
    const invoiceItem = await InvoiceItem.findByPk(req.params.id, { include: [Invoice] });
    if (!invoiceItem) return res.status(404).json({ success: false, message: 'Invoice item not found' });
    res.json({ success: true, data: invoiceItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get invoice items by invoice ID
exports.getInvoiceItemsByInvoice = async (req, res) => {
  try {
    const invoiceItems = await InvoiceItem.findAll({
      where: { invoice_id: req.params.invoiceId },
      include: [Invoice]
    });
    res.json({ success: true, data: invoiceItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create invoice item
exports.createInvoiceItem = async (req, res) => {
  try {
    const invoiceItem = await InvoiceItem.create(req.body);
    res.status(201).json({ success: true, data: invoiceItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update invoice item
exports.updateInvoiceItem = async (req, res) => {
  try {
    const invoiceItem = await InvoiceItem.findByPk(req.params.id);
    if (!invoiceItem) return res.status(404).json({ success: false, message: 'Invoice item not found' });
    await invoiceItem.update(req.body);
    res.json({ success: true, data: invoiceItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete invoice item
exports.deleteInvoiceItem = async (req, res) => {
  try {
    const invoiceItem = await InvoiceItem.findByPk(req.params.id);
    if (!invoiceItem) return res.status(404).json({ success: false, message: 'Invoice item not found' });
    await invoiceItem.destroy();
    res.json({ success: true, message: 'Invoice item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
