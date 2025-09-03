const express = require('express');
const { body, param } = require('express-validator');
const receiverController = require('../controllers/receiverController');

const router = express.Router();

const createOrUpdateReceiver = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim().isString(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('address').optional().trim().isString()
];

router.get('/', receiverController.getAll);
router.get('/:id', param('id').isInt(), receiverController.getById);
router.post('/', createOrUpdateReceiver, receiverController.create);
router.put('/:id', param('id').isInt(), createOrUpdateReceiver, receiverController.update);
router.delete('/:id', param('id').isInt(), receiverController.remove);

module.exports = router;
