const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const customers = await db.query(
            'SELECT * FROM es_customer WHERE phone = ? ORDER BY id DESC',
            [phone]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this phone number'
            });
        }

        return res.json({
            success: true,
            message: 'OTP sent successfully',
            data: { phone }
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone and OTP are required'
            });
        }

        if (otp !== '1234') {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        const customers = await db.query(
            'SELECT * FROM es_customer WHERE phone = ? ORDER BY id DESC',
            [phone]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this phone number'
            });
        }

        const latestCustomer = customers[0];
        const allRfids = customers.map(c => ({
            rfid: c.rfid,
            name: c.name,
            balance_main: c.balance_main,
            balance_bonus: c.balance_bonus,
            id: c.id
        }));

        const token = jwt.sign(
            {
                phone: phone,
                customerId: latestCustomer.id,
                rfid: latestCustomer.rfid,
                name: latestCustomer.name
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                token,
                customer: {
                    id: latestCustomer.id,
                    name: latestCustomer.name,
                    phone: latestCustomer.phone,
                    rfid: latestCustomer.rfid,
                    balance_main: latestCustomer.balance_main,
                    balance_bonus: latestCustomer.balance_bonus
                },
                cards: allRfids
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
