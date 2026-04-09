const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crear carpeta 'data' fuera de public/ para seguridad
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
}

// Crear base de datos en la carpeta segura con permisos de escritura
const dbPath = path.join(dataDir, 'productos.db');
const db = new Database(dbPath);

// Asegurar permisos de escritura
fs.chmodSync(dbPath, 0o644);
fs.chmodSync(dataDir, 0o755);

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