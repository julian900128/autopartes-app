require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('./cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar almacenamiento para multer: Cloudinary si hay credenciales, sino disco local
const useCloudinary = !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET);
let upload;

if (useCloudinary) {
    const storageCloud = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'autopartes-app',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
        }
    });
    console.log('Using Cloudinary storage for uploads');
    upload = multer({ storage: storageCloud });
} else {
    // Fallback a almacenamiento local en public/images/uploads
    const localStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'public', 'images', 'uploads');
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const timestamp = Date.now();
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            cb(null, `${timestamp}-${safeName}`);
        }
    });
    console.warn('CLOUDINARY credentials not found — using local disk storage for uploads');
    upload = multer({ storage: localStorage });
}

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API para productos
app.get('/api/productos', async (req, res) => {
    const { q, modelo } = req.query;
    let query = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (q) {
        query += ' AND (nombre LIKE ? OR categoria LIKE ? OR descripcion LIKE ? OR modelo_auto LIKE ?)';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (modelo) {
        query += ' AND modelo_auto = ?';
        params.push(modelo);
    }

    try {
        const [productos] = await db.execute(query, params);
        res.json(productos);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// API para producto individual
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [productos] = await db.execute('SELECT * FROM productos WHERE id = ?', [id]);
        if (productos.length > 0) {
            res.json(productos[0]);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// Agregar producto (admin)
app.post('/api/productos/agregar', upload.single('imagen'), async (req, res) => {
    try {
        // Registro de entrada para depuración
        console.log('POST /api/productos/agregar - body:', req.body);
        console.log('POST /api/productos/agregar - file:', req.file);

        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const { nombre, categoria, modelo_auto, año, precio, stock, descripcion } = req.body;

        const imagen_url = (() => {
            if (!req.file) return null;
            if (useCloudinary) {
                return req.file.path || req.file.url || req.file.secure_url || null;
            }
            // Guardamos la ruta relativa para servir desde public/
            return `/images/uploads/${req.file.filename}`;
        })();

        const query = `
            INSERT INTO productos (nombre, descripcion, categoria, modelo_auto, año, precio, stock, imagen_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [
            nombre,
            descripcion || '',
            categoria || 'General',
            modelo_auto || 'N/A',
            parseInt(año) || 0,
            parseFloat(precio) || 0,
            parseInt(stock) || 0,
            imagen_url
        ]);

        console.log('Insert result:', result);

        res.json({ success: true, message: 'Producto agregado exitosamente', insertId: result.insertId || null });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});

// Eliminar producto (admin)
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la imagen para eliminarla del servidor
        const [productos] = await db.execute('SELECT imagen_url FROM productos WHERE id = ?', [id]);
        
        if (productos.length > 0 && productos[0].imagen_url) {
            if (!/^https?:\/\//i.test(productos[0].imagen_url)) {
                const relativePath = productos[0].imagen_url.replace(/^\//, '');
                const imagePath = path.join(__dirname, relativePath);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        }

        // Eliminar de la base de datos
        await db.execute('DELETE FROM productos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Ruta de prueba: inserta producto sin imagen (para depuración)
app.post('/api/test-insert', async (req, res) => {
    try {
        const { nombre = 'Prueba sin imagen', descripcion = 'Insertado vía test' } = req.body || {};
        const query = `
            INSERT INTO productos (nombre, descripcion, categoria, modelo_auto, año, precio, stock, imagen_url)
            VALUES (?, ?, 'General', 'N/A', 0, 0, 0, NULL)
        `;
        const [result] = await db.execute(query, [nombre, descripcion]);
        console.log('Test insert result:', result);
        res.json({ success: true, insertId: result.insertId || null });
    } catch (error) {
        console.error('Error en test-insert:', error);
        res.status(500).json({ error: 'Error en test-insert' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Middleware global de errores (captura errores de multer y otros)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ error: 'Error en la subida de archivo', details: err.message });
    }
    // En modo depuración devolvemos el mensaje para ayudar a encontrar el problema
    res.status(500).json({ error: 'Error interno del servidor', details: err && err.message ? err.message : String(err) });
});