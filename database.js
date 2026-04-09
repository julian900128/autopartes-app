const mysql = require('mysql2/promise');

// Configuración de MySQL desde variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autopartes',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Crear tabla si no existe
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        
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
        console.log('✅ Tabla de productos verificada/creada');
    } catch (error) {
        console.error('❌ Error al crear tabla:', error);
        process.exit(1);
    }
}

// Inicializar base de datos al cargar el módulo
initDatabase();

module.exports = pool;