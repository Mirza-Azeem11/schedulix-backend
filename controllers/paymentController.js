const { Payment, Invoice } = require('../models');

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: [Invoice] });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, { include: [Invoice] });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get payments by invoice
exports.getPaymentsByInvoice = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { invoice_id: req.params.invoiceId },
      include: [Invoice]
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      payment_date: new Date(),
      status: 'Pending'
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    await payment.update(req.body);
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const { refund_amount, refund_reason } = req.body;
    await payment.update({
      status: 'Refunded',
      refund_amount,
      refund_date: new Date(),
      notes: refund_reason
    });

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    await payment.destroy();
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
