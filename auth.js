// routes/auth.js
const express = require('express');
const db      = require('../db');
const bcrypt  = require('bcrypt');
const router  = express.Router();

// Show login form
router.get('/login', (req, res) => {
  // pass error flag into the template
  res.render('login', { error: req.query.error });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT USER_ID, USERNAME, PASSWORD_HASH, ROLE FROM USERS WHERE USERNAME = ?',
      [username]
    );
    if (rows.length === 0) return res.redirect('/login?error=1');
    const user = rows[0];
    const match = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!match) return res.redirect('/login?error=1');
    req.session.user = { id:user.USER_ID, username:user.USERNAME, role:user.ROLE };
    return user.ROLE==='employee'
      ? res.redirect('/employee/dashboard')
      : res.redirect('/customer/products');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(()=> res.redirect('/login'));
});

module.exports = router;
