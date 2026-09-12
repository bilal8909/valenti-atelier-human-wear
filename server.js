/**
 * VALENTI ATELIER - Backend REST API & MySQL Database Server
 * Express.js with MySQL (XAMPP / phpMyAdmin / MySQL Workbench compatible)
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MySQL CONFIGURATION (Default for XAMPP: user='root', password='')
// ============================================================================
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Default XAMPP has no password
  port: Number(process.env.DB_PORT) || 3306,
  database: 'valenti_atelier'
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '.')));

let db = null;

// Initialize MySQL: First create database if not exists, then connect
function setupMySQL() {
  // 1. Initial connection without database to create DB if needed
  const initConn = mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port
  });

  initConn.connect((err) => {
    if (err) {
      console.error('❌ Could not connect to MySQL server:', err.message);
      console.error('👉 TIP: Make sure XAMPP or MySQL service is started (Port 3306).');
      return;
    }

    // Create database automatically
    initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``, (err2) => {
      initConn.end();
      if (err2) {
        console.error('❌ Error creating database:', err2.message);
        return;
      }

      console.log(`✅ MySQL Database "${DB_CONFIG.database}" verified/created!`);

      // 2. Connect to the actual database with connection pool
      db = mysql.createPool({
        ...DB_CONFIG,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      initializeTablesAndSeed();
    });
  });
}

// Setup Tables & Seed Data
function initializeTablesAndSeed() {
  // 1. Products Table
  const createProductsSql = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      categoryLabel VARCHAR(100),
      gender VARCHAR(50),
      price DECIMAL(10, 2) NOT NULL,
      originalPrice DECIMAL(10, 2),
      rating DECIMAL(3, 2) DEFAULT 5.0,
      reviewsCount INT DEFAULT 0,
      isNew TINYINT(1) DEFAULT 1,
      isBestSeller TINYINT(1) DEFAULT 0,
      onSale TINYINT(1) DEFAULT 0,
      sizes TEXT,
      colors TEXT,
      images LONGTEXT,
      description TEXT,
      details TEXT,
      inStock TINYINT(1) DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // 2. Orders Table
  const createOrdersSql = `
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      customerName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100),
      shippingAddress TEXT NOT NULL,
      paymentMethod VARCHAR(100),
      items LONGTEXT NOT NULL,
      subtotal DECIMAL(10, 2),
      discount DECIMAL(10, 2) DEFAULT 0,
      shippingFee DECIMAL(10, 2) DEFAULT 0,
      tax DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL,
      promoCode VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Confirmed',
      date VARCHAR(100),
      estimatedDelivery VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createProductsSql, (err) => {
    if (err) console.error('Error creating products table:', err.message);
    else seedDefaultProducts();
  });

  db.query(createOrdersSql, (err) => {
    if (err) console.error('Error creating orders table:', err.message);
    else seedSampleOrders();
  });
}

// Seed Products into MySQL if table empty
function seedDefaultProducts() {
  db.query('SELECT COUNT(*) as count FROM products', (err, rows) => {
    if (err || !rows || rows[0].count > 0) return;

    console.log('🌱 Seeding luxury catalog items into MySQL...');
    const defaults = [
      {
        id: "val-01",
        name: "Structured Cashmere Wool Overcoat",
        category: "jackets",
        categoryLabel: "Jackets",
        gender: "Men",
        price: 680.00,
        originalPrice: 850.00,
        rating: 4.9,
        reviewsCount: 38,
        isNew: 1,
        isBestSeller: 1,
        onSale: 1,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([
          { name: "Camel Tan", hex: "#c19a6b" },
          { name: "Obsidian Black", hex: "#1a1a1a" }
        ]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85",
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "Meticulously tailored from an ultra-soft blend of Italian double-faced cashmere and virgin wool.",
        details: JSON.stringify([
          "85% Virgin Wool, 15% Mongolian Cashmere",
          "Crafted in Florence, Italy"
        ]),
        inStock: 1
      },
      {
        id: "val-02",
        name: "Heritage Lambskin Biker Jacket",
        category: "jackets",
        categoryLabel: "Jackets",
        gender: "Unisex",
        price: 890.00,
        originalPrice: null,
        rating: 5.0,
        reviewsCount: 29,
        isNew: 1,
        isBestSeller: 1,
        onSale: 0,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([{ name: "Matte Black", hex: "#151515" }]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "An iconic luxury moto silhouette crafted from supple full-grain lambskin with hand-finished silver hardware.",
        details: JSON.stringify(["100% Full-Grain Vegetable-Tanned Lambskin"]),
        inStock: 1
      },
      {
        id: "val-03",
        name: "Italian Relaxed Linen Shirt",
        category: "shirts",
        categoryLabel: "Shirts",
        gender: "Men",
        price: 195.00,
        originalPrice: 240.00,
        rating: 4.8,
        reviewsCount: 42,
        isNew: 0,
        isBestSeller: 1,
        onSale: 1,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([{ name: "Warm Alabaster", hex: "#f5f3eb" }]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "Woven from certified European flax in Northern Italy, embracing relaxed elegance.",
        details: JSON.stringify(["100% Normandy Linen"]),
        inStock: 1
      },
      {
        id: "val-05",
        name: "Minimalist Supima Crewneck Tee",
        category: "t-shirts",
        categoryLabel: "T-Shirts",
        gender: "Unisex",
        price: 95.00,
        originalPrice: null,
        rating: 4.7,
        reviewsCount: 64,
        isNew: 0,
        isBestSeller: 1,
        onSale: 0,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([{ name: "Pure Chalk White", hex: "#ffffff" }]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "The definitive luxury foundation layer. Spun from extra-long staple California Supima cotton.",
        details: JSON.stringify(["100% Grade-A Supima Cotton", "220 GSM heavyweight jersey"]),
        inStock: 1
      },
      {
        id: "val-09",
        name: "Selvedge Raw Denim Slim Jean",
        category: "jeans",
        categoryLabel: "Jeans",
        gender: "Men",
        price: 280.00,
        originalPrice: null,
        rating: 4.9,
        reviewsCount: 48,
        isNew: 0,
        isBestSeller: 1,
        onSale: 0,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([{ name: "Deep Indigo", hex: "#1a273b" }]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "Spun on antique Japanese shuttle looms in Kojima, Okayama. 14.5 oz red-line selvedge.",
        details: JSON.stringify(["100% Okayama Cotton Selvedge"]),
        inStock: 1
      },
      {
        id: "val-13",
        name: "Handcrafted Chelsea Boots in Suede",
        category: "shoes",
        categoryLabel: "Shoes",
        gender: "Men",
        price: 490.00,
        originalPrice: null,
        rating: 5.0,
        reviewsCount: 52,
        isNew: 0,
        isBestSeller: 1,
        onSale: 0,
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify([{ name: "Snuff Tobacco", hex: "#5d4433" }]),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1000&q=85"
        ]),
        description: "Goodyear-welted by generational artisans in Tuscany from calf suede.",
        details: JSON.stringify(["Premium Italian Calfskin Reverse Suede"]),
        inStock: 1
      }
    ];

    const sql = `
      INSERT INTO products (
        id, name, category, categoryLabel, gender, price, originalPrice, rating,
        reviewsCount, isNew, isBestSeller, onSale, sizes, colors, images, description, details, inStock
      ) VALUES ?
    `;

    const values = defaults.map(p => [
      p.id, p.name, p.category, p.categoryLabel, p.gender, p.price, p.originalPrice,
      p.rating, p.reviewsCount, p.isNew, p.isBestSeller, p.onSale, p.sizes, p.colors,
      p.images, p.description, p.details, p.inStock
    ]);

    db.query(sql, [values], (err2) => {
      if (err2) console.error('Error seeding products to MySQL:', err2.message);
      else console.log('✅ Catalog seeded into MySQL database successfully.');
    });
  });
}

// Seed sample orders into MySQL
function seedSampleOrders() {
  db.query('SELECT COUNT(*) as count FROM orders', (err, rows) => {
    if (err || !rows || rows[0].count > 0) return;

    console.log('🌱 Seeding initial client order into MySQL...');
    const sampleOrder = {
      id: 'VAL-894120',
      customerName: 'Julian Sterling',
      email: 'julian.sterling@luxury.com',
      phone: '+1 (212) 555-0198',
      shippingAddress: '740 Madison Avenue, Penthouse 4B, New York, NY 10065, United States',
      paymentMethod: 'Credit Card (•••• 4242)',
      items: JSON.stringify([
        {
          productId: 'val-01',
          name: 'Structured Cashmere Wool Overcoat',
          category: 'Jackets',
          price: 680,
          image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85',
          size: 'L',
          color: 'Camel Tan',
          quantity: 1
        }
      ]),
      subtotal: 680.00,
      discount: 68.00,
      shippingFee: 0.00,
      tax: 30.60,
      total: 642.60,
      promoCode: 'VALENTI10',
      status: 'Processing',
      date: 'Oct 12, 2026, 02:45 PM',
      estimatedDelivery: 'Oct 16, 2026'
    };

    const sql = `
      INSERT INTO orders (
        id, customerName, email, phone, shippingAddress, paymentMethod, items,
        subtotal, discount, shippingFee, tax, total, promoCode, status, date, estimatedDelivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      sampleOrder.id, sampleOrder.customerName, sampleOrder.email, sampleOrder.phone,
      sampleOrder.shippingAddress, sampleOrder.paymentMethod, sampleOrder.items,
      sampleOrder.subtotal, sampleOrder.discount, sampleOrder.shippingFee, sampleOrder.tax,
      sampleOrder.total, sampleOrder.promoCode, sampleOrder.status, sampleOrder.date, sampleOrder.estimatedDelivery
    ], (err2) => {
      if (err2) console.error('Error seeding order:', err2.message);
      else console.log('✅ Sample order seeded into MySQL successfully.');
    });
  });
}

// ============================================================================
// REST API ENDPOINTS (CONNECTED TO MySQL)
// ============================================================================

// 1. GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database initializing or offline' });

  db.query('SELECT * FROM products ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(r => ({
      ...r,
      isNew: Boolean(r.isNew),
      isBestSeller: Boolean(r.isBestSeller),
      onSale: Boolean(r.onSale),
      inStock: Boolean(r.inStock),
      sizes: JSON.parse(r.sizes || '[]'),
      colors: JSON.parse(r.colors || '[]'),
      images: JSON.parse(r.images || '[]'),
      details: JSON.parse(r.details || '[]')
    }));
    res.json(parsed);
  });
});

// 2. CREATE PRODUCT (WITH PICTURE IN MySQL)
app.post('/api/products', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  const p = req.body;
  if (!p.name || !p.price || !p.category) {
    return res.status(400).json({ error: 'Name, price, and category are required.' });
  }

  const id = p.id || 'cust-' + Date.now().toString().slice(-6);

  const query = `
    INSERT INTO products (
      id, name, category, categoryLabel, gender, price, originalPrice, rating,
      reviewsCount, isNew, isBestSeller, onSale, sizes, colors, images, description, details, inStock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    id,
    p.name,
    p.category,
    p.categoryLabel || p.category,
    p.gender || 'Unisex',
    Number(p.price),
    p.originalPrice ? Number(p.originalPrice) : null,
    p.rating || 5.0,
    p.reviewsCount || 1,
    p.isNew ? 1 : 0,
    p.isBestSeller ? 1 : 0,
    p.onSale ? 1 : 0,
    JSON.stringify(p.sizes || ['M']),
    JSON.stringify(p.colors || []),
    JSON.stringify(p.images || []),
    p.description || '',
    JSON.stringify(p.details || []),
    p.inStock ? 1 : 0
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product successfully saved to MySQL database!', id });
  });
});

// 3. DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted from MySQL', affected: result.affectedRows });
  });
});

// 4. GET ALL ORDERS
app.get('/api/orders', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  db.query('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]')
    }));
    res.json(parsed);
  });
});

// 5. CREATE ORDER (FROM CHECKOUT)
app.post('/api/orders', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  const o = req.body;
  if (!o.id || !o.customerName || !o.total) {
    return res.status(400).json({ error: 'Order ID, customer name, and total are required.' });
  }

  const query = `
    INSERT INTO orders (
      id, customerName, email, phone, shippingAddress, paymentMethod, items,
      subtotal, discount, shippingFee, tax, total, promoCode, status, date, estimatedDelivery
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    o.id,
    o.customerName,
    o.email,
    o.phone || '',
    o.shippingAddress,
    o.paymentMethod || 'Credit Card',
    JSON.stringify(o.items || []),
    o.subtotal || 0,
    o.discount || 0,
    o.shippingFee || 0,
    o.tax || 0,
    o.total,
    o.promoCode || null,
    o.status || 'Confirmed',
    o.date || new Date().toLocaleString(),
    o.estimatedDelivery || ''
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order successfully recorded in MySQL database!', orderId: o.id });
  });
});

// 6. UPDATE ORDER STATUS (FROM ADMIN)
app.put('/api/orders/:id', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  const { status } = req.body;
  db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order status updated in MySQL!', status });
  });
});

// 7. DELETE ORDER
app.delete('/api/orders/:id', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  db.query('DELETE FROM orders WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order deleted from MySQL database' });
  });
});

// 8. DASHBOARD SUMMARY STATS
app.get('/api/stats', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database offline' });

  db.query('SELECT COUNT(*) as totalOrders, COALESCE(SUM(total), 0) as totalRevenue FROM orders', (err, orderRows) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query('SELECT COUNT(*) as totalProducts FROM products', (err2, prodRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        totalRevenue: Number(orderRows[0].totalRevenue || 0),
        totalOrders: Number(orderRows[0].totalOrders || 0),
        totalProducts: Number(prodRows[0].totalProducts || 0),
        databaseType: 'MySQL (valenti_atelier)'
      });
    });
  });
});

// Catch-all route to serve index.html for unknown web paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
setupMySQL();

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`✨ VALENTI ATELIER Server running at: http://localhost:${PORT}`);
  console.log(`🛍️ Storefront:  http://localhost:${PORT}/index.html`);
  console.log(`⚙️ Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🐬 Database:    MySQL (Database: ${DB_CONFIG.database})`);
  console.log('====================================================');
});
