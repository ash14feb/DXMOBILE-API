const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const mobappAuthRoutes = require('./api/mobapp_auth');
const mobappCustomerRoutes = require('./api/mobapp_customer');
const mobappBillingRoutes = require('./api/mobapp_billing');
const mobappRechargeRoutes = require('./api/mobapp_recharges');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'DX Mobile API',
        version: '1.0.0',
        status: 'running'
    });
});

app.use('/mobapp_api/auth', mobappAuthRoutes);
app.use('/mobapp_api/customer', mobappCustomerRoutes);
app.use('/mobapp_api/billing', mobappBillingRoutes);
app.use('/mobapp_api/recharges', mobappRechargeRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 3001;

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`DX Mobile API running on port ${PORT}`);
    });
}
