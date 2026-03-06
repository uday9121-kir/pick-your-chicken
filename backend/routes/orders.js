const router = require('express').Router();
const pool   = require('../database/db');
const { requireCustomer, requireFarm } = require('../middleware/auth');

const genNum = () => 'PYC' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100);

async function fullOrder(id) {
  const r = await pool.query(`
    SELECT o.*,
      u.name as customer_name, u.phone as customer_phone,
      COALESCE(json_agg(oi ORDER BY oi.name) FILTER(WHERE oi.id IS NOT NULL),'[]') as items,
      COALESCE((SELECT json_agg(h ORDER BY h.created_at) FROM order_history h WHERE h.order_id=o.id),'[]') as history
    FROM orders o
    LEFT JOIN users u ON u.id=o.user_id
    LEFT JOIN order_items oi ON oi.order_id=o.id
    WHERE o.id=$1 GROUP BY o.id,u.name,u.phone
  `, [id]);
  return r.rows[0];
}

// Customer: place order
router.post('/', requireCustomer, async (req, res) => {
  const { items, address_snapshot, delivery_date, delivery_slot, payment_method, coupon_code, notes } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let subtotal = 0;
    const resolved = [];
    for (const item of items) {
      const p = await client.query(`SELECT * FROM products WHERE id=$1 AND is_available=true`, [item.product_id]);
      if (!p.rows[0]) throw new Error(`Product not available`);
      const lineTotal = parseFloat(p.rows[0].price) * item.qty;
      subtotal += lineTotal;
      resolved.push({ ...p.rows[0], qty: item.qty, lineTotal });
    }
    let discount = 0;
    if (coupon_code) {
      const cp = await client.query(`SELECT * FROM coupons WHERE code=$1 AND is_active=true AND used_count<max_uses`, [coupon_code.toUpperCase()]);
      if (cp.rows[0]) {
        const c = cp.rows[0];
        discount = c.type==='percent' ? Math.floor(subtotal*(c.value/100)) : parseFloat(c.value);
        await client.query(`UPDATE coupons SET used_count=used_count+1 WHERE id=$1`, [c.id]);
      }
    }
    const fee = subtotal >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount + fee);
    const orderNum = genNum();
    const o = await client.query(
      `INSERT INTO orders (order_number,user_id,address_snapshot,delivery_date,delivery_slot,payment_method,subtotal,delivery_fee,discount,total,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [orderNum, req.user.id, JSON.stringify(address_snapshot)||null, delivery_date||null, delivery_slot||null, payment_method||'cod', subtotal, fee, discount, total, notes||null]
    );
    for (const p of resolved) {
      await client.query(
        `INSERT INTO order_items (order_id,product_id,name,name_te,icon,price,unit,quantity,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [o.rows[0].id, p.id, p.name, p.name_te, p.icon, p.price, p.unit, p.qty, p.lineTotal]
      );
    }
    await client.query(`INSERT INTO order_history (order_id,status,note) VALUES ($1,'placed','Order placed')`, [o.rows[0].id]);
    await client.query('COMMIT');
    const full = await fullOrder(o.rows[0].id);
    req.app.get('io').to('farm').emit('new-order', full);
    res.status(201).json(full);
  } catch(e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message });
  } finally { client.release(); }
});

// Customer: my orders
router.get('/my', requireCustomer, async (req, res) => {
  const r = await pool.query(`
    SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.name) FILTER(WHERE oi.id IS NOT NULL),'[]') as items
    FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
    WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT 20
  `, [req.user.id]);
  res.json(r.rows);
});

