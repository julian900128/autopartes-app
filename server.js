const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

// Configurar multer para upload de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/images/uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, JPEG y PNG'));
    }
});

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API para productos
app.get('/api/productos', (req, res) => {
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
        const productos = db.prepare(query).all(...params);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// API para producto individual
app.get('/api/productos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
        if (producto) {
            res.json(producto);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// Agregar producto (admin)
app.post('/api/productos/agregar', upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const { nombre, categoria, modelo_auto, año, precio, stock, descripcion } = req.body;
        const imagen_url = `uploads/${req.file.filename}`;

        const insert = db.prepare(`
            INSERT INTO productos (nombre, descripcion, categoria, modelo_auto, año, precio, stock, imagen_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
            nombre,
            descripcion || '',
            categoria || 'General',
            modelo_auto || 'N/A',
            parseInt(año) || 0,
            parseFloat(precio) || 0,
            parseInt(stock) || 0,
            imagen_url
        );
        res.json({ success: true, message: 'Producto agregado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});

// Eliminar producto (admin)
app.delete('/api/productos/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la imagen para eliminarla del servidor
        const producto = db.prepare('SELECT imagen_url FROM productos WHERE id = ?').get(id);
        
        if (producto && producto.imagen_url) {
            const imagePath = path.join(__dirname, 'public/images', producto.imagen_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Eliminar de la base de datos
        db.prepare('DELETE FROM productos WHERE id = ?').run(id);
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});