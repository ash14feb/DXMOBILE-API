const express = require('express');
const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', async (req, res) => {
    try {
        const { phone, rfid } = req.customer;

        const customer = await db.query(
            'SELECT id, name, phone, rfid, balance_main, balance_bonus FROM es_customer WHERE phone = ? AND rfid = ? LIMIT 1',
            [phone, rfid]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        return res.json({
            success: true,
            data: customer[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/cards', async (req, res) => {
    try {
        const { phone } = req.customer;

        const cards = await db.query(
            'SELECT id, rfid, name, balance_main, balance_bonus FROM es_customer WHERE phone = ? ORDER BY id DESC',
            [phone]
        );

        return res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('Get cards error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/balance/:rfid', async (req, res) => {
    try {
        const { rfid } = req.params;
        const { phone } = req.customer;

        const customer = await db.query(
            'SELECT balance_main, balance_bonus FROM es_customer WHERE rfid = ? AND phone = ? LIMIT 1',
            [rfid, phone]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Card not found'
            });
        }

        return res.json({
            success: true,
            data: customer[0]
        });
    } catch (error) {
        console.error('Get balance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/switch-card', async (req, res) => {
    try {
        const { rfid } = req.body;
        const { phone } = req.customer;

        if (!rfid) {
            return res.status(400).json({
                success: false,
                message: 'RFID is required'
            });
        }

        const customer = await db.query(
            'SELECT id, name, phone, rfid, balance_main, balance_bonus FROM es_customer WHERE rfid = ? AND phone = ? LIMIT 1',
            [rfid, phone]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Card not found for this phone number'
            });
        }

        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');

        const token = jwt.sign(
            {
                phone: phone,
                customerId: customer[0].id,
                rfid: customer[0].rfid,
                name: customer[0].name
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            success: true,
            message: 'Card switched successfully',
            data: {
                token,
                customer: customer[0]
            }
        });
    } catch (error) {
        console.error('Switch card error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
