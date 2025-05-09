// routes/supplier.js
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// Protect employee routes
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'employee') {
    return res.status(401).json({ error: 'Not authorized' });
  }
  next();
});

// List all suppliers
router.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM SUPPLIER');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch suppliers' });
  }
});

// Create a new supplier
router.post('/api/suppliers', async (req, res) => {
  const { name, contactInfo, address } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO SUPPLIER (NAME, CONTACT_INFO, ADDRESS) VALUES (?, ?, ?)',
      [name, contactInfo, address]
    );
    res.json({ supplierId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create supplier' });
  }
});

// Update an existing supplier
router.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contactInfo, address } = req.body;
  try {
    await db.query(
      'UPDATE SUPPLIER SET NAME = ?, CONTACT_INFO = ?, ADDRESS = ? WHERE SUPPLIER_ID = ?',
      [name, contactInfo, address, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update supplier' });
  }
});

// Delete a supplier
router.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM SUPPLIER WHERE SUPPLIER_ID = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete supplier' });
  }
});

module.exports = router;
