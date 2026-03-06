require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding...');

    const ownerHash = await bcrypt.hash('farm123', 10);
    await client.query(`
      INSERT INTO farm_owners (name, email, phone, password_hash, farm_name)
      VALUES ('Farm Owner', 'owner@pickyourchicken.com', '9876500000', $1, 'Pick Your Chicken')
      ON CONFLICT (email) DO NOTHING
    `, [ownerHash]);

    const custHash = await bcrypt.hash('cust123', 10);
    const existing = await client.query(`SELECT id FROM users WHERE phone=$1`, ['9876543210']);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO users (name, phone, password_hash)
        VALUES ('Demo Customer', '9876543210', $1)
      `, [custHash]);
    }

    await client.query(`
      INSERT INTO categories (name, name_te, slug, icon, sort_order) VALUES
        ('Chicken', 'కోడి',  'chicken', '🐔', 1),
        ('Eggs',    'గుడ్లు','eggs',    '🥚', 2),
        ('Combos',  'కాంబో','combos',  '🎁', 3)
      ON CONFLICT (slug) DO NOTHING
    `);

    const cats = await client.query('SELECT id, slug FROM categories');
    const cm = {};
    cats.rows.forEach(r => cm[r.slug] = r.id);

    const cnt = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(cnt.rows[0].count) === 0) {
      const products = [
        { c:'chicken', name:'Whole Chicken',    te:'మొత్తం కోడి',      desc:'Farm fresh, daily cut',        desc_te:'రోజువారీ తాజా కోత',      price:220, unit:'kg',  icon:'🐔', badge:'BESTSELLER' },
        { c:'chicken', name:'Boneless Chicken', te:'బోన్‌లెస్ కోడి',   desc:'Clean boneless cuts, no waste',desc_te:'వ్యర్థం లేని తాజా కట్',   price:280, unit:'kg',  icon:'🍗', badge:'POPULAR'    },
        { c:'chicken', name:'Chicken Liver',    te:'కోడి కాలేయం',     desc:'Rich in iron & vitamins',      desc_te:'ఐరన్ & విటమిన్లు అధికంగా',price:120, unit:'kg',  icon:'🫀', badge:null         },
        { c:'chicken', name:'Chicken Gizzard',  te:'కోడి గిజ్జర్డ్',  desc:'Cleaned & ready to cook',     desc_te:'శుభ్రపరచి సిద్ధం',         price:100, unit:'kg',  icon:'🍖', badge:null         },
        { c:'eggs',    name:'Country Eggs',     te:'నాటు గుడ్లు',     desc:'Free range, organic',          desc_te:'స్వేచ్ఛగా పెరిగిన గుడ్లు', price:8,   unit:'pc',  icon:'🥚', badge:'ORGANIC'    },
        { c:'eggs',    name:'Farm Eggs',        te:'ఫారం గుడ్లు',     desc:'Fresh eggs, packed daily',     desc_te:'రోజువారీ తాజా ప్యాక్',      price:6,   unit:'pc',  icon:'🍳', badge:null         },
        { c:'combos',  name:'Chicken + 12 Eggs',te:'కోడి + 12 గుడ్లు', desc:'1kg chicken + 12 country eggs',desc_te:'1కేజీ కోడి + 12 నాటు గుడ్లు',price:310, unit:'set', icon:'🎁', badge:'SAVE ₹14'   },
        { c:'combos',  name:'Family Pack',      te:'ఫ్యామిలీ ప్యాక్', desc:'2kg chicken + 24 eggs',        desc_te:'2కేజీ కోడి + 24 గుడ్లు',    price:610, unit:'set', icon:'👨‍👩‍👧‍👦',badge:'BEST VALUE' },
      ];
      for (const p of products) {
        await client.query(
          `INSERT INTO products (category_id,name,name_te,description,description_te,price,unit,icon,badge) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [cm[p.c], p.name, p.te, p.desc, p.desc_te, p.price, p.unit, p.icon, p.badge]
        );
      }
      console.log('✅ 8 products added');
    }

    await client.query(`
      INSERT INTO coupons (code, type, value, min_order) VALUES
        ('WELCOME10', 'percent', 10, 200),
        ('PYCSAVE20', 'percent', 20, 500),
        ('FLAT50',    'flat',    50, 300)
      ON CONFLICT (code) DO NOTHING
    `);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database ready!');
    console.log('   Farm:     owner@pickyourchicken.com / farm123');
    console.log('   Customer: 9876543210 / cust123');
    console.log('   Coupons:  WELCOME10, PYCSAVE20, FLAT50');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (e) {
    console.error('❌ Seed error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
