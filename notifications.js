const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /notifications
router.get('/', (req, res) => {
    const query = 'SELECT * FROM NOTIFICATION';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).send('Server error');
        }
        res.render('notifications', { notifications: results });
    });
});

module.exports = router;
