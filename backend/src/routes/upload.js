const express = require('express');
const router = express.Router();
const { authenticate, requireGardenAccess } = require('../middleware/auth');
const {
  uploadAvatar,
  uploadChildPhoto,
  uploadDailyPhotos,
  uploadDocuments,
  uploadLogo,
  uploadAnnouncementFiles,
  uploadMessageFiles,
  handleUploadError,
  getPublicUrl
} = require('../middleware/upload');

// Subir avatar de usuario
router.post('/avatar', authenticate, uploadAvatar, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se subió ningún archivo',
      code: 'NO_FILE'
    });
  }

  const avatarUrl = getPublicUrl(req.file.path);

  res.json({
    message: 'Avatar subido correctamente ✅',
    avatar: {
      url: avatarUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Subir foto de niño
router.post('/child-photo', authenticate, requireGardenAccess(), uploadChildPhoto, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se subió ningún archivo',
      code: 'NO_FILE'
    });
  }

  const photoUrl = getPublicUrl(req.file.path);

  res.json({
    message: 'Foto subida correctamente ✅',
    photo: {
      url: photoUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Subir fotos del cuaderno digital
router.post('/daily-photos', authenticate, requireGardenAccess(), uploadDailyPhotos, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se subieron archivos',
      code: 'NO_FILES'
    });
  }

  const photos = req.files.map(file => ({
    url: getPublicUrl(file.path),
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    message: `${photos.length} fotos subidas correctamente ✅`,
    photos
  });
});

// Subir documentos
router.post('/documents', authenticate, requireGardenAccess(), uploadDocuments, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se subieron archivos',
      code: 'NO_FILES'
    });
  }

  const documents = req.files.map(file => ({
    url: getPublicUrl(file.path),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    message: `${documents.length} documentos subidos correctamente ✅`,
    documents
  });
});

// Subir logo del jardín
router.post('/logo', authenticate, requireGardenAccess(), uploadLogo, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se subió ningún archivo',
      code: 'NO_FILE'
    });
  }

  const logoUrl = getPublicUrl(req.file.path);

  res.json({
    message: 'Logo subido correctamente ✅',
    logo: {
      url: logoUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Subir archivos para comunicados
router.post('/announcements', authenticate, requireGardenAccess(), uploadAnnouncementFiles, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se subieron archivos',
      code: 'NO_FILES'
    });
  }

  const attachments = req.files.map(file => ({
    name: file.originalname,
    url: getPublicUrl(file.path),
    type: file.mimetype,
    size: file.size
  }));

  res.json({
    message: `${attachments.length} archivos subidos correctamente ✅`,
    attachments
  });
});

// Subir archivos para mensajes
router.post('/messages', authenticate, requireGardenAccess(), uploadMessageFiles, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se subieron archivos',
      code: 'NO_FILES'
    });
  }

  const attachments = req.files.map(file => ({
    name: file.originalname,
    url: getPublicUrl(file.path),
    type: file.mimetype,
    size: file.size
  }));

  res.json({
    message: `${attachments.length} archivos subidos correctamente ✅`,
    attachments
  });
});

// Middleware de manejo de errores de upload (debe ir al final)
router.use(handleUploadError);

module.exports = router;