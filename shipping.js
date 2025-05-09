const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /shipping
router.get('/', (req, res) => {
    const query = 'SELECT * FROM SHIPPING';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching shipping data:', err);
            return res.status(500).send('Server error');
        }
        res.render('shipping', { shipping: results });
    });
});

module.exports = router;
