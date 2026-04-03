const Database = require('better-sqlite3');
const db = new Database('productos.db');

// Crear tabla de productos con soporte para descripción
const createTable = `
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,         -- NUEVA COLUMNA para tu textarea
    categoria TEXT DEFAULT 'General',
    modelo_auto TEXT DEFAULT 'N/A',
    año INTEGER DEFAULT 0,
    precio REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    imagen_url TEXT
);`;

db.exec(createTable);

// Nota: Si la tabla ya existía, SQLite no agregará la columna 'descripcion' automáticamente.
// Si no ves la descripción, borra el archivo 'productos.db' y reinicia el servidor.

module.exports = db;