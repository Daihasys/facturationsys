require('dotenv').config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { notifyManualErrorReport, notifyAutomaticError } = require('./utils/telegram');
const { uploadBackup, getDropboxStatus, listDropboxBackups } = require('./utils/dropbox');


const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db; // Use let to allow reopening
const dbPath = path.resolve(__dirname, "database/facturacion.db");

function connectToDatabase() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
    } else {
      console.log("Connected to the SQLite database.");
      db.configure("busyTimeout", 5000);
    }
  });
}

connectToDatabase();

// Helper function for audit logging
function createAuditLog(userId, action, details) {
  const sql = `INSERT INTO bitacora_acciones (usuario_id, accion, detalles, fecha) VALUES (?, ?, ?, ?)`;
  const timestamp = new Date().toISOString();
  db.run(sql, [userId, action, details ? JSON.stringify(details) : null, timestamp], (err) => {
    if (err) {
      console.error("Error creating audit log:", err.message);
    }
  });
}




function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS preguntas_seguridad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pregunta TEXT NOT NULL UNIQUE
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS respuestas_seguridad_usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        pregunta_id INTEGER NOT NULL,
        respuesta TEXT NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (pregunta_id) REFERENCES preguntas_seguridad(id)
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS tasas_de_cambio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tasa REAL NOT NULL,
        fecha DATE NOT NULL,
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bitacora_acciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        accion TEXT NOT NULL,
        detalles TEXT,
        fecha TEXT NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    // Tabla de configuración de backups automáticos
    db.run(`
      CREATE TABLE IF NOT EXISTS backup_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled BOOLEAN NOT NULL DEFAULT 0,
        interval_value INTEGER NOT NULL DEFAULT 24,
        interval_unit TEXT NOT NULL DEFAULT 'hours',
        last_backup TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default exchange rate removed - system now relies on API data

    // Insert default backup config if not exists
    db.run(`INSERT OR IGNORE INTO backup_config (id, enabled, interval_value, interval_unit) VALUES (1, 0, 24, 'hours')`);

    const questions = [
      "¿Cuál es el nombre de tu primera mascota?",
      "¿Cuál es tu comida favorita?",
      "¿En qué ciudad naciste?",
      "¿Cuál es el nombre de soltera de tu madre?",
      "¿Cuál fue tu primer coche?",
    ];
    const sql = `INSERT OR IGNORE INTO preguntas_seguridad (pregunta) VALUES (?)`;
    questions.forEach((q) => {
      db.run(sql, [q]);
    });
  });
}

initializeDatabase();

// --- Backup Logic ---
const backupDir = path.resolve(__dirname, "database/backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Variables for automatic backups
let backupInterval = null;

function createBackup(userId, type = "auto", callback) {
  // Use Venezuela timezone (UTC-4) for backup filenames
  const now = new Date();
  const venezuelaTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  const timestamp = venezuelaTime.toISOString().replace(/[:.]/g, "-").replace("Z", "");
  const backupFileName = `backup-${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);
  const sql = `VACUUM INTO ?`;

  db.run(sql, [backupFilePath], function (err) {
    if (err) {
      console.error(`[Backup] Error on ${type} backup:`, err.message);
      if (callback) callback(err);
      return;
    }
    const successMsg = `Copia de seguridad '${backupFileName}' creada exitosamente.`;
    console.log(`[Backup] ${successMsg}`);

    // Update last_backup timestamp in config
    const updateSql = `UPDATE backup_config SET last_backup = ?, updated_at = ? WHERE id = 1`;
    const now = new Date().toISOString();
    db.run(updateSql, [now, now], (updateErr) => {
      if (updateErr) console.error('[Backup] Error updating last_backup:', updateErr.message);
    });

    createAuditLog(userId || 1, `Backup Creado (${type})`, { filename: backupFileName, type: type });

    // Cleanup old backups after creating new one
    cleanupOldBackups();

    // Upload to Dropbox cloud storage
    uploadBackup(backupFilePath).then(result => {
      if (result.success) {
        console.log(`[Backup] Cloud upload successful: ${result.path}`);
        createAuditLog(userId || 1, `Backup Subido a Dropbox`, { filename: backupFileName, cloudPath: result.path });
      } else {
        console.warn(`[Backup] Cloud upload failed: ${result.error}`);
      }
    }).catch(cloudErr => {
      console.error('[Backup] Cloud upload error:', cloudErr.message);
    });

    if (callback) callback(null, successMsg, backupFileName);
  });
}

// Cleanup old backups using 3-2-1 strategy
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith("backup-") && file.endsWith(".db"))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // Más reciente primero

    if (files.length <= 60) {
      return; // No hay necesidad de limpiar
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const toKeep = new Set();
    const categorized = {
      last24h: [],
      lastWeek: [],
      lastMonth: [],
      older: []
    };

    // Categorizar backups
    files.forEach(file => {
      if (file.mtime > oneDayAgo) {
        categorized.last24h.push(file);
      } else if (file.mtime > oneWeekAgo) {
        categorized.lastWeek.push(file);
      } else if (file.mtime > oneMonthAgo) {
        categorized.lastMonth.push(file);
      } else {
        categorized.older.push(file);
      }
    });

    // Últimas 24 horas: mantener máximo 30
    categorized.last24h.slice(0, 30).forEach(f => toKeep.add(f.path));

    // Última semana: 1 por día
    const dailyBackups = {};
    categorized.lastWeek.forEach(file => {
      const dateKey = file.mtime.toISOString().split('T')[0];
      if (!dailyBackups[dateKey] || file.mtime > dailyBackups[dateKey].mtime) {
        dailyBackups[dateKey] = file;
      }
    });
    Object.values(dailyBackups).forEach(f => toKeep.add(f.path));

    // Último mes: 1 por semana
    const weeklyBackups = {};
    categorized.lastMonth.forEach(file => {
      const weekKey = getWeekKey(file.mtime);
      if (!weeklyBackups[weekKey] || file.mtime > weeklyBackups[weekKey].mtime) {
        weeklyBackups[weekKey] = file;
      }
    });
    Object.values(weeklyBackups).forEach(f => toKeep.add(f.path));

    // Eliminar backups no necesarios
    let deletedCount = 0;
    files.forEach(file => {
      if (!toKeep.has(file.path)) {
        try {
          fs.unlinkSync(file.path);
          deletedCount++;
        } catch (err) {
          console.error(`[Backup Cleanup] Error deleting ${file.name}:`, err.message);
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`[Backup Cleanup] Eliminados ${deletedCount} backups antiguos. Mantenidos: ${toKeep.size}`);
    }
  } catch (err) {
    console.error('[Backup Cleanup] Error during cleanup:', err.message);
  }
}

// Helper function to get week key (year-week)
function getWeekKey(date) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}

// Load backup configuration from database
function loadBackupConfig(callback) {
  const sql = `SELECT * FROM backup_config WHERE id = 1`;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('[Backup Config] Error loading:', err.message);
      if (callback) callback(err, null);
      return;
    }
    if (callback) callback(null, row);
  });
}

