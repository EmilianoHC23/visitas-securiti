const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, '../../uploads');
const logosDir = path.join(uploadsDir, 'logos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Configuración de almacenamiento para logos de empresa
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logosDir);
  },
  filename: function (req, file, cb) {
    // Usar companyId del usuario + timestamp para evitar colisiones
    const companyId = req.user?.companyId || 'default';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `logo-${companyId}-${timestamp}${ext}`);
  }
});

// Filtro para solo aceptar imágenes
const imageFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuración de Multer para logos
const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadLogo
};
