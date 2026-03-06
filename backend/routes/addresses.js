const router = require('express').Router();
const pool   = require('../database/db');
const { requireCustomer } = require('../middleware/auth');

router.get('/', requireCustomer, async (req, res) => {
  const r = await pool.query(`SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at DESC`, [req.user.id]);
  res.json(r.rows);
});

router.post('/', requireCustomer, async (req, res) => {
  const { label, line1, area, city, state, pin, is_default } = req.body;
  if (!line1) return res.status(400).json({ error: 'Address line required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_default) await client.query(`UPDATE addresses SET is_default=false WHERE user_id=$1`, [req.user.id]);
    const r = await client.query(
      `INSERT INTO addresses (user_id,label,line1,area,city,state,pin,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, label||'Home', line1, area||null, city||'Hyderabad', state||'Telangana', pin||null, is_default||false]
    );
    await client.query('COMMIT');
    res.status(201).json(r.rows[0]);
  } catch(e) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Save failed' }); }
  finally { client.release(); }
});

router.delete('/:id', requireCustomer, async (req, res) => {
  await pool.query(`DELETE FROM addresses WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
