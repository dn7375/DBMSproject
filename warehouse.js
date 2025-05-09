// routes/warehouse.js
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

// List all warehouses
router.get('/api/warehouses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM WAREHOUSE');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch warehouses' });
  }
});

// Create a new warehouse
router.post('/api/warehouses', async (req, res) => {
  const { name, location, capacity } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO WAREHOUSE (NAME, LOCATION, CAPACITY) VALUES (?, ?, ?)',
      [name, location, capacity]
    );
    res.json({ warehouseId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create warehouse' });
  }
});

// Update an existing warehouse
router.put('/api/warehouses/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, capacity } = req.body;
  try {
    await db.query(
      'UPDATE WAREHOUSE SET NAME = ?, LOCATION = ?, CAPACITY = ? WHERE WAREHOUSE_ID = ?',
      [name, location, capacity, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update warehouse' });
  }
});

// Delete a warehouse
router.delete('/api/warehouses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM WAREHOUSE WHERE WAREHOUSE_ID = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete warehouse' });
  }
});

module.exports = router;
