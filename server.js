const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Connection ---
let db; // Use let to allow reopening
const dbPath = path.resolve(__dirname, 'database/facturacion.db');

function connectToDatabase() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      // Set a busy timeout to handle concurrent access gracefully
      db.configure('busyTimeout', 5000); // 5000ms = 5 seconds
    }
  });
}

connectToDatabase(); // Initial connection

// --- Backup Logic ---
const backupDir = path.resolve(__dirname, 'database/backups');
const dbSourcePath = dbPath;

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('[Backup] Created backup directory:', backupDir);
}

/**
 * Creates a timestamped backup of the database file using SQLite's online backup API.
 * @param {string} type - 'auto' or 'manual' for logging.
 * @param {function} [callback] - Optional callback(err, message).
 */
function createBackup(type = 'auto', callback) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  // Use the VACUUM INTO command for a safe, atomic backup.
  const sql = `VACUUM INTO ?`;

  db.run(sql, [backupFilePath], function(err) {
    if (err) {
      console.error(`[Backup] VACUUM INTO error on ${type} backup:`, err.message);
      if (callback) callback(err);
      // Clean up failed backup file
      fs.unlink(backupFilePath, () => {});
      return;
    }
    const successMsg = `Copia de seguridad '${backupFileName}' creada exitosamente.`;
    console.log(`[Backup] ${successMsg}`);
    if (callback) callback(null, successMsg);
  });
}

// --- Automatic Backup Scheduler ---
const twentyFourHours = 24 * 60 * 60 * 1000;
setInterval(() => {
  console.log('[Backup] Running scheduled automatic backup...');
  createBackup('auto');
}, twentyFourHours);
console.log('[Backup] Automatic daily backups scheduled.');


// --- API Endpoints ---

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
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(409).json({ 
          error: 'Este producto no se puede eliminar porque está asociado a una o más facturas.',
          db_error: err.message 
        });
      }
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

// Endpoint para obtener todas las ventas
app.get('/api/sales', (req, res) => {
  const sql = `
    SELECT 
      f.id, 
      f.total_usd, 
      f.estado, 
      f.fecha_factura, 
      u.nombre_completo as usuario_nombre
    FROM facturas f
    JOIN usuarios u ON f.usuario_id = u.id
    ORDER BY f.fecha_factura DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sales:', err.message);
      res.status(500).json({ error: 'Error al obtener las ventas.', db_error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint para obtener los detalles de una venta específica
app.get('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      fd.cantidad,
      fd.precio_unitario_usd,
      fd.subtotal_usd,
      p.nombre as producto_nombre,
      p.sku as producto_sku
    FROM factura_detalles fd
    JOIN productos p ON fd.producto_id = p.id
    WHERE fd.factura_id = ?
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error(`Error fetching details for sale ${id}:`, err.message);
      res.status(500).json({ error: 'Error al obtener los detalles de la venta.', db_error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint para anular una venta
app.put('/api/sales/:id/void', (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE facturas SET estado = 'Anulada' WHERE id = ? AND estado = 'Completada'`;

  db.run(sql, [id], function(err) {
    if (err) {
      console.error(`Error voiding sale ${id}:`, err.message);
      return res.status(500).json({ error: 'Error al anular la venta.', db_error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada o ya anulada.' });
    }
          res.json({ message: 'Venta anulada exitosamente.' });
        });
      });
    
    // Endpoint para obtener los datos de una venta para el ticket
    app.get('/api/sales/:id/ticket', (req, res) => {
      const { id } = req.params;
    
      const sql = `
        SELECT
          f.id as factura_id,
          f.total_usd,
          f.fecha_factura,
          u.nombre_completo as usuario_nombre,
          fd.cantidad,
          fd.precio_unitario_usd,
          fd.subtotal_usd,
          p.nombre as producto_nombre,
          p.sku as producto_sku
        FROM facturas f
        JOIN usuarios u ON f.usuario_id = u.id
        JOIN factura_detalles fd ON fd.factura_id = f.id
        JOIN productos p ON fd.producto_id = p.id
        WHERE f.id = ?
        ORDER BY p.nombre ASC
      `;
    
      db.all(sql, [id], (err, rows) => {
        if (err) {
          console.error(`Error fetching ticket data for sale ${id}:`, err.message);
          res.status(500).json({ error: 'Error al obtener los datos del ticket.', db_error: err.message });
          return;
        }
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Venta no encontrada.' });
        }
    
        // Agrupar los detalles de la factura
        const ticketData = {
          factura_id: rows[0].factura_id,
          total_usd: rows[0].total_usd,
          fecha_factura: rows[0].fecha_factura,
          usuario_nombre: rows[0].usuario_nombre,
          productos: rows.map(row => ({
            nombre: row.producto_nombre,
            sku: row.producto_sku,
            cantidad: row.cantidad,
            precio_unitario_usd: row.precio_unitario_usd,
            subtotal_usd: row.subtotal_usd,
          })),
        };
    
        res.json(ticketData);
      });
    });
    
    
    // Endpoint para crear una nueva venta
// Endpoint to get list of backups
app.get('/api/backups', (req, res) => {
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error('[Backup] Error reading backup directory:', err.message);
      return res.status(500).json({ error: 'No se pudo leer el directorio de backups.' });
    }

    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .map(file => {
        try {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return { filename: file, createdAt: stats.mtime, size: stats.size };
        } catch (statErr) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(backups);
  });
});

// Endpoint to create a manual backup
app.post('/api/backups/create', (req, res) => {
  createBackup('manual', (err, message) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo crear la copia de seguridad.' });
    }
    res.status(201).json({ message });
  });
});

// Endpoint to restore a backup
app.post('/api/backups/restore', (req, res) => {
  const { filename } = req.body;
  if (!filename || !filename.startsWith('backup-') || !filename.endsWith('.db')) {
    return res.status(400).json({ error: 'Nombre de archivo de backup inválido.' });
  }

  const backupFilePath = path.join(backupDir, filename);

  if (!fs.existsSync(backupFilePath)) {
    return res.status(404).json({ error: 'El archivo de backup no existe.' });
  }

  console.log('[Restore] Attempting to restore. Closing main DB connection...');
  db.close((err) => {
    if (err) {
      console.error('[Restore] Error closing the database for restore:', err.message);
      connectToDatabase(); // Attempt to reopen DB
      return res.status(500).json({ error: 'No se pudo cerrar la base de datos para restaurar. ¿Hay operaciones en curso?' });
    }
    console.log('[Restore] Database closed for restore.');

    fs.copyFile(backupFilePath, dbSourcePath, (copyErr) => {
      if (copyErr) {
        console.error('[Restore] Error restoring backup (copying file):', copyErr.message);
        connectToDatabase(); // CRITICAL: Reopen DB to make app usable again.
        return res.status(500).json({ error: 'Ocurrió un error al sobreescribir la base de datos.' });
      }

      console.log(`[Restore] Successfully restored database from: ${filename}`);
      connectToDatabase(); // Reopen connection after successful restore
      res.json({ message: 'Restauración completada. Se recomienda reiniciar la aplicación para asegurar que todos los componentes se actualicen.' });
    });
  });
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
