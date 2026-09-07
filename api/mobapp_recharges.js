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

module.exports = router;