// Convert interval to milliseconds
function getIntervalMilliseconds(value, unit) {
  const multipliers = {
    'minutes': 60 * 1000,
    'hours': 60 * 60 * 1000
  };
  return value * (multipliers[unit] || multipliers['hours']);
}

// Start automatic backups based on config
function startAutomaticBackups() {
  loadBackupConfig((err, config) => {
    if (err || !config) {
      console.error('[Backup] Cannot start automatic backups: config not loaded');
      return;
    }

    if (!config.enabled) {
      console.log('[Backup] Automatic backups are disabled');
      return;
    }

    // Stop existing interval if any
    if (backupInterval) {
      clearInterval(backupInterval);
    }

    const intervalMs = getIntervalMilliseconds(config.interval_value, config.interval_unit);
    const intervalText = `${config.interval_value} ${config.interval_unit}`;

    console.log(`[Backup] Starting automatic backups every ${intervalText}`);

    // Create initial backup immediately
    createBackup(1, 'auto (inicial)');

    // Set recurring backups
    backupInterval = setInterval(() => {
      createBackup(1, 'auto');
    }, intervalMs);
  });
}

// Stop automatic backups
function stopAutomaticBackups() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('[Backup] Automatic backups stopped');
  }
}

// Start automatic backups on server initialization
setTimeout(() => {
  loadBackupConfig((err, config) => {
    if (!err && config && config.enabled) {
      startAutomaticBackups();
    }
  });
}, 2000); // Wait 2 seconds for DB to be fully initialized

// --- Authentication Endpoints ---
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  const userSql = `
    SELECT u.id, u.nombre_usuario, u.nombre_completo, u.contrasena, u.rol_id, r.nombre as role
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.nombre_usuario = ?
  `;

  db.get(userSql, [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.contrasena);

    if (passwordMatch) {
      // Si la contraseña es correcta, busca los permisos del rol
      const permissionsSql = `
        SELECT p.name FROM permissions p
        JOIN rol_permisos rp ON p.id = rp.permission_id
        WHERE rp.rol_id = ?
      `;
      db.all(permissionsSql, [user.rol_id], (permErr, permissions) => {
        if (permErr) {
          console.error("Error fetching permissions:", permErr);
          return res.status(500).json({ error: "Error al obtener los permisos del usuario." });
        }

        const permissionNames = permissions.map(p => p.name);

        res.json({
          message: "Inicio de sesión exitoso.",
          userId: user.id,
          name: user.nombre_completo,
          username: user.nombre_usuario,
          role: user.role || 'Sin rol',
          permissions: permissionNames,
        });
        createAuditLog(user.id, "Inicio de Sesión", { username: user.nombre_usuario });
      });
    } else {
      res.status(401).json({ error: "Credenciales inválidas." });
    }
  });
});


app.post("/api/auth/logout", (req, res) => {
  const { userId, username } = req.body;
  if (userId) {
    createAuditLog(userId, "Cierre de Sesión", { username: username || "Desconocido" });
  }
  res.json({ message: "Sesión cerrada exitosamente." });
});


app.get("/api/security-questions", (req, res) => {
  const sql = `SELECT id, pregunta FROM preguntas_seguridad`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener las preguntas de seguridad." });
      return;
    }
    res.json(rows);
  });
});

app.get("/api/users/:username/security-questions", (req, res) => {
  const { username } = req.params;
  const sql = `
    SELECT ps.id, ps.pregunta FROM preguntas_seguridad ps
    JOIN respuestas_seguridad_usuario rsu ON ps.id = rsu.pregunta_id
    JOIN usuarios u ON rsu.usuario_id = u.id
    WHERE u.nombre_usuario = ?
  `;
  db.all(sql, [username], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener las preguntas de seguridad del usuario." });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/auth/recover-password", async (req, res) => {
  const { username, newPassword, answers } = req.body;

  if (!username || !newPassword || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Datos inválidos." });
  }

  const getAnswersSql = `
    SELECT rsu.respuesta FROM respuestas_seguridad_usuario rsu
    JOIN usuarios u ON rsu.usuario_id = u.id
    WHERE u.nombre_usuario = ? ORDER BY rsu.pregunta_id
  `;

  db.all(getAnswersSql, [username], async (err, storedAnswers) => {
    if (err || storedAnswers.length !== answers.length) {
      return res.status(400).json({ error: "Error en las respuestas." });
    }

    const allAnswersMatch = await Promise.all(
      storedAnswers.map((stored, index) => bcrypt.compare(answers[index], stored.respuesta))
    ).then((results) => results.every(Boolean));

    if (allAnswersMatch) {
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      const updateSql = `UPDATE usuarios SET contrasena = ? WHERE nombre_usuario = ?`;
      db.run(updateSql, [hashedPassword, username], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: "Error al actualizar la contraseña." });
        }
        res.json({ message: "Contraseña actualizada exitosamente." });

        // Get user ID for audit log
        db.get(`SELECT id FROM usuarios WHERE nombre_usuario = ?`, [username], (err, row) => {
          if (row) {
            createAuditLog(row.id, "Recuperación de Contraseña", { username: username });
          }
        });
      });
    } else {
      res.status(401).json({ error: "Las respuestas de seguridad no coinciden." });
    }
  });
});

// --- API Endpoints ---

