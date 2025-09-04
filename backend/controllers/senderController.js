const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Helpers
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, phone, email, address, created_at FROM senders ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('senders.getAll', err);
    res.status(500).json({ message: 'Failed to fetch senders' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute('SELECT id, name, phone, email, address, created_at FROM senders WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Sender not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('senders.getById', err);
    res.status(500).json({ message: 'Failed to fetch sender' });
  }
};

exports.create = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const { name, phone = null, email = null, address = null } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO senders (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone, email, address]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, phone, email, address, created_at FROM senders WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('senders.create', err);
    res.status(500).json({ message: 'Failed to create sender' });
  }
};

exports.update = async (req, res) => {
  const bad = handleValidation(req, res);
  if (bad) return;
  try {
    const id = Number(req.params.id);
    const { name, phone = null, email = null, address = null } = req.body;

    // Ensure exists
    const [exists] = await pool.execute('SELECT id FROM senders WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Sender not found' });

    await pool.execute(
      'UPDATE senders SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone, email, address, id]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, phone, email, address, created_at FROM senders WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('senders.update', err);
    res.status(500).json({ message: 'Failed to update sender' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exists] = await pool.execute('SELECT id FROM senders WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ message: 'Sender not found' });

    await pool.execute('DELETE FROM senders WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('senders.remove', err);
    res.status(500).json({ message: 'Failed to delete sender' });
  }
};
