const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, phone, email, address, created_at FROM receivers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('receivers.getAll', err);
    res.status(500).json({ message: 'Failed to fetch receivers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute('SELECT id, name, phone, email, address, created_at FROM receivers WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Receiver not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('receivers.getById', err);
    res.status(500).json({ message: 'Failed to fetch receiver' });
  }
};

exports.create = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const { name, phone = null, email = null, address = null } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO receivers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone, email, address]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, phone, email, address, created_at FROM receivers WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('receivers.create', err);
    res.status(500).json({ message: 'Failed to create receiver' });
  }
};

exports.update = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const id = Number(req.params.id);
    const { name, phone = null, email = null, address = null } = req.body;

    const [exists] = await pool.execute('SELECT id FROM receivers WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Receiver not found' });

    await pool.execute(
      'UPDATE receivers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone, email, address, id]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, phone, email, address, created_at FROM receivers WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('receivers.update', err);
    res.status(500).json({ message: 'Failed to update receiver' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM receivers WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Receiver not found' });

    await pool.execute('DELETE FROM receivers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('receivers.remove', err);
    res.status(500).json({ message: 'Failed to delete receiver' });
  }
};