// Products
app.get("/api/products", (req, res) => {
  const sql = `SELECT id, nombre as name, descripcion as description, precio_costo, precio_venta, barcode, categoria, image_url FROM productos ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los products." });
      return;
    }
    res.json(rows);
  });
});

app.get("/api/products/check-barcode/:barcode", (req, res) => {
  const { barcode } = req.params;
  const sql = `SELECT id FROM productos WHERE barcode = ?`;
  db.get(sql, [barcode], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al verificar el código de barras." });
    }
    res.json({ exists: !!row });
  });
});

app.post("/api/products", (req, res) => {
  const { nombre, descripcion, precio_costo, precio_venta, barcode, categoria, image_url } = req.body;
  const sql = `INSERT INTO productos (nombre, descripcion, precio_costo, precio_venta, barcode, categoria, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [nombre, descripcion, precio_costo, precio_venta, barcode, categoria, image_url], function (err) {
    if (err) {
      console.error("Error al guardar el producto:", err.message);
      return res.status(500).json({ error: "Error al guardar el producto.", details: err.message });
    }
    res.status(201).json({ message: "Producto agregado exitosamente.", productId: this.lastID });
    createAuditLog(1, "Producto Creado", { newProductId: this.lastID, name: nombre });
  });
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_costo, precio_venta, barcode, categoria, image_url } = req.body;
  const sql = `UPDATE productos SET nombre = ?, descripcion = ?, precio_costo = ?, precio_venta = ?, barcode = ?, categoria = ?, image_url = ? WHERE id = ?`;
  db.run(sql, [nombre, descripcion, precio_costo, precio_venta, barcode, categoria, image_url, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al actualizar el producto." });
    }
    res.json({ message: "Producto actualizado exitosamente." });
    createAuditLog(1, "Producto Actualizado", { updatedProductId: id, name: nombre });
  });
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;

  // PASO 1: Verificar si tiene ventas asociadas
  const checkSql = `SELECT COUNT(*) as count FROM factura_detalles WHERE producto_id = ?`;

  db.get(checkSql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al verificar producto." });
    }

    const ventasCount = row.count;

    if (ventasCount > 0) {
      // PASO 2a: Tiene ventas - Desligar FK y borrar
      db.serialize(() => {
        // Desligar FK (permitir NULL en producto_id)
        db.run(`UPDATE factura_detalles SET producto_id = NULL WHERE producto_id = ?`, [id], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: "Error al actualizar historial de ventas." });
          }

          // Ahora sí borrar el producto
          db.run(`DELETE FROM productos WHERE id = ?`, [id], function (deleteErr) {
            if (deleteErr) {
              return res.status(500).json({ error: "Error al eliminar el producto." });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "Producto no encontrado." });
            }

            res.json({
              success: true,
              message: `Producto eliminado exitosamente. ${ventasCount} venta(s) histórica(s) preservada(s).`,
              preservedSales: ventasCount
            });

            createAuditLog(1, "Producto Eliminado", {
              deletedProductId: id,
              preservedSales: ventasCount
            });
          });
        });
      });
    } else {
      // PASO 2b: No tiene ventas - Borrar directo
      db.run(`DELETE FROM productos WHERE id = ?`, [id], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: "Error al eliminar el producto." });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Producto no encontrado." });
        }

        res.json({
          success: true,
          message: "Producto eliminado exitosamente."
        });

        createAuditLog(1, "Producto Eliminado", { deletedProductId: id });
      });
    }
  });
});

// Categories
app.get("/api/categories", (req, res) => {
  const sql = `SELECT id_categoria as id, nombre_categoria as name, descripcion as description FROM categorias ORDER BY id_categoria DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener las categorías." });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { name, description } = req.body;
  const sql = `INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)`;
  db.run(sql, [name, description], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al guardar la categoría." });
    }
    res.status(201).json({ message: "Categoría agregada exitosamente.", categoryId: this.lastID });
    createAuditLog(1, "Categoría Creada", { newCategoryId: this.lastID, name: name });
  });
});

app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const sql = `UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?`;
  db.run(sql, [name, description, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al actualizar la categoría." });
    }
    res.json({ message: "Categoría actualizada exitosamente." });
    createAuditLog(1, "Categoría Actualizada", { updatedCategoryId: id, name: name });
  });
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;

  // PASO 1: Obtener nombre de categoría
  db.get(`SELECT nombre_categoria FROM categorias WHERE id_categoria = ?`, [id], (err, category) => {
    if (err) {
      return res.status(500).json({ error: "Error al buscar categoría." });
    }

    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    // PASO 2: Verificar productos asociados
    const checkSql = `SELECT COUNT(*) as count FROM productos WHERE categoria = ?`;

    db.get(checkSql, [category.nombre_categoria], (checkErr, row) => {
      if (checkErr) {
        return res.status(500).json({ error: "Error al verificar productos asociados." });
      }

      const productCount = row.count;

      if (productCount > 0) {
        // Bloquear borrado - tiene productos
        return res.status(400).json({
          error: "CATEGORY_HAS_PRODUCTS",
          count: productCount,
          categoryName: category.nombre_categoria,
          message: `No se puede eliminar "${category.nombre_categoria}" porque tiene ${productCount} producto(s) asociado(s).`
        });
      }

      // PASO 3: Categoría vacía - borrar
      db.run(`DELETE FROM categorias WHERE id_categoria = ?`, [id], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: "Error al eliminar la categoría." });
        }

        res.json({
          success: true,
          message: "Categoría eliminada exitosamente."
        });

        createAuditLog(1, "Categoría Eliminada", {
          deletedCategoryId: id,
          categoryName: category.nombre_categoria
        });
      });
    });
  });
});

// Sales
app.get("/api/sales", (req, res) => {
  const sql = `SELECT f.id, f.total_usd, f.estado, f.fecha_factura, f.ticket_impreso, u.nombre_completo as usuario_nombre
    FROM facturas f JOIN usuarios u ON f.usuario_id = u.id ORDER BY f.fecha_factura DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener las ventas." });
      return;
    }
    res.json(rows);
  });
});

// Get ticket data for printing - MUST come before /api/sales/:id
app.get("/api/sales/:id/ticket", (req, res) => {
  const { id } = req.params;

  // Get factura data
  const facturaSql = `SELECT f.id as factura_id, f.total_usd, f.fecha_factura, u.nombre_completo as usuario_nombre
    FROM facturas f JOIN usuarios u ON f.usuario_id = u.id WHERE f.id = ?`;

  db.get(facturaSql, [id], (err, factura) => {
    if (err || !factura) {
      return res.status(404).json({ error: "Factura no encontrada." });
    }

    // Get products
    const productosSql = `SELECT fd.cantidad, fd.precio_unitario_usd, fd.subtotal_usd, p.nombre
      FROM factura_detalles fd JOIN productos p ON fd.producto_id = p.id WHERE fd.factura_id = ?`;

    db.all(productosSql, [id], (prodErr, productos) => {
      if (prodErr) {
        return res.status(500).json({ error: "Error al obtener productos de la factura." });
      }

      res.json({
        factura_id: factura.factura_id,
        total_usd: factura.total_usd,
        fecha_factura: factura.fecha_factura,
        usuario_nombre: factura.usuario_nombre,
        productos: productos
      });
    });
  });
});

