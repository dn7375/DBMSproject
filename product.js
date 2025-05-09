// routes/product.js
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

// List all products
router.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PRODUCT');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch products' });
  }
});

// Create a new product
router.post('/api/products', async (req, res) => {
  const { supplierId, name, description, category, price, quantity } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO PRODUCT 
       (SUPPLIER_ID, NAME, DESCRIPTION, CATEGORY, PRICE, QUANTITY) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supplierId, name, description, category, price, quantity]
    );
    res.json({ productId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create product' });
  }
});

// Update an existing product
router.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { supplierId, name, description, category, price, quantity } = req.body;
  try {
    await db.query(
      `UPDATE PRODUCT 
       SET SUPPLIER_ID=?, NAME=?, DESCRIPTION=?, CATEGORY=?, PRICE=?, QUANTITY=?
       WHERE PRODUCT_ID = ?`,
      [supplierId, name, description, category, price, quantity, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update product' });
  }
});

// Delete a product
router.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM PRODUCT WHERE PRODUCT_ID = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete product' });
  }
});

module.exports = router;
