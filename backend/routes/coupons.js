const router = require('express').Router();
const pool   = require('../database/db');
const { requireCustomer } = require('../middleware/auth');

router.post('/validate', requireCustomer, async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });
  const r = await pool.query(`SELECT * FROM coupons WHERE code=$1 AND is_active=true AND used_count<max_uses`, [code.toUpperCase()]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Invalid or expired coupon' });
  const cp = r.rows[0];
  if (subtotal < cp.min_order) return res.status(400).json({ error: `Minimum order ₹${cp.min_order} needed` });
  const discount = cp.type==='percent' ? Math.floor(subtotal*(cp.value/100)) : parseFloat(cp.value);
  res.json({ valid:true, code:cp.code, type:cp.type, value:cp.value, discount: Math.min(discount, subtotal) });
});

module.exports = router;
