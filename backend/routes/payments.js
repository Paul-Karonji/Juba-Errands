const express = require('express');
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

const createOrUpdatePayment = [
  body('shipmentId').optional().isInt(),
  body('payerAccountNo').optional().trim().isString(),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'M-Pesa', 'Bank', 'Card'])
    .withMessage('Invalid payment method'),
  body('amountPaid').optional().isFloat({ min: 0 })
];

// Helpful lookup by shipment (place before :id)
router.get('/shipment/:shipmentId', param('shipmentId').isInt(), paymentController.getByShipmentId);

// Generic CRUD
router.get('/', paymentController.getAll);
router.get('/:id', param('id').isInt(), paymentController.getById);
router.post('/', createOrUpdatePayment, paymentController.create);
router.put('/:id', param('id').isInt(), createOrUpdatePayment, paymentController.update);
router.delete('/:id', param('id').isInt(), paymentController.remove);

module.exports = router;