app.get("/api/sales/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT fd.cantidad, fd.precio_unitario_usd, fd.subtotal_usd, p.nombre as producto_nombre, p.barcode as producto_barcode
    FROM factura_detalles fd JOIN productos p ON fd.producto_id = p.id WHERE fd.factura_id = ?`;
  db.all(sql, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los detalles de la venta." });
      return;
    }
    res.json(rows);
  });
});

// Create new sale
app.post("/api/sales", (req, res) => {
  const { userId, cart, total } = req.body;

  if (!userId || !cart || !Array.isArray(cart) || cart.length === 0 || !total) {
    return res.status(400).json({ error: "Datos de venta inválidos." });
  }

  // Get the most recent exchange rate (ordered by timestamp)
  const getTasaSql = `SELECT id, tasa FROM tasas_de_cambio ORDER BY fecha_hora DESC LIMIT 1`;

  db.get(getTasaSql, [], (err, tasaRow) => {
    if (err) {
      console.error("Error getting exchange rate:", err);
      return res.status(500).json({ error: "Error al obtener la tasa de cambio." });
    }

    // If no exchange rate exists, create a default one
    let tasa_id = 1;
    let tasa = 1.0;

    if (tasaRow) {
      tasa_id = tasaRow.id;
      tasa = tasaRow.tasa;
    }

    const total_usd = parseFloat(total);
    const total_ves = total_usd * tasa;

    // Start transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Insert factura
      const insertFacturaSql = `INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado) VALUES (?, ?, ?, ?, 'Completada')`;

      db.run(insertFacturaSql, [userId, tasa_id, total_usd, total_ves], function (facturaErr) {
        if (facturaErr) {
          db.run("ROLLBACK");
          console.error("Error creating factura:", facturaErr);
          return res.status(500).json({ error: "Error al crear la factura." });
        }

        const facturaId = this.lastID;

        // Insert factura_detalles WITH product snapshot
        const insertDetalleSql = `
          INSERT INTO factura_detalles (
            factura_id, producto_id, cantidad, precio_unitario_usd, subtotal_usd,
            nombre_producto, descripcion_producto, categoria_producto, barcode_producto
          )
          SELECT ?, id, ?, ?, ?,
                 nombre, descripcion, categoria, barcode
          FROM productos 
          WHERE id = ?
        `;

        let hasError = false;
        let processedItems = 0;

        cart.forEach((item) => {
          const subtotal = item.price * item.quantity;
          db.run(
            insertDetalleSql,
            [facturaId, item.quantity, item.price, subtotal, item.id],
            (detalleErr) => {
              if (detalleErr) {
                hasError = true;
                console.error("Error inserting detail:", detalleErr);
              }

              processedItems++;

              // Check if all items processed
              if (processedItems === cart.length) {
                if (hasError) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: "Error al guardar los detalles de la venta." });
                }

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "Error al confirmar la venta." });
                  }

                  createAuditLog(userId, "Venta Creada", { facturaId: facturaId, total_usd: total_usd });
                  res.status(201).json({
                    message: "Venta registrada exitosamente.",
                    saleId: facturaId,
                    total: total_usd
                  });
                });
              }
            }
          );
        });
      });
    });
  });
});

app.put("/api/sales/:id/void", (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE facturas SET estado = 'Anulada' WHERE id = ? AND estado = 'Completada'`;
  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al anular la venta." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Venta no encontrada o ya anulada." });
    }
    res.json({ message: "Venta anulada exitosamente." });
    createAuditLog(1, "Venta Anulada", { voidedSaleId: id });
  });
});

// Get sale ticket data with print status
app.get("/api/sales/:id/ticket", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      f.id as factura_id,
      f.total_usd,
      f.fecha_factura,
      f.ticket_impreso,
      u.nombre_completo as usuario_nombre
    FROM facturas f
    JOIN usuarios u ON f.usuario_id = u.id
    WHERE f.id = ?
  `;

  db.get(sql, [id], (err, factura) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener la factura." });
    }

    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada." });
    }

    // Get productos for this sale - usa snapshots si producto fue borrado
    const productosSql = `
      SELECT 
        fd.cantidad,
        fd.precio_unitario_usd,
        fd.subtotal_usd,
        COALESCE(fd.nombre_producto, p.nombre) as nombre,
        COALESCE(fd.descripcion_producto, p.descripcion) as descripcion
      FROM factura_detalles fd
      LEFT JOIN productos p ON fd.producto_id = p.id
      WHERE fd.factura_id = ?
    `;

    db.all(productosSql, [id], (prodErr, productos) => {
      if (prodErr) {
        return res.status(500).json({ error: "Error al obtener productos." });
      }

      res.json({
        ...factura,
        productos
      });
    });
  });
});

// Mark ticket as printed
app.post("/api/sales/:id/mark-printed", (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE facturas SET ticket_impreso = 1 WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al marcar ticket." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Factura no encontrada." });
      }

      res.json({ success: true, message: "Ticket marcado como impreso." });
    }
  );
});


// Dashboard Statistics Endpoints

// Get daily sales for specific user
app.get("/api/sales/daily/:userId", (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const sql = `
    SELECT 
      COUNT(*) as numeroTransacciones,
      ROUND(COALESCE(SUM(total_usd), 0), 2) as totalVentas
    FROM facturas
    WHERE usuario_id = ? 
      AND DATE(fecha_factura) = ?
      AND estado = 'Completada'
  `;

  db.get(sql, [userId, today], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener ventas diarias." });
    }

    const promedioVenta = row.numeroTransacciones > 0
      ? row.totalVentas / row.numeroTransacciones
      : 0;

    res.json({
      totalVentas: parseFloat(row.totalVentas || 0),
      numeroTransacciones: row.numeroTransacciones || 0,
      promedioVenta: parseFloat(promedioVenta.toFixed(2))
    });
  });
});

// Get weekly sales for specific user
app.get("/api/sales/weekly/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      CASE CAST(strftime('%w', fecha_factura) AS INTEGER)
        WHEN 0 THEN 'Dom'
        WHEN 1 THEN 'Lun'
        WHEN 2 THEN 'Mar'
        WHEN 3 THEN 'Mié'
        WHEN 4 THEN 'Jue'
        WHEN 5 THEN 'Vie'
        WHEN 6 THEN 'Sáb'
      END as day,
      strftime('%w', fecha_factura) as dayNum,
      COUNT(*) as ventas,
      ROUND(COALESCE(SUM(total_usd), 0), 2) as total
    FROM facturas
    WHERE usuario_id = ? 
      AND DATE(fecha_factura) >= DATE('now', '-7 days')
      AND estado = 'Completada'
    GROUP BY dayNum
    ORDER BY dayNum
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener ventas semanales." });
    }

    // Crear array con todos los días de la semana
    const daysMap = {
      1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue',
      5: 'Vie', 6: 'Sáb', 0: 'Dom'
    };

    const weekData = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
      const dayData = rows.find(r => parseInt(r.dayNum) === dayNum);
      return {
        day: daysMap[dayNum],
        ventas: dayData ? dayData.ventas : 0,
        total: dayData ? parseFloat(dayData.total).toFixed(2) : "0.00"
      };
    });

    res.json(weekData);
  });
});

// Get monthly sales (all users)
app.get("/api/dashboard/monthly-sales", (req, res) => {
  const months = parseInt(req.query.months) || 6;

  const sql = `
    SELECT 
      CASE CAST(strftime('%m', fecha_factura) AS INTEGER)
        WHEN 1 THEN 'Ene' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Abr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
        WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Sep'
        WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dic'
      END as name,
      strftime('%m', fecha_factura) as monthNum,
      COUNT(*) as ventas
    FROM facturas
    WHERE DATE(fecha_factura) >= DATE('now', '-${months} months')
      AND estado = 'Completada'
    GROUP BY monthNum
    ORDER BY monthNum
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener ventas mensuales." });
    }
    res.json(rows);
  });
});

