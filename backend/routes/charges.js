const express = require('express');
const { body, param } = require('express-validator');
const chargeController = require('../controllers/chargeController');

const router = express.Router();

// Charges are associated with a shipment
const createOrUpdateCharges = [
  body('shipmentId').optional().isInt(),
  body('base').optional().isFloat({ min: 0 }),
  body('insurance').optional().isFloat({ min: 0 }),
  body('extraDelivery').optional().isFloat({ min: 0 }),
  body('vat').optional().isFloat({ min: 0 }),
  body('total').optional().isFloat({ min: 0 })
];

// Helpful lookups first (avoid being swallowed by :id)
router.get('/shipment/:shipmentId', param('shipmentId').isInt(), chargeController.getByShipmentId);

// Generic CRUD
router.get('/', chargeController.getAll);
router.get('/:id', param('id').isInt(), chargeController.getById);
router.post('/', createOrUpdateCharges, chargeController.create);
router.put('/:id', param('id').isInt(), createOrUpdateCharges, chargeController.update);
router.delete('/:id', param('id').isInt(), chargeController.remove);

module.exports = router;
