const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../database/db');

router.post('/register', async (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !password || (!phone && !email))
    return res.status(400).json({ error: 'Name, password, and phone or email required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (name,phone,email,password_hash) VALUES ($1,$2,$3,$4) RETURNING id,name,phone,email,loyalty_points`,
      [name, phone||null, email||null, hash]
    );
    const user = r.rows[0];
    const token = jwt.sign({ id:user.id, name:user.name, role:'customer' }, process.env.JWT_SECRET, { expiresIn:'7d' });
    res.status(201).json({ token, user });
  } catch(e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Phone or email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { phone, email, password } = req.body;
  if (!password || (!phone && !email))
    return res.status(400).json({ error: 'Phone/email and password required' });
  try {
    const r = await pool.query(
      `SELECT * FROM users WHERE (phone=$1 OR email=$2) AND is_active=true LIMIT 1`,
      [phone||null, email||null]
    );
    const user = r.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid phone number or password' });
    const token = jwt.sign({ id:user.id, name:user.name, role:'customer' }, process.env.JWT_SECRET, { expiresIn:'7d' });
    res.json({ token, user:{ id:user.id, name:user.name, phone:user.phone, email:user.email, loyalty_points:user.loyalty_points } });
  } catch(e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', require('../middleware/auth').requireCustomer, async (req, res) => {
  const r = await pool.query(`SELECT id,name,phone,email,loyalty_points FROM users WHERE id=$1`, [req.user.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(r.rows[0]);
});

module.exports = router;