// Get best sellers
app.get("/api/dashboard/best-sellers", (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const sql = `
    SELECT 
      p.nombre as name,
      SUM(fd.cantidad) as sold
    FROM factura_detalles fd
    JOIN productos p ON fd.producto_id = p.id
    JOIN facturas f ON fd.factura_id = f.id
    WHERE f.estado = 'Completada'
    GROUP BY fd.producto_id
    ORDER BY sold DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener productos más vendidos." });
    }
    res.json(rows);
  });
});

// Get sales by user (top users)
app.get("/api/dashboard/sales-by-user", (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const period = req.query.period || 'day'; // day, week, month

  let dateFilter = "";
  if (period === 'day') {
    dateFilter = "AND DATE(f.fecha_factura) = DATE('now')";
  } else if (period === 'week') {
    dateFilter = "AND DATE(f.fecha_factura) >= DATE('now', '-7 days')";
  } else if (period === 'month') {
    dateFilter = "AND DATE(f.fecha_factura) >= DATE('now', 'start of month')";
  }

  // Color palette for users
  const colors = ['#1d3552', '#264264', '#3b6395', '#5287c9', '#a0bcec'];

  const sql = `
    SELECT 
      u.nombre_usuario as name,
      ROUND(COALESCE(SUM(f.total_usd), 0), 2) as value
    FROM usuarios u
    LEFT JOIN facturas f ON u.id = f.usuario_id AND f.estado = 'Completada' ${dateFilter}
    GROUP BY u.id
    HAVING value > 0
    ORDER BY value DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener ventas por usuario." });
    }

    const result = rows.map((row, index) => ({
      name: row.name,
      value: parseFloat(row.value),
      fill: colors[index % colors.length]
    }));

    res.json(result);
  });
});

// Get daily profit
app.get("/api/dashboard/daily-profit", (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const sql = `
    SELECT 
      ROUND(COALESCE(SUM(fd.subtotal_usd), 0), 2) as totalVentas,
      ROUND(COALESCE(SUM(fd.cantidad * p.precio_costo), 0), 2) as totalCosto
    FROM factura_detalles fd
    JOIN productos p ON fd.producto_id = p.id
    JOIN facturas f ON fd.factura_id = f.id
    WHERE DATE(f.fecha_factura) = ?
      AND f.estado = 'Completada'
  `;

  db.get(sql, [today], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al calcular ganancia del día." });
    }

    const ganancia = (row.totalVentas - row.totalCosto).toFixed(2);
    res.json({ ganancia: parseFloat(ganancia) });
  });
});

