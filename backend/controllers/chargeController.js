const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

// Map incoming camelCase body to DB snake_case columns
const mapChargeBody = (body) => ({
  shipment_id: body.shipmentId ?? null,
  base_charge: body.baseCharge ?? 0,  // ✅ fixed field name
  other: body.other ?? 0,
  insurance: body.insurance ?? 0,
  extra_delivery: body.extraDelivery ?? 0,
  vat: body.vat ?? 0,
  total: body.total ?? null
});

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, base_charge AS baseCharge, insurance, extra_delivery AS extraDelivery, vat, total, created_at
       FROM charges
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('charges.getAll', err);
    res.status(500).json({ message: 'Failed to fetch charges' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, base_charge AS baseCharge, insurance, extra_delivery AS extraDelivery, vat, total, created_at
       FROM charges WHERE id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Charges not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('charges.getById', err);
    res.status(500).json({ message: 'Failed to fetch charges' });
  }
};

exports.getByShipmentId = async (req, res) => {
  try {
    const shipmentId = Number(req.params.shipmentId);
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, base_charge AS baseCharge, insurance, extra_delivery AS extraDelivery, vat, total, created_at
       FROM charges WHERE shipment_id = ?`, [shipmentId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Charges for shipment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('charges.getByShipmentId', err);
    res.status(500).json({ message: 'Failed to fetch charges for shipment' });
  }
};

exports.create = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const payload = mapChargeBody(req.body);
    const [result] = await pool.execute(
      `INSERT INTO charges (shipment_id, base_charge, insurance, extra_delivery, vat, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.shipment_id, payload.base_charge, payload.insurance, payload.extra_delivery, payload.vat, payload.total]
    );
    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, base_charge AS baseCharge, insurance, extra_delivery AS extraDelivery, vat, total, created_at
       FROM charges WHERE id = ?`, [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('charges.create', err);
    res.status(500).json({ message: 'Failed to create charges' });
  }
};

exports.update = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM charges WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Charges not found' });

    const payload = mapChargeBody(req.body);
    await pool.execute(
      `UPDATE charges
       SET shipment_id = ?, base_charge = ?, insurance = ?, extra_delivery = ?, vat = ?, total = ?
       WHERE id = ?`,
      [payload.shipment_id, payload.base_charge, payload.insurance, payload.extra_delivery, payload.vat, payload.total, id]
    );

    const [rows] = await pool.execute(
      `SELECT id, shipment_id AS shipmentId, base_charge AS baseCharge, insurance, extra_delivery AS extraDelivery, vat, total, created_at
       FROM charges WHERE id = ?`, [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('charges.update', err);
    res.status(500).json({ message: 'Failed to update charges' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM charges WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Charges not found' });

    await pool.execute('DELETE FROM charges WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('charges.remove', err);
    res.status(500).json({ message: 'Failed to delete charges' });
  }
};
