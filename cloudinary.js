const cloudinary = require('cloudinary').v2;

// Configura tus credenciales directamente (no recomendado para producción)
cloudinary.config({
  cloud_name: 'root',
  api_key: '264259946397238',
  api_secret: 'cr39Dl07d2hqazIvpIcTzdXjTg4',
  secure: true // Para que use HTTPS siempre
});

module.exports = cloudinary;