// Get monthly total
app.get("/api/dashboard/monthly-total", (req, res) => {
  const sql = `
    SELECT ROUND(COALESCE(SUM(total_usd), 0), 2) as total
    FROM facturas
    WHERE DATE(fecha_factura) >= DATE('now', 'start of month')
      AND estado = 'Completada'
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al calcular total facturado del mes." });
    }

    res.json({ total: parseFloat(row.total).toFixed(2) });
  });
});


// Reports Endpoints

// Get all sales (with optional date filtering)
app.get("/api/reports/sales", (req, res) => {
  const { startDate, endDate } = req.query;

  let sql = `
    SELECT 
      f.id,
      DATE(f.fecha_factura) as fecha,
      ROUND(f.total_usd, 2) as montoUSD,
      ROUND(f.total_ves, 2) as montoBS,
      u.nombre_usuario as usuario
    FROM facturas f
    JOIN usuarios u ON f.usuario_id = u.id
    WHERE f.estado = 'Completada'
  `;

  const params = [];

  if (startDate && endDate) {
    sql += ` AND DATE(f.fecha_factura) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  sql += ` ORDER BY f.fecha_factura DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener historial de ventas." });
    }
    res.json(rows);
  });
});

// Get sales aggregated for charts (daily/weekly/monthly)
app.get("/api/reports/sales/chart/:timeframe", (req, res) => {
  const { timeframe } = req.params;

  let sql;

  switch (timeframe) {
    case 'diario':
      sql = `
        SELECT 
          CASE CAST(strftime('%w', fecha_factura) AS INTEGER)
            WHEN 0 THEN 'Dom' WHEN 1 THEN 'Lun' WHEN 2 THEN 'Mar'
            WHEN 3 THEN 'Mié' WHEN 4 THEN 'Jue' WHEN 5 THEN 'Vie' WHEN 6 THEN 'Sáb'
          END as name,
          ROUND(SUM(total_usd), 2) as ventas
        FROM facturas
        WHERE DATE(fecha_factura) >= DATE('now', '-7 days')
          AND estado = 'Completada'
        GROUP BY name
        ORDER BY strftime('%w', fecha_factura)
      `;
      break;
    case 'semanal':
      sql = `
        SELECT 
          'Sem ' || ((strftime('%j', fecha_factura)-1)/7 + 1) as name,
          ROUND(SUM(total_usd), 2) as ventas
        FROM facturas
        WHERE DATE(fecha_factura) >= DATE('now', '-28 days')
          AND estado = 'Completada'
        GROUP BY name
        ORDER BY fecha_factura
        LIMIT 4
      `;
      break;
    case 'mensual':
      sql = `
        SELECT 
          CASE CAST(strftime('%m', fecha_factura) AS INTEGER)
            WHEN 1 THEN 'Ene' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
            WHEN 4 THEN 'Abr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
            WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Sep'
            WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dic'
          END as name,
          ROUND(SUM(total_usd), 2) as ventas
        FROM facturas
        WHERE DATE(fecha_factura) >= DATE('now', '-6 months')
          AND estado = 'Completada'
        GROUP BY strftime('%m', fecha_factura)
        ORDER BY fecha_factura
      `;
      break;
    default:
      return res.status(400).json({ error: "Timeframe inválido" });
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener datos de gráfica." });
    }
    res.json(rows);
  });
});

// Get all products for reports
app.get("/api/reports/products", (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.nombre as name,
      p.descripcion,
      p.barcode,
      p.categoria,
      ROUND(p.precio_costo, 2) as precio_costo,
      ROUND(p.precio_venta, 2) as precio_venta,
      COALESCE(SUM(fd.cantidad), 0) as sold
    FROM productos p
    LEFT JOIN factura_detalles fd ON p.id = fd.producto_id
    LEFT JOIN facturas f ON fd.factura_id = f.id AND f.estado = 'Completada'
    GROUP BY p.id
    ORDER BY p.id ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener productos." });
    }
    res.json(rows);
  });
});





// Dollar History Endpoints - Removed duplicate endpoint, using the one below at line ~1770

// Backups
app.get("/api/backups", (req, res) => {
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo leer el directorio de backups." });
    }
    const backups = files
      .filter(file => file.startsWith("backup-") && file.endsWith(".db"))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return { filename: file, createdAt: stats.mtime, size: stats.size };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json(backups);
  });
});

app.post("/api/backups/create", (req, res) => {
  // req.body may be undefined if Content-Type is not application/json
  const userId = (req.body && req.body.userId) ? req.body.userId : 1;
  createBackup(userId, "manual", (err, message) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo crear la copia de seguridad." });
    }
    res.status(201).json({ message });
    // Note: createAuditLog is called internally by createBackup
  });
});

app.post("/api/backups/restore", (req, res) => {
  const { filename } = req.body;
  const backupFilePath = path.join(backupDir, filename);

  if (!fs.existsSync(backupFilePath)) {
    return res.status(404).json({ error: "El archivo de backup no existe." });
  }

  db.close(err => {
    if (err) {
      return res.status(500).json({ error: "No se pudo cerrar la base de datos para restaurar." });
    }
    fs.copyFile(backupFilePath, dbPath, (copyErr) => {
      connectToDatabase(); // Reconnect regardless of outcome
      if (copyErr) {
        return res.status(500).json({ error: "Ocurrió un error al restaurar la base de datos." });
      }
      res.json({ message: "Restauración completada." });
    });
  });
});

// Backup Configuration Endpoints
app.get("/api/settings/backup-config", (req, res) => {
  loadBackupConfig((err, config) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener configuración de backups." });
    }
    res.json({
      enabled: Boolean(config.enabled),
      interval_value: config.interval_value,
      interval_unit: config.interval_unit,
      last_backup: config.last_backup
    });
  });
});

app.post("/api/settings/backup-config", (req, res) => {
  const { enabled, interval_value, interval_unit } = req.body;

  // Validations
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "'enabled' debe ser un valor booleano." });
  }

  if (!interval_value || interval_value < 1) {
    return res.status(400).json({ error: "El intervalo debe ser mayor a 0." });
  }

  if (!['minutes', 'hours'].includes(interval_unit)) {
    return res.status(400).json({ error: "La unidad debe ser 'minutes' o 'hours'." });
  }

  // Additional validations for reasonable ranges
  if (interval_unit === 'minutes' && (interval_value < 8 || interval_value > 1440)) {
    return res.status(400).json({ error: "El intervalo en minutos debe estar entre 8 y 1440 (24 horas)." });
  }

  if (interval_unit === 'hours' && (interval_value < 1 || interval_value > 72)) {
    return res.status(400).json({ error: "El intervalo en horas debe estar entre 1 y 72 (3 días)." });
  }

  const updateSql = `UPDATE backup_config SET enabled = ?, interval_value = ?, interval_unit = ?, updated_at = ? WHERE id = 1`;
  const now = new Date().toISOString();

  db.run(updateSql, [enabled ? 1 : 0, interval_value, interval_unit, now], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al actualizar la configuración." });
    }

    // Stop current backups
    stopAutomaticBackups();

    // Start backups if enabled
    if (enabled) {
      setTimeout(() => startAutomaticBackups(), 500);
    }

    createAuditLog(1, "Configuración de Backup Actualizada", { enabled, interval_value, interval_unit });
    res.json({ message: "Configuración actualizada exitosamente." });
  });
});

// Users
app.get("/api/users", (req, res) => {
  const sql = `SELECT u.id, u.nombre_completo, u.nombre_usuario, u.cedula, u.telefono, r.nombre as role
               FROM usuarios u JOIN roles r ON u.rol_id = r.id ORDER BY u.id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los usuarios." });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/users", async (req, res) => {
  const { nombre_usuario, nombre_completo, cedula, telefono, password, role, answers } = req.body;

  if (!nombre_usuario || !nombre_completo || !cedula || !telefono || !password || !role) {
    return res.status(400).json({
      error: "Los campos nombre de usuario, nombre completo, cédula, teléfono, contraseña y rol son obligatorios.",
    });
  }

  if (!answers || !Array.isArray(answers) || answers.some(a => !a.answer.trim() || !a.question_id)) {
    return res.status(400).json({ error: "Todas las respuestas de seguridad y sus preguntas asociadas son obligatorias." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get role_id
    const roleRow = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM roles WHERE nombre = ?`, [role], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!roleRow) {
      return res.status(400).json({ error: "Rol especificado no encontrado." });
    }

    const rol_id = roleRow.id;

    const userInsertSql = `INSERT INTO usuarios (nombre_usuario, nombre_completo, cedula, telefono, contrasena, rol_id) VALUES (?, ?, ?, ?, ?, ?)`;

    const userId = await new Promise((resolve, reject) => {
      db.run(userInsertSql, [nombre_usuario, nombre_completo, cedula, telefono, hashedPassword, rol_id], function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    for (const answer of answers) {
      const hashedSecurityAnswer = await bcrypt.hash(answer.answer, saltRounds);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO respuestas_seguridad_usuario (usuario_id, pregunta_id, respuesta) VALUES (?, ?, ?)`,
          [userId, answer.question_id, hashedSecurityAnswer],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.status(201).json({ message: "Usuario creado exitosamente.", userId: userId });
    createAuditLog(1, "Usuario Creado", { newUserId: userId, username: nombre_usuario });

  } catch (error) {
    console.error("Error creating user:", error.message);
    // Check for unique constraint errors
    if (error.message.includes("UNIQUE constraint failed: usuarios.cedula")) {
      return res.status(400).json({ error: "La cédula ya está registrada." });
    }
    if (error.message.includes("UNIQUE constraint failed: usuarios.telefono")) {
      return res.status(400).json({ error: "El teléfono ya está registrado." });
    }
    if (error.message.includes("UNIQUE constraint failed: usuarios.nombre_usuario")) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
    }
    res.status(500).json({ error: "Error al crear el usuario." });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, cedula, telefono, password, role } = req.body;

  if (!nombre_completo || !cedula || !telefono || !role) {
    return res.status(400).json({
      error: "Los campos nombre completo, cédula, teléfono y rol son obligatorios.",
    });
  }

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Get role_id
    const roleRow = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM roles WHERE nombre = ?`, [role], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!roleRow) {
      return res.status(400).json({ error: "Rol especificado no encontrado." });
    }

    const rol_id = roleRow.id;

    let userUpdateSql = `UPDATE usuarios SET nombre_completo = ?, cedula = ?, telefono = ?, rol_id = ?`;
    let params = [nombre_completo, cedula, telefono, rol_id];

    if (hashedPassword) {
      userUpdateSql += `, contrasena = ?`;
      params.push(hashedPassword);
    }
    userUpdateSql += ` WHERE id = ?`;
    params.push(id);

    const changes = await new Promise((resolve, reject) => {
      db.run(userUpdateSql, params, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    if (changes === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ message: "Usuario actualizado exitosamente." });
    createAuditLog(1, "Usuario Actualizado", { updatedUserId: id, nombre_completo: nombre_completo });

  } catch (error) {
    console.error("Error updating user:", error.message);
    if (error.message.includes("UNIQUE constraint failed: usuarios.cedula")) {
      return res.status(400).json({ error: "La cédula ya está registrada para otro usuario." });
    }
    if (error.message.includes("UNIQUE constraint failed: usuarios.telefono")) {
      return res.status(400).json({ error: "El teléfono ya está registrado para otro usuario." });
    }
    res.status(500).json({ error: "Error al actualizar el usuario." });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM usuarios WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al eliminar el usuario." });
    }
    res.json({ message: "Usuario eliminado exitosamente." });
    createAuditLog(1, "Usuario Eliminado", { deletedUserId: id });
  });
});

// Roles
app.get("/api/roles", (req, res) => {
  const sql = `SELECT id, nombre FROM roles ORDER BY nombre ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los roles." });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/roles", (req, res) => {
  const { nombre } = req.body;
  const sql = `INSERT INTO roles (nombre) VALUES (?)`;
  db.run(sql, [nombre], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al crear el rol." });
    }
    res.status(201).json({ message: "Rol creado exitosamente.", roleId: this.lastID });
    createAuditLog(1, "Rol Creado", { newRoleId: this.lastID, name: nombre });
  });
});

app.put("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  const sql = `UPDATE roles SET nombre = ? WHERE id = ?`;
  db.run(sql, [nombre, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al actualizar el rol." });
    }
    res.json({ message: "Rol actualizado exitosamente." });
    createAuditLog(1, "Rol Actualizado", { updatedRoleId: id, name: nombre });
  });
});

