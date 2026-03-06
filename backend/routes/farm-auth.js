const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../database/db');
const { requireFarm } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const r = await pool.query(`SELECT * FROM farm_owners WHERE email=$1 AND is_active=true`, [email]);
    const owner = r.rows[0];
    if (!owner || !(await bcrypt.compare(password, owner.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id:owner.id, name:owner.name, email:owner.email, farm_name:owner.farm_name, role:'farm_owner' },
      process.env.JWT_FARM_SECRET, { expiresIn:'7d' }
    );
    res.json({ token, owner:{ id:owner.id, name:owner.name, email:owner.email, farm_name:owner.farm_name, is_open:owner.is_open } });
  } catch(e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireFarm, async (req, res) => {
  const r = await pool.query(`SELECT id,name,email,phone,farm_name,is_open FROM farm_owners WHERE id=$1`, [req.farm.id]);
  res.json(r.rows[0]);
});

router.patch('/toggle-open', requireFarm, async (req, res) => {
  const r = await pool.query(`UPDATE farm_owners SET is_open=NOT is_open WHERE id=$1 RETURNING is_open`, [req.farm.id]);
  req.app.get('io').emit('farm-status', { is_open: r.rows[0].is_open });
  res.json(r.rows[0]);
});

module.exports = router;
