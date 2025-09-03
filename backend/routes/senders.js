const express = require('express');
const { body, param } = require('express-validator');
const senderController = require('../controllers/senderController');
// const auth = require('../middleware/auth'); // uncomment if you want auth

const router = express.Router();

// Validation
const createOrUpdateSender = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim().isString(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('address').optional().trim().isString()
];

// Routes (specific before generic)
router.get('/', senderController.getAll);
router.get('/:id', param('id').isInt(), senderController.getById);
router.post('/', createOrUpdateSender, senderController.create);
router.put('/:id', param('id').isInt(), createOrUpdateSender, senderController.update);
router.delete('/:id', param('id').isInt(), senderController.remove);

module.exports = router;