app.delete("/api/roles/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM roles WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al eliminar el rol." });
    }
    res.json({ message: "Rol eliminado exitosamente." });
    createAuditLog(1, "Rol Eliminado", { deletedRoleId: id });
  });
});

// Permissions
app.get("/api/permissions", (req, res) => {
  const sql = `SELECT id, name, description FROM permissions ORDER BY id`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los permisos." });
      return;
    }
    res.json(rows);
  });
});

app.get("/api/roles/:id/permissions", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT p.id, p.name, p.description 
    FROM permissions p 
    JOIN rol_permisos rp ON p.id = rp.permission_id 
    WHERE rp.rol_id = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener los permisos del rol." });
      return;
    }
    res.json(rows);
  });
});

app.put("/api/roles/:id/permissions", (req, res) => {
  const { id } = req.params;
  const { permissionIds } = req.body;

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ error: "Formato de permisos inválido." });
  }

  const deleteSql = `DELETE FROM rol_permisos WHERE rol_id = ?`;
  const insertSql = `INSERT INTO rol_permisos (rol_id, permission_id) VALUES (?, ?)`;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(deleteSql, [id], (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: "Error al eliminar permisos anteriores." });
      }

      const stmt = db.prepare(insertSql);
      permissionIds.forEach((permId) => {
        stmt.run(id, permId);
      });
      stmt.finalize((err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Error al asignar nuevos permisos." });
        }
        db.run("COMMIT");
        res.json({ message: "Permisos actualizados exitosamente." });
      });
    });
  });
});

// Get user permissions
app.get("/api/users/:userId/permissions", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT p.nombre 
    FROM permisos p
    JOIN rol_permisos rp ON p.id = rp.permission_id
    JOIN usuarios u ON rp.rol_id = u.rol_id
    WHERE u.id = ?
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching user permissions:", err);
      return res.status(500).json({ error: "Error al obtener permisos." });
    }
    const permissions = rows.map(row => row.nombre);
    res.json(permissions);
  });
});

// Audit Log
app.get("/api/audit-log", (req, res) => {
  const { username, date } = req.query;
  let sql = `
    SELECT b.id, b.accion, b.detalles, b.fecha, u.nombre_usuario as user
    FROM bitacora_acciones b
    JOIN usuarios u ON b.usuario_id = u.id
    WHERE b.fecha IS NOT NULL AND b.fecha != ''
  `;
  const params = [];

  if (username) {
    sql += ` AND u.nombre_usuario LIKE ?`;
    params.push(`%${username}%`);
  }

  if (date) {
    // SQLite date function to extract YYYY-MM-DD in local time
    sql += ` AND date(b.fecha, 'localtime') = ?`;
    params.push(date);
  }

  sql += ` ORDER BY b.fecha DESC LIMIT 1000`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Error fetching audit log:", err);
      return res.status(500).json({ error: "Error al obtener la bitácora de acciones." });
    }
    res.json(rows);
  });
});

// Dollar History - Using existing tasas_de_cambio table
// GET dollar history from database
app.get("/api/dollar-history", (req, res) => {
  const sql = `SELECT id, tasa as rate, fecha as date, fecha_hora as timestamp FROM tasas_de_cambio ORDER BY fecha_hora DESC LIMIT 30`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error reading dollar history:", err);
      return res.status(500).json({ error: "Error al leer el historial de precios del dólar." });
    }

    // Transform to match expected format
    const history = rows.map(row => ({
      date: row.date,
      rate: Number(row.rate).toFixed(2),
      timestamp: row.timestamp
    }));

    res.json(history); // Return in DESC order (newest first)
  });
});

// POST new dollar rate to database
// Only creates a new entry if the rate is different from the last entry of the day
app.post("/api/dollar-history", (req, res) => {
  const { rate } = req.body;

  if (!rate || isNaN(rate)) {
    return res.status(400).json({ error: "Tasa de cambio inválida." });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString(); // Full timestamp for fecha_hora

  // Check the most recent entry for today
  const checkSql = `SELECT id, tasa, fecha_hora FROM tasas_de_cambio WHERE fecha = ? ORDER BY fecha_hora DESC LIMIT 1`;

  db.get(checkSql, [today], (err, existing) => {
    if (err) {
      console.error("Error checking existing rate:", err);
      return res.status(500).json({ error: "Error al verificar la tasa existente." });
    }

    // If there's already an entry for today with the same rate, don't create duplicate
    if (existing && Math.abs(existing.tasa - rate) < 0.01) {
      return res.json({
        message: "Tasa ya registrada para hoy con el mismo valor.",
        entry: { date: today, rate: Number(existing.tasa).toFixed(2), timestamp: existing.fecha_hora }
      });
    }

    // Insert new entry (either first of the day or different rate)
    const insertSql = `INSERT INTO tasas_de_cambio (tasa, fecha, fecha_hora) VALUES (?, ?, ?)`;

    db.run(insertSql, [rate, today, now], function (insertErr) {
      if (insertErr) {
        console.error("Error inserting rate:", insertErr);
        return res.status(500).json({ error: "Error al guardar la tasa." });
      }

      res.status(201).json({
        message: "Tasa guardada exitosamente.",
        entry: { date: today, rate: Number(rate).toFixed(2), timestamp: now }
      });
    });
  });
});



// --- Security Settings Endpoints ---

// Verify current password
app.post("/api/users/verify-password", async (req, res) => {
  const { userId, currentPassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  const sql = `SELECT contrasena FROM usuarios WHERE id = ?`;

  db.get(sql, [userId], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.contrasena);
    res.json({ valid: passwordMatch });
  });
});

// Change password
app.post("/api/users/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    // First verify current password
    const getUserSql = `SELECT contrasena, nombre_usuario FROM usuarios WHERE id = ?`;

    const user = await new Promise((resolve, reject) => {
      db.get(getUserSql, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña actual incorrecta." });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const updateSql = `UPDATE usuarios SET contrasena = ? WHERE id = ?`;

    await new Promise((resolve, reject) => {
      db.run(updateSql, [hashedPassword, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: "Contraseña actualizada exitosamente." });
    createAuditLog(userId, "Cambio de Contraseña", { username: user.nombre_usuario });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña." });
  }
});

// Get user's current security questions (only the questions, not answers)
app.get("/api/users/:userId/security-questions", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT ps.id, ps.pregunta 
    FROM preguntas_seguridad ps
    JOIN respuestas_seguridad_usuario rsu ON ps.id = rsu.pregunta_id
    WHERE rsu.usuario_id = ?
    ORDER BY rsu.pregunta_id
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener las preguntas de seguridad." });
    }
    res.json(rows);
  });
});

