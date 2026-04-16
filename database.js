const mysql = require('mysql2/promise');

// Configuración de MySQL desde variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'autopartes',
    // IMPORTANTE: Aiven usa puertos distintos al 3306, hay que leerlo de la variable
    port: process.env.DB_PORT || 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ESTO ES OBLIGATORIO PARA CONECTAR A AIVEN DESDE RENDER
    ssl: {
        rejectUnauthorized: false
    }
});

// Crear tabla si no existe
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // El script se ejecutará en el esquema que definas en DB_NAME (ej. newschema)
        const createTable = `
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                categoria VARCHAR(100) DEFAULT 'General',
                modelo_auto VARCHAR(100) DEFAULT 'N/A',
                año INT DEFAULT 0,
                precio DECIMAL(10, 2) DEFAULT 0,
                stock INT DEFAULT 0,
                imagen_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(createTable);
        connection.release();
        console.log('✅ Conexión exitosa y tabla de productos verificada');
    } catch (error) {
        console.error('❌ Error en la base de datos:', error);
        // No salimos del proceso inmediatamente para permitir que Render vea los logs
        setTimeout(() => process.exit(1), 1000);
    }
}

// Inicializar base de datos
initDatabase();

module.exports = pool;