const express = require('express');
const router = express.Router();
const invoiceItemController = require('../controllers/invoiceItemController');

router.get('/', invoiceItemController.getAllInvoiceItems);
router.get('/:id', invoiceItemController.getInvoiceItemById);
router.get('/invoice/:invoiceId', invoiceItemController.getInvoiceItemsByInvoice);
router.post('/', invoiceItemController.createInvoiceItem);
router.put('/:id', invoiceItemController.updateInvoiceItem);
router.delete('/:id', invoiceItemController.deleteInvoiceItem);

module.exports = router;
