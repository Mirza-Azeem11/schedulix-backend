const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.get('/invoice/:invoiceId', paymentController.getPaymentsByInvoice);
router.post('/', paymentController.processPayment);
router.put('/:id', paymentController.updatePayment);
router.put('/:id/refund', paymentController.refundPayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
