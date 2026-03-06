require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🗄️  Running migrations...');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS farm_owners (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        phone         VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        farm_name     VARCHAR(100) DEFAULT 'Pick Your Chicken',
        is_active     BOOLEAN DEFAULT true,
        is_open       BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           VARCHAR(100) NOT NULL,
        email          VARCHAR(150),
        phone          VARCHAR(20),
        password_hash  VARCHAR(255) NOT NULL,
        loyalty_points INTEGER DEFAULT 0,
        is_active      BOOLEAN DEFAULT true,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

      CREATE TABLE IF NOT EXISTS categories (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        name_te    VARCHAR(100),
        slug       VARCHAR(100) UNIQUE NOT NULL,
        icon       VARCHAR(10),
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id    INTEGER REFERENCES categories(id),
        name           VARCHAR(100) NOT NULL,
        name_te        VARCHAR(100),
        description    TEXT,
        description_te TEXT,
        price          DECIMAL(10,2) NOT NULL,
        unit           VARCHAR(20) DEFAULT 'kg',
        icon           VARCHAR(10) DEFAULT '🐔',
        badge          VARCHAR(50),
        avg_rating     DECIMAL(3,2) DEFAULT 0,
        is_available   BOOLEAN DEFAULT true,
        sort_order     INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        label      VARCHAR(50) DEFAULT 'Home',
        line1      VARCHAR(200) NOT NULL,
        area       VARCHAR(100),
        city       VARCHAR(100) DEFAULT 'Hyderabad',
        state      VARCHAR(100) DEFAULT 'Telangana',
        pin        VARCHAR(10),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number        VARCHAR(20) UNIQUE NOT NULL,
        user_id             UUID REFERENCES users(id),
        address_snapshot    JSONB,
        delivery_date       DATE,
        delivery_slot       VARCHAR(50),
        status              VARCHAR(30) DEFAULT 'placed',
        payment_method      VARCHAR(30) DEFAULT 'cod',
        payment_status      VARCHAR(30) DEFAULT 'pending',
        subtotal            DECIMAL(10,2) NOT NULL,
        delivery_fee        DECIMAL(10,2) DEFAULT 30,
        discount            DECIMAL(10,2) DEFAULT 0,
        total               DECIMAL(10,2) NOT NULL,
        loyalty_earned      INTEGER DEFAULT 0,
        driver_name         VARCHAR(100),
        driver_phone        VARCHAR(20),
        eta_minutes         INTEGER,
        is_rated            BOOLEAN DEFAULT false,
        notes               TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID,
        name       VARCHAR(100),
        name_te    VARCHAR(100),
        icon       VARCHAR(10),
        price      DECIMAL(10,2),
        unit       VARCHAR(20),
        quantity   DECIMAL(10,3),
        total      DECIMAL(10,2)
      );

      CREATE TABLE IF NOT EXISTS order_history (
        id         SERIAL PRIMARY KEY,
        order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
        status     VARCHAR(30),
        note       TEXT,
        created_by VARCHAR(50) DEFAULT 'system',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id   UUID UNIQUE REFERENCES orders(id),
        user_id    UUID REFERENCES users(id),
        rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
        review     TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id          SERIAL PRIMARY KEY,
        code        VARCHAR(30) UNIQUE NOT NULL,
        type        VARCHAR(20) DEFAULT 'percent',
        value       DECIMAL(10,2) NOT NULL,
        min_order   DECIMAL(10,2) DEFAULT 0,
        max_uses    INTEGER DEFAULT 1000,
        used_count  INTEGER DEFAULT 0,
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ All tables created!');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
