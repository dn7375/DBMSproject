// server.js
require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const path       = require('path');

const authRouter      = require('./routes/auth');
const customerRouter  = require('./routes/customer');
const employeeRouter  = require('./routes/employee');
const productRouter   = require('./routes/product');
const supplierRouter  = require('./routes/supplier');
const warehouseRouter = require('./routes/warehouse');
// ... (your other routers: shipping, notifications, returns, reviews, etc.)

const app = express();

// View & static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body & session
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret:   process.env.SESSION_SECRET,
  resave:   false,
  saveUninitialized: false
}));

// Mount routers
app.use('/', authRouter);               // login/logout
app.use('/customer', customerRouter);   // customer pages & APIs
app.use('/employee', employeeRouter);   // employee pages (dashboard, manage pages)
app.use('/employee', productRouter);    // product CRUD APIs @ /employee/api/products
app.use('/employee', supplierRouter);   // supplier CRUD APIs @ /employee/api/suppliers
app.use('/employee', warehouseRouter);  // warehouse CRUD APIs @ /employee/api/warehouses

// Redirect root
app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
