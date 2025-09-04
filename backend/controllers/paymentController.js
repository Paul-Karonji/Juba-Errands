const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

const mapPaymentBody = (body) => ({
  shipment_id: body.shipmentId ?? null,
  payer_account_no: body.payerAccountNo ?? null,
  payment_method: body.paymentMethod ?? null,   // 'Cash' | 'M-Pesa' | 'Bank' | 'Card'
  amount_paid: body.amountPaid ?? 0
});

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, payer_account_no AS payerAccountNo,
              payment_method AS paymentMethod, amount_paid AS amountPaid, created_at
       FROM payments
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('payments.getAll', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, payer_account_no AS payerAccountNo,
              payment_method AS paymentMethod, amount_paid AS amountPaid, created_at
       FROM payments WHERE id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('payments.getById', err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
};

exports.getByShipmentId = async (req, res) => {
  try {
    const shipmentId = Number(req.params.shipmentId);
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, payer_account_no AS payerAccountNo,
              payment_method AS paymentMethod, amount_paid AS amountPaid, created_at
       FROM payments WHERE shipment_id = ?`, [shipmentId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Payments for shipment not found' });
    // Could be multiple; return latest or all — here we return all
    res.json(rows);
  } catch (err) {
    console.error('payments.getByShipmentId', err);
    res.status(500).json({ message: 'Failed to fetch payments for shipment' });
  }
};

exports.create = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const payload = mapPaymentBody(req.body);
    const [result] = await pool.execute(
      `INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
       VALUES (?, ?, ?, ?)`,
      [payload.shipment_id, payload.payer_account_no, payload.payment_method, payload.amount_paid]
    );
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, payer_account_no AS payerAccountNo,
              payment_method AS paymentMethod, amount_paid AS amountPaid, created_at
       FROM payments WHERE id = ?`, [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('payments.create', err);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

exports.update = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM payments WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Payment not found' });

    const payload = mapPaymentBody(req.body);
    await pool.execute(
      `UPDATE payments
       SET shipment_id = ?, payer_account_no = ?, payment_method = ?, amount_paid = ?
       WHERE id = ?`,
      [payload.shipment_id, payload.payer_account_no, payload.payment_method, payload.amount_paid, id]
    );

    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, payer_account_no AS payerAccountNo,
              payment_method AS paymentMethod, amount_paid AS amountPaid, created_at
       FROM payments WHERE id = ?`, [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('payments.update', err);
    res.status(500).json({ message: 'Failed to update payment' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM payments WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Payment not found' });

    await pool.execute('DELETE FROM payments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('payments.remove', err);
    res.status(500).json({ message: 'Failed to delete payment' });
  }
};
