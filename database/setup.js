
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'facturacion.db');
const schemaPath = path.join(__dirname, '..', 'database_schema.sql');

// Conectar a la base de datos (o crearla si no existe)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    return;
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Leer el schema SQL
fs.readFile(schemaPath, 'utf8', (err, sql) => {
  if (err) {
    console.error('Error al leer el archivo de schema:', err);
    db.close();
    return;
  }

  // Adaptar el schema de MySQL a SQLite
  const sqliteSql = sql
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/DECIMAL\(\d+,\s*\d+\)/g, 'REAL')
    .replace(/TIMESTAMP/g, 'DATETIME');

  // Ejecutar el script SQL
  db.exec(sqliteSql, (err) => {
    if (err) {
      console.error('Error al ejecutar el schema:', err.message);
    } else {
      console.log('La base de datos se ha configurado correctamente.');
    }

    // Cerrar la conexión
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la conexión:', err.message);
      } else {
        console.log('Conexión a la base de datos cerrada.');
      }
    });
  });
});
