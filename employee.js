require('dotenv').config();
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Middleware: only employees can access
function ensureEmployee(req, res, next) {
  console.log('Session:', req.session);
  console.log('User:', req.session.user);
  if (req.session.user?.role === 'employee') return next();
  return res.redirect('/login');
}

// — Dashboard —
router.get('/dashboard', ensureEmployee, async (req, res) => {
  try {
    console.log('Loading dashboard...');
    
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM USERS');
    console.log('Total users:', totalUsers);
    
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM ORDERS');
    console.log('Total orders:', totalOrders);
    
    const [[{ lowStockCount }]] = await db.query(
      'SELECT COUNT(*) AS lowStockCount FROM PRODUCT WHERE QUANTITY < 10'
    );
    console.log('Low stock items:', lowStockCount);

    const [rows] = await db.query(`
      SELECT 
        o.ORDER_ID     AS id,
        o.ORDER_DATE   AS date,
        o.TOTAL_AMOUNT AS total,
        u.USERNAME     AS customer
      FROM ORDERS o
      JOIN USERS u ON o.CUSTOMER_ID = u.USER_ID
      ORDER BY o.ORDER_DATE DESC
      LIMIT 5
    `);
    console.log('Recent orders:', rows);

    const recentOrders = rows.map(o => ({
      ...o,
      total: parseFloat(o.total) || 0
    }));

    res.render('dashboard', {
      totalUsers,
      totalOrders,
      lowStockCount,
      recentOrders
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).render('dashboard', {
      error: 'Error loading dashboard data',
      totalUsers: 0,
      totalOrders: 0,
      lowStockCount: 0,
      recentOrders: []
    });
  }
});

// — Full Lists —

router.get('/users', ensureEmployee, async (req, res) => {
  const [users] = await db.query(`
    SELECT USER_ID AS id, USERNAME AS username, ROLE AS role
    FROM USERS
    ORDER BY USER_ID
  `);
  res.render('users', { users });
});

router.get('/orders', ensureEmployee, async (req, res) => {
  const [orders] = await db.query(`
    SELECT 
      o.ORDER_ID     AS id,
      o.ORDER_DATE   AS date,
      o.TOTAL_AMOUNT AS total,
      c.NAME         AS customer
    FROM ORDERS o
    JOIN CUSTOMER c ON o.CUSTOMER_ID = c.CUSTOMER_ID
    ORDER BY o.ORDER_DATE DESC
  `);
  orders.forEach(o => o.total = parseFloat(o.total) || 0);
  res.render('employee-orders', { orders });
});

router.get('/low-stock', ensureEmployee, async (req, res) => {
  const [items] = await db.query(`
    SELECT 
      p.PRODUCT_ID          AS id,
      p.NAME                AS name,
      s.AVAILABLE_QUANTITY  AS qty
    FROM STOCK s
    JOIN PRODUCT p ON s.PRODUCT_ID = p.PRODUCT_ID
    WHERE s.AVAILABLE_QUANTITY < 10
    ORDER BY s.AVAILABLE_QUANTITY ASC
  `);
  res.render('low-stock', { items });
});

router.get('/returns', ensureEmployee, async (req, res) => {
  const [returns] = await db.query(`
    SELECT 
      RETURN_ID   AS id,
      ORDER_ID    AS orderId,
      PRODUCT_ID  AS productId,
      REASON      AS reason,
      RETURN_DATE AS date
    FROM RETURNS
    ORDER BY RETURN_DATE DESC
  `);
  res.render('employee-returns', { returns });
});

router.get('/reviews', ensureEmployee, async (req, res) => {
  const [reviews] = await db.query(`
    SELECT 
      REVIEW_ID   AS id,
      PRODUCT_ID  AS productId,
      CUSTOMER_ID AS customerId,
      RATING      AS rating,
      REVIEW_TEXT AS text,
      REVIEW_DATE AS date
    FROM REVIEWS
    ORDER BY REVIEW_DATE DESC
  `);
  res.render('employee-reviews', { reviews });
});

// — New Routes: Product Management —

router.get('/products-manage', ensureEmployee, async (req, res) => {
  const [products] = await db.query(`
    SELECT PRODUCT_ID AS id, NAME AS name, DESCRIPTION AS description, PRICE AS price
    FROM PRODUCT
    ORDER BY PRODUCT_ID
  `);
  res.render('products-manage', { products });
});

router.get('/suppliers', ensureEmployee, async (req, res) => {
  const [suppliers] = await db.query(`
    SELECT SUPPLIER_ID AS id, NAME AS name, CONTACT_INFO AS contact
    FROM SUPPLIER
    ORDER BY SUPPLIER_ID
  `);
  res.render('suppliers', { suppliers });
});

router.get('/warehouses', ensureEmployee, async (req, res) => {
  const [warehouses] = await db.query(`
    SELECT WAREHOUSE_ID AS id, LOCATION AS location, CAPACITY AS capacity
    FROM WAREHOUSE
    ORDER BY WAREHOUSE_ID
  `);
  res.render('warehouses', { warehouses });
});
// Remove the first products-manage route (lines 139-146) and keep only this one
//— Products Manage —
router.get('/products-manage', ensureEmployee, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.PRODUCT_ID AS id,
        p.NAME AS name,
        p.DESCRIPTION AS description,
        p.CATEGORY AS category,
        p.PRICE AS price,
        p.QUANTITY AS quantity
      FROM PRODUCT p
    `);

    // Fix: convert price to number and set default category
    const fixedProducts = products.map(p => ({
      ...p,
      price: Number(p.price) || 0,  // Ensure it's a number
      category: p.category || 'Uncategorized'  // Set default category
    }));

    res.render('products-manage', { products: fixedProducts });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).render('products-manage', { 
      error: 'Error loading products',
      products: []
    });
  }
});

module.exports = router;