// Customer: track order
router.get('/:id', requireCustomer, async (req, res) => {
  const o = await fullOrder(req.params.id);
  if (!o || o.user_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  res.json(o);
});

// Farm: all orders
router.get('/farm/all', requireFarm, async (req, res) => {
  const { status } = req.query;
  const vals = [];
  let w = 'WHERE 1=1';
  if (status && status !== 'all') { w += ` AND o.status=$1`; vals.push(status); }
  const r = await pool.query(`
    SELECT o.*, u.name as customer_name, u.phone as customer_phone,
      COALESCE(json_agg(oi ORDER BY oi.name) FILTER(WHERE oi.id IS NOT NULL),'[]') as items
    FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN order_items oi ON oi.order_id=o.id
    ${w} GROUP BY o.id,u.name,u.phone ORDER BY o.created_at DESC LIMIT 100
  `, vals);
  res.json(r.rows);
});

// Farm: update status
router.patch('/farm/:id/status', requireFarm, async (req, res) => {
  const { status, driver_name, driver_phone, eta_minutes } = req.body;
  const VALID = ['confirmed','preparing','out_for_delivery','delivered','cancelled'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const sets = [`status=$1`, `updated_at=NOW()`];
  const vals = [status];
  let i = 2;
  if (driver_name)  { sets.push(`driver_name=$${i++}`);  vals.push(driver_name); }
  if (driver_phone) { sets.push(`driver_phone=$${i++}`); vals.push(driver_phone); }
  if (eta_minutes)  { sets.push(`eta_minutes=$${i++}`);  vals.push(eta_minutes); }
  vals.push(req.params.id);
  await pool.query(`UPDATE orders SET ${sets.join(',')} WHERE id=$${i}`, vals);
  await pool.query(`INSERT INTO order_history (order_id,status,created_by) VALUES ($1,$2,'farm')`, [req.params.id, status]);
  if (status === 'delivered') {
    const o = await pool.query(`SELECT * FROM orders WHERE id=$1`, [req.params.id]);
    if (o.rows[0]) {
      const pts = Math.floor(parseFloat(o.rows[0].total) / 10);
      await pool.query(`UPDATE users SET loyalty_points=loyalty_points+$1 WHERE id=$2`, [pts, o.rows[0].user_id]);
      await pool.query(`UPDATE orders SET loyalty_earned=$1 WHERE id=$2`, [pts, req.params.id]);
    }
  }
  const full = await fullOrder(req.params.id);
  req.app.get('io').to('customer-' + full.user_id).emit('order-update', { order_id: full.id, status, order: full });
  req.app.get('io').to('farm').emit('order-updated', full);
  res.json(full);
});

// Farm: stats
router.get('/farm/stats', requireFarm, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [tod, pend, rev, custs, weekly, top] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM orders WHERE created_at::date=$1`, [today]),
    pool.query(`SELECT COUNT(*) FROM orders WHERE status IN ('placed','confirmed','preparing')`),
    pool.query(`SELECT COALESCE(SUM(total),0) as t FROM orders WHERE created_at::date=$1`, [today]),
    pool.query(`SELECT COUNT(DISTINCT user_id) FROM orders`),
    pool.query(`SELECT DATE(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders WHERE created_at>=NOW()-INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY day`),
    pool.query(`SELECT oi.name,oi.icon,SUM(oi.quantity) as sold FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.created_at>=NOW()-INTERVAL '30 days' GROUP BY oi.name,oi.icon ORDER BY sold DESC LIMIT 5`),
  ]);
  res.json({
    today: { orders: parseInt(tod.rows[0].count), revenue: parseFloat(rev.rows[0].t) },
    pending: parseInt(pend.rows[0].count),
    total_customers: parseInt(custs.rows[0].count),
    weekly: weekly.rows, top_products: top.rows
  });
});

// Customer: rate
router.post('/:id/rate', requireCustomer, async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  await pool.query(`INSERT INTO ratings (order_id,user_id,rating) VALUES ($1,$2,$3) ON CONFLICT (order_id) DO UPDATE SET rating=$3`, [req.params.id, req.user.id, rating]);
  await pool.query(`UPDATE orders SET is_rated=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  await pool.query(`UPDATE users SET loyalty_points=loyalty_points+5 WHERE id=$1`, [req.user.id]);
  res.json({ ok: true, bonus_points: 5 });
});

module.exports = router;
