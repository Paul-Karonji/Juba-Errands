const { body, validationResult } = require('express-validator');

// Sender validation
const senderValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('telephone').trim().notEmpty().withMessage('Telephone is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('idPassportNo').optional().trim(),
  body('companyName').optional().trim(),
  body('buildingFloor').optional().trim(),
  body('streetAddress').optional().trim(),
  body('estateTown').optional().trim()
];

// Receiver validation
const receiverValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('telephone').trim().notEmpty().withMessage('Telephone is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('idPassportNo').optional().trim(),
  body('companyName').optional().trim(),
  body('buildingFloor').optional().trim(),
  body('streetAddress').optional().trim(),
  body('estateTown').optional().trim()
];

// Shipment validation
const shipmentValidation = [
  body('sender.name').trim().notEmpty().withMessage('Sender name is required'),
  body('sender.telephone').trim().notEmpty().withMessage('Sender telephone is required'),
  body('receiver.name').trim().notEmpty().withMessage('Receiver name is required'),
  body('receiver.telephone').trim().notEmpty().withMessage('Receiver telephone is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('weightKg').isFloat({ min: 0.1 }).withMessage('Weight must be positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('commercialValue').optional().isFloat({ min: 0 }),
  body('deliveryLocation').optional().trim(),
  body('status').optional().isIn(['Pending', 'In Transit', 'Delivered', 'Cancelled'])
];

// Charges validation  
const chargesValidation = [
  body('baseCharge').optional().isFloat({ min: 0 }),
  body('other').optional().isFloat({ min: 0 }),
  body('insurance').optional().isFloat({ min: 0 }),
  body('extraDelivery').optional().isFloat({ min: 0 }),
  body('vat').optional().isFloat({ min: 0 })
];

// Payment validation
const paymentValidation = [
  body('paymentMethod').optional().isIn(['Cash', 'M-Pesa', 'Bank', 'Card']),
  body('payerAccountNo').optional().trim(),
  body('amountPaid').optional().isFloat({ min: 0 })
];

module.exports = {
  senderValidation,
  receiverValidation,
  shipmentValidation,
  chargesValidation,
  paymentValidation
};