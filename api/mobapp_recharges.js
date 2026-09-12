const express = require('express');
const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/packages', async (req, res) => {
    try {
        const packages = await db.query(
            `SELECT id, amount, bonus_amount FROM es_bonus ORDER BY amount ASC`
        );

        const result = packages.map((pkg) => {
            const rechargeAmount = Number(pkg.amount);
            const bonusAmount = Number(pkg.bonus_amount) || 0;
            const displayValue = rechargeAmount - (rechargeAmount * 0.18) + bonusAmount;

            return {
                id: pkg.id,
                name: rechargeAmount,
                recharge_value: Math.round(displayValue),
                bonus: bonusAmount,
            };
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get recharge packages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/history/:rfid', async (req, res) => {
    try {
        const { rfid } = req.params;
        const { phone } = req.customer;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const verify = await db.query(
            'SELECT id FROM es_customer WHERE rfid = ? AND phone = ? LIMIT 1',
            [rfid, phone]
        );

        if (verify.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this card'
            });
        }

        const history = await db.query(
            `SELECT id, customer_id, rfid, pre_amount, recharge_amount,
                    discount_percent_on_bill, discount_amount_on_bill,
                    collect_amount_from_customer, bonus_amount, main_amount,
                    post_amount, created_at, payment_mode, gst_amount, center_code
             FROM es_payment
             WHERE rfid = ? AND is_deleted = 'NO'
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            [rfid]
        );

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM es_payment WHERE rfid = ? AND is_deleted = ?',
            [rfid, 'NO']
        );

        return res.json({
            success: true,
            data: {
                records: history,
                total: countResult.total,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Get recharge history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/recent/:rfid', async (req, res) => {
    try {
        const { rfid } = req.params;
        const { phone } = req.customer;

        const verify = await db.query(
            'SELECT id FROM es_customer WHERE rfid = ? AND phone = ? LIMIT 1',
            [rfid, phone]
        );

        if (verify.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this card'
            });
        }

        const recent = await db.query(
            `SELECT id, rfid, recharge_amount, bonus_amount, main_amount,
                    collect_amount_from_customer, payment_mode, created_at
             FROM es_payment
             WHERE rfid = ? AND is_deleted = 'NO'
             ORDER BY created_at DESC
             LIMIT 5`,
            [rfid]
        );

        return res.json({
            success: true,
            data: recent
        });
    } catch (error) {
        console.error('Get recent recharge error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
