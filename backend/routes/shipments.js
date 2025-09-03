const express = require('express');
const { body, param, query } = require('express-validator');
const shipmentController = require('../controllers/shipmentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createShipmentValidation = [
  body('sender.name').notEmpty().withMessage('Sender name is required'),
  body('receiver.name').notEmpty().withMessage('Receiver name is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('weightKg').isFloat({ min: 0.1 }).withMessage('Weight must be a positive number'),
  body('description').notEmpty().withMessage('Description is required'),
  body('status').isIn(['Pending', 'In Transit', 'Delivered', 'Cancelled']).withMessage('Invalid status')
];

const updateShipmentValidation = [
  param('id').isInt().withMessage('Invalid shipment ID'),
  body('quantity').optional().isInt({ min: 1 }),
  body('weightKg').optional().isFloat({ min: 0.1 }),
  body('status').optional().isIn(['Pending', 'In Transit', 'Delivered', 'Cancelled'])
];

// Routes
router.get('/', shipmentController.getAllShipments);
router.get('/:id', param('id').isInt(), shipmentController.getShipmentById);
router.get('/waybill/:waybillNo', shipmentController.getByWaybillNumber);
router.post('/', createShipmentValidation, shipmentController.createShipment);
router.put('/:id', updateShipmentValidation, shipmentController.updateShipment);
router.delete('/:id', param('id').isInt(), shipmentController.deleteShipment);

module.exports = router;