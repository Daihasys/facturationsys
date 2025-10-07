const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.resolve(__dirname, 'database/facturacion.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// API Endpoints
app.post('/api/products', (req, res) => {
  const { nombre, descripcion, precio_costo, precio_venta, sku, categoria, imageUrl } = req.body;

  const pc = parseFloat(precio_costo);
  const pv = parseFloat(precio_venta);

  // Validacion robusta
  if (!nombre || !sku || isNaN(pc) || isNaN(pv)) {
    return res.status(400).json({ error: 'Los campos nombre, sku, precio_costo y precio_venta son obligatorios y deben ser números válidos.' });
  }

  const sql = `INSERT INTO productos (nombre, descripcion, precio_costo, precio_venta, sku, categoria, image_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [nombre, descripcion, pc, pv, sku, categoria, imageUrl], function(err) {
    if (err) {
      console.error('Error inserting product:', err.message);
      if (err.message.includes('UNIQUE constraint failed: productos.sku')) {
          return res.status(409).json({ error: 'El SKU proporcionado ya existe.' });
      }
      // Devuelve el error específico de la base de datos
      return res.status(500).json({ 
        error: 'Error al guardar el producto en la base de datos.',
        db_error: err.message 
      });
    }
    res.status(201).json({
      message: 'Producto agregado exitosamente.',
      productId: this.lastID
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});