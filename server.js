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
app.get('/api/products', (req, res) => {
  const sql = `SELECT id, nombre as name, descripcion as description, precio_costo, precio_venta, sku, categoria, image_url FROM productos ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      res.status(500).json({ error: 'Error al obtener los productos.' });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { nombre, descripcion, precio_costo, precio_venta, sku, categoria, image_url } = req.body;

  const pc = parseFloat(precio_costo);
  const pv = parseFloat(precio_venta);

  // Validacion robusta
  if (!nombre || !sku || isNaN(pc) || isNaN(pv)) {
    return res.status(400).json({ error: 'Los campos nombre, sku, precio_costo y precio_venta son obligatorios y deben ser números válidos.' });
  }

  const sql = `INSERT INTO productos (nombre, descripcion, precio_costo, precio_venta, sku, categoria, image_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [nombre, descripcion, pc, pv, sku, categoria, image_url], function(err) {
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

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_costo, precio_venta, sku, categoria, image_url } = req.body;

  const pc = parseFloat(precio_costo);
  const pv = parseFloat(precio_venta);

  if (!nombre || !sku || isNaN(pc) || isNaN(pv)) {
    return res.status(400).json({ error: 'Los campos nombre, sku, precio_costo y precio_venta son obligatorios y deben ser números válidos.' });
  }

  const sql = `UPDATE productos SET 
                 nombre = ?, 
                 descripcion = ?, 
                 precio_costo = ?, 
                 precio_venta = ?, 
                 sku = ?, 
                 categoria = ?, 
                 image_url = ?
               WHERE id = ?`;

  db.run(sql, [nombre, descripcion, pc, pv, sku, categoria, image_url, id], function(err) {
    if (err) {
      console.error('Error updating product:', err.message);
      if (err.message.includes('UNIQUE constraint failed: productos.sku')) {
        return res.status(409).json({ error: 'El SKU proporcionado ya existe en otro producto.' });
      }
      return res.status(500).json({ 
        error: 'Error al actualizar el producto.',
        db_error: err.message 
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto actualizado exitosamente.' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM productos WHERE id = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting product:', err.message);
      return res.status(500).json({ 
        error: 'Error al eliminar el producto.',
        db_error: err.message 
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto eliminado exitosamente.' });
  });
});

// Endpoints for Categories
app.get('/api/categories', (req, res) => {
  const sql = `SELECT id_categoria as id, nombre_categoria as name, descripcion as description FROM categorias ORDER BY id_categoria DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err.message);
      res.status(500).json({ error: 'Error al obtener las categorías.' });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El campo nombre es obligatorio.' });
  }

  const sql = `INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)`;

  db.run(sql, [name, description], function(err) {
    if (err) {
      console.error('Error inserting category:', err.message);
      if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'La categoría ya existe.' });
      }
      return res.status(500).json({ 
        error: 'Error al guardar la categoría.',
        db_error: err.message 
      });
    }
    res.status(201).json({
      message: 'Categoría agregada exitosamente.',
      categoryId: this.lastID
    });
  });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El campo nombre es obligatorio.' });
  }

  const sql = `UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?`;

  db.run(sql, [name, description, id], function(err) {
    if (err) {
      console.error('Error updating category:', err.message);
      return res.status(500).json({ 
        error: 'Error al actualizar la categoría.',
        db_error: err.message 
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ message: 'Categoría actualizada exitosamente.' });
  });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM categorias WHERE id_categoria = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting category:', err.message);
      return res.status(500).json({ 
        error: 'Error al eliminar la categoría.',
        db_error: err.message 
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ message: 'Categoría eliminada exitosamente.' });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});