// Update user's security questions
app.put("/api/users/:userId/security-questions", async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, questions } = req.body;

  if (!currentPassword || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: "Datos inválidos." });
  }

  if (questions.length < 3) {
    return res.status(400).json({ error: "Debes seleccionar al menos 3 preguntas de seguridad." });
  }

  if (questions.some(q => !q.answer || !q.answer.trim() || !q.question_id)) {
    return res.status(400).json({ error: "Todas las respuestas son obligatorias." });
  }

  try {
    // First verify current password
    const getUserSql = `SELECT contrasena, nombre_usuario FROM usuarios WHERE id = ?`;

    const user = await new Promise((resolve, reject) => {
      db.get(getUserSql, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // Delete existing security answers and insert new ones
    const deleteSql = `DELETE FROM respuestas_seguridad_usuario WHERE usuario_id = ?`;

    await new Promise((resolve, reject) => {
      db.run(deleteSql, [userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insert new answers
    for (const question of questions) {
      const hashedAnswer = await bcrypt.hash(question.answer, saltRounds);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO respuestas_seguridad_usuario (usuario_id, pregunta_id, respuesta) VALUES (?, ?, ?)`,
          [userId, question.question_id, hashedAnswer],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.json({ message: "Preguntas de seguridad actualizadas exitosamente." });
    createAuditLog(userId, "Actualización de Preguntas de Seguridad", { username: user.nombre_usuario });

  } catch (error) {
    console.error("Error updating security questions:", error);
    res.status(500).json({ error: "Error al actualizar las preguntas de seguridad." });
  }
});

// =============================================
// ERROR REPORTS ENDPOINTS
// =============================================

// Create manual error report (user-submitted)
app.post("/api/error-reports", (req, res) => {
  const { userId, modulo, accion, descripcion } = req.body;

  if (!userId || !modulo || !accion || !descripcion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  const sql = `INSERT INTO error_reports (usuario_id, modulo, accion, descripcion, tipo) VALUES (?, ?, ?, ?, 'manual')`;

  db.run(sql, [userId, modulo, accion, descripcion], function (err) {
    if (err) {
      console.error("Error creating error report:", err.message);
      return res.status(500).json({ error: "Error al crear el reporte de error." });
    }

    const reportId = this.lastID;

    // Get username for notification
    db.get(`SELECT nombre_usuario FROM usuarios WHERE id = ?`, [userId], (err, user) => {
      const username = user ? user.nombre_usuario : 'Desconocido';

      // Send Telegram notification using external module
      notifyManualErrorReport({
        reportId,
        modulo,
        username,
        accion,
        descripcion
      });
    });

    createAuditLog(userId, "Reporte de Error Creado", { reportId, modulo, tipo: 'manual' });
    res.status(201).json({ message: "Reporte de error enviado exitosamente.", reportId });
  });
});

// Create automatic error report (system-detected)
app.post("/api/error-reports/automatic", (req, res) => {
  const { userId, source, errorMessage, stackTrace, url } = req.body;

  if (!source || !errorMessage) {
    return res.status(400).json({ error: "Source y errorMessage son obligatorios." });
  }

  // Build accion and descripcion from automatic error data
  const accion = `Error automático detectado en: ${source}`;
  const descripcion = `${errorMessage}\n\nStack Trace:\n${stackTrace || 'No disponible'}\n\nURL: ${url || 'No disponible'}`;

  const sql = `INSERT INTO error_reports (usuario_id, modulo, accion, descripcion, tipo) VALUES (?, ?, ?, ?, 'automatico')`;

  db.run(sql, [userId || null, source, accion, descripcion], function (err) {
    if (err) {
      console.error("Error creating automatic error report:", err.message);
      return res.status(500).json({ error: "Error al crear el reporte automático." });
    }

    const reportId = this.lastID;

    // Get username if userId provided
    if (userId) {
      db.get(`SELECT nombre_usuario FROM usuarios WHERE id = ?`, [userId], (err, user) => {
        const username = user ? user.nombre_usuario : 'No identificado';
        notifyAutomaticError({ reportId, source, errorMessage, stackTrace, url, username });
      });
    } else {
      notifyAutomaticError({ reportId, source, errorMessage, stackTrace, url, username: 'No identificado' });
    }

    console.log(`[ErrorReport] Automatic error logged: #${reportId}`);
    res.status(201).json({ message: "Error automático registrado.", reportId });
  });
});

// Get all error reports (requires errors:view permission)
app.get("/api/error-reports", (req, res) => {
  const { estado, modulo, tipo } = req.query;

  let sql = `
    SELECT er.*, u.nombre_usuario, u.nombre_completo
    FROM error_reports er
    LEFT JOIN usuarios u ON er.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (estado) {
    sql += ` AND er.estado = ?`;
    params.push(estado);
  }

  if (modulo) {
    sql += ` AND er.modulo = ?`;
    params.push(modulo);
  }

  if (tipo) {
    sql += ` AND er.tipo = ?`;
    params.push(tipo);
  }

  sql += ` ORDER BY er.fecha_reporte DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Error fetching error reports:", err.message);
      return res.status(500).json({ error: "Error al obtener reportes de errores." });
    }
    res.json(rows);
  });
});

// Update error report status
app.put("/api/error-reports/:id/status", (req, res) => {
  const { id } = req.params;
  const { estado, notas_resolucion } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "El estado es obligatorio." });
  }

  const validStates = ['pendiente', 'en_revision', 'resuelto'];
  if (!validStates.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido." });
  }

  let sql = `UPDATE error_reports SET estado = ?`;
  const params = [estado];

  if (estado === 'resuelto') {
    sql += `, fecha_resuelto = CURRENT_TIMESTAMP`;
  }

  if (notas_resolucion) {
    sql += `, notas_resolucion = ?`;
    params.push(notas_resolucion);
  }

  sql += ` WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating error report:", err.message);
      return res.status(500).json({ error: "Error al actualizar el reporte." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Reporte no encontrado." });
    }

    res.json({ message: "Estado actualizado exitosamente." });
  });
});

// Get single error report
app.get("/api/error-reports/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT er.*, u.nombre_usuario, u.nombre_completo
    FROM error_reports er
    LEFT JOIN usuarios u ON er.usuario_id = u.id
    WHERE er.id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Error fetching error report:", err.message);
      return res.status(500).json({ error: "Error al obtener el reporte." });
    }
    if (!row) {
      return res.status(404).json({ error: "Reporte no encontrado." });
    }
    res.json(row);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
