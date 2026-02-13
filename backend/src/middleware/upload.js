const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Organizar por tipo de archivo
    switch (file.fieldname) {
      case 'avatar':
        uploadPath += 'avatars/';
        break;
      case 'childPhoto':
        uploadPath += 'children/';
        break;
      case 'dailyPhoto':
        uploadPath += 'daily/';
        break;
      case 'document':
        uploadPath += 'documents/';
        break;
      case 'logo':
        uploadPath += 'gardens/';
        break;
      case 'announcement':
        uploadPath += 'announcements/';
        break;
      case 'message':
        uploadPath += 'messages/';
        break;
      default:
        uploadPath += 'general/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + random + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    
    // Limpiar nombre original (solo caracteres alfanuméricos y guiones)
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-]/g, '-');
    
    cb(null, `${cleanName}-${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos por campo
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/png', 'image/webp'],
    childPhoto: ['image/jpeg', 'image/png', 'image/webp'],
    dailyPhoto: ['image/jpeg', 'image/png', 'image/webp'],
    logo: ['image/jpeg', 'image/png', 'image/svg+xml'],
    document: [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    announcement: [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    message: [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf'
    ]
  };

  const allowed = allowedTypes[file.fieldname] || allowedTypes.document;
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido para ${file.fieldname}. Tipos permitidos: ${allowed.join(', ')}`), false);
  }
};

// Configuración base de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10 // Máximo 10 archivos por request
  }
});

// Middlewares específicos por uso
const uploadAvatar = upload.single('avatar');
const uploadChildPhoto = upload.single('childPhoto');
const uploadDailyPhotos = upload.array('dailyPhoto', 5);
const uploadDocuments = upload.array('document', 5);
const uploadLogo = upload.single('logo');
const uploadAnnouncementFiles = upload.array('announcement', 3);
const uploadMessageFiles = upload.array('message', 3);

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Archivo demasiado grande. Máximo 10MB.',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Demasiados archivos. Máximo 10 por request.',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Campo de archivo inesperado.',
          code: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          error: 'Error subiendo archivo.',
          code: 'UPLOAD_ERROR'
        });
    }
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
};

// Utilidad para eliminar archivo
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return false;
  }
};

// Utilidad para obtener URL pública del archivo
const getPublicUrl = (filePath) => {
  if (!filePath) return null;
  // En producción esto sería una URL completa
  return `/uploads/${filePath.replace(/^uploads\//, '')}`;
};

// Middleware para servir archivos estáticos (agregar al app principal)
const serveUploads = (app) => {
  const express = require('express');
  const uploadsPath = path.join(__dirname, '../../uploads');
  app.use('/uploads', express.static(uploadsPath));
};

module.exports = {
  uploadAvatar,
  uploadChildPhoto,
  uploadDailyPhotos,
  uploadDocuments,
  uploadLogo,
  uploadAnnouncementFiles,
  uploadMessageFiles,
  handleUploadError,
  deleteFile,
  getPublicUrl,
  serveUploads
};