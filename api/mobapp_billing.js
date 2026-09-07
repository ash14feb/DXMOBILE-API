const express = require('express');
const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

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
            `SELECT id, rfid, amount, pre_amount, post_amount, log_game, created_at,
                    customer_main_amount_used, customer_bonus_amount_used, is_refund, token_earn
             FROM es_billing
             WHERE rfid = ? AND is_deleted = 'NO'
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [rfid, limit, offset]
        );

        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM es_billing WHERE rfid = ? AND is_deleted = ?',
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
        console.error('Get billing history error:', error);
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
            `SELECT id, rfid, amount, log_game, created_at, is_refund, token_earn
             FROM es_billing
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
        console.error('Get recent billing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
