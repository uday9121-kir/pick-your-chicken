const router = require('express').Router();
const pool   = require('../database/db');
const { requireFarm } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [prods, cats] = await Promise.all([
      pool.query(`SELECT p.*,c.name as cat_name,c.name_te as cat_te,c.slug as cat_slug FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.is_available=true ORDER BY c.sort_order,p.sort_order,p.name`),
      pool.query(`SELECT * FROM categories ORDER BY sort_order`)
    ]);
    res.json({ products: prods.rows, categories: cats.rows });
  } catch(e) { res.status(500).json({ error: 'Failed to load menu' }); }
});

router.get('/all', requireFarm, async (req, res) => {
  const r = await pool.query(`SELECT p.*,c.name as cat_name FROM products p LEFT JOIN categories c ON p.category_id=c.id ORDER BY c.sort_order,p.name`);
  res.json(r.rows);
});

router.patch('/:id/toggle', requireFarm, async (req, res) => {
  const r = await pool.query(`UPDATE products SET is_available=NOT is_available WHERE id=$1 RETURNING id,name,is_available`, [req.params.id]);
  req.app.get('io').emit('product-update', r.rows[0]);
  res.json(r.rows[0]);
});

router.patch('/:id', requireFarm, async (req, res) => {
  const { price } = req.body;
  if (!price) return res.status(400).json({ error: 'Price required' });
  const r = await pool.query(`UPDATE products SET price=$1 WHERE id=$2 RETURNING *`, [price, req.params.id]);
  res.json(r.rows[0]);
});

module.exports = router;
