// routes/customer.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

function ensureCustomer(req, res, next) {
  if (req.session.user?.role === 'customer') return next();
  return res.redirect('/login');
}

// Products
router.get('/products', ensureCustomer, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT PRODUCT_ID AS id, NAME AS name, DESCRIPTION AS description,
             CATEGORY AS category, PRICE AS price, QUANTITY AS stock
      FROM PRODUCT
    `);
    const products = rows.map(p => ({
      ...p,
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock, 10) || 0,
      category: p.category || 'Uncategorized' // Set default category
    }));
    res.render('products', { products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).render('products', { 
      error: 'Error loading products',
      products: []
    });
  }
});

// Cart
router.get('/cart', ensureCustomer, (req, res) => {
  // Initialize cart as array if not exists
  if (!req.session.cart) req.session.cart = [];
  res.render('cart', { cart: req.session.cart });
});

// Add to Cart API
router.post('/api/cart', ensureCustomer, async (req, res) => {
  try {
    const { productId, qty } = req.body;
    if (!req.session.cart) req.session.cart = [];
    
    // Validate product exists and has stock
    const [[product]] = await db.query(
      'SELECT PRODUCT_ID as id, NAME as name, PRICE as price, QUANTITY as stock FROM PRODUCT WHERE PRODUCT_ID = ?',
      [productId]
    );
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ error: 'Not enough stock' });
    
    // Add to cart
    req.session.cart.push({
      productId: parseInt(productId),
      qty: parseInt(qty),
      name: product.name,
      price: parseFloat(product.price)
    });
    
    res.redirect('/customer/cart');
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Could not add to cart' });
  }
});

// Shipping
router.get('/shipping', ensureCustomer, async (req, res) => {
  const customerId = req.session.user.id;
  const [orders] = await db.query(`
    SELECT o.ORDER_ID AS id, o.ORDER_DATE AS date, o.TOTAL_AMOUNT AS total,
           s.STATUS AS status, s.ESTIMATED_DELIVERY AS eta
    FROM ORDERS o
    JOIN SHIPPING s ON o.ORDER_ID = s.ORDER_ID
    WHERE o.CUSTOMER_ID = ?
    ORDER BY o.ORDER_DATE DESC
  `, [customerId]);
  res.render('shipping', { orders });
});

// **Returns**
router.get('/returns', ensureCustomer, async (req, res) => {
  const custId = req.session.user.id;
  const [rets] = await db.query(`
    SELECT r.RETURN_ID AS id, r.ORDER_ID AS orderId, r.PRODUCT_ID AS productId,
           r.REASON AS reason, r.RETURN_DATE AS date
    FROM RETURNS r
    JOIN ORDERS o ON r.ORDER_ID = o.ORDER_ID
    WHERE o.CUSTOMER_ID = ?
    ORDER BY r.RETURN_DATE DESC
  `, [custId]);
  res.render('returns', { returns: rets });
});

// **Reviews**
router.get('/reviews', ensureCustomer, async (req, res) => {
  const custId = req.session.user.id;
  const [revs] = await db.query(`
    SELECT REVIEW_ID AS id, PRODUCT_ID AS productId, RATING AS rating,
           REVIEW_TEXT AS text, REVIEW_DATE AS date
    FROM REVIEWS
    WHERE CUSTOMER_ID = ?
    ORDER BY REVIEW_DATE DESC
  `, [custId]);
  res.render('reviews', { reviews: revs });
});
// Notifications
router.get('/notifications', ensureCustomer, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [notifications] = await db.query(`
      SELECT 
        NOTIFICATION_ID as id,
        MESSAGE as message,
        STATUS as status,
        CREATED_AT as created
      FROM NOTIFICATION
      WHERE USER_ID = ?
      ORDER BY CREATED_AT DESC
    `, [userId]);
    
    res.render('notifications', { notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).send('Error loading notifications');
  }
});

// — Loyalty Program —
router.get('/loyalty', ensureCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const [rows] = await db.query(
      `SELECT LOYALTY_ID AS id, POINTS AS points, TIER AS tier
       FROM LOYALTY_PROGRAM
       WHERE CUSTOMER_ID = ?`,
      [customerId]
    );
    // If the customer isn't in the loyalty table yet, rows will be empty
    const loyalty = rows[0] || null;
    res.render('loyalty', { loyalty });
  } catch (err) {
    console.error('Error fetching loyalty info:', err);
    res.status(500).send('Error loading loyalty program');
  }
});

// Dashboard
router.get('/dashboard', ensureCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    
    // Get cart count
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    
    // Get order count
    const [orderRows] = await db.query(
      'SELECT COUNT(*) as count FROM ORDERS WHERE CUSTOMER_ID = ?',
      [customerId]
    );
    const orderCount = orderRows[0].count;
    
    // Get loyalty points
    const [loyaltyRows] = await db.query(
      'SELECT POINTS as points FROM LOYALTY_PROGRAM WHERE CUSTOMER_ID = ?',
      [customerId]
    );
    const loyaltyPoints = loyaltyRows.length > 0 ? loyaltyRows[0].points : 0;
    
    // Get recent orders
    const [recentOrders] = await db.query(`
      SELECT o.ORDER_ID AS id, o.ORDER_DATE AS date, o.TOTAL_AMOUNT AS total,
             s.STATUS AS status, s.ESTIMATED_DELIVERY AS eta
      FROM ORDERS o
      JOIN SHIPPING s ON o.ORDER_ID = s.ORDER_ID
      WHERE o.CUSTOMER_ID = ?
      ORDER BY o.ORDER_DATE DESC
      LIMIT 5
    `, [customerId]);
    
    // Convert total to number for each order
    const processedOrders = recentOrders.map(order => ({
      ...order,
      total: parseFloat(order.total) || 0
    }));
    
    res.render('customer-dashboard', {
      cartCount,
      orderCount,
      loyaltyPoints,
      recentOrders: processedOrders
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).render('customer-dashboard', {
      error: 'Error loading dashboard data',
      cartCount: 0,
      orderCount: 0,
      loyaltyPoints: 0,
      recentOrders: []
    });
  }
});

module.exports = router;
