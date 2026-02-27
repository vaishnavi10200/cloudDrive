const express = require('express');
const multer = require('multer');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter, sanitizeFilename, validateMimeType } = require('../middleware/security');
const {
  uploadFile,
  listFiles,
  getVersions,
  getDownloadUrl,
  deleteFile,
  restoreVersion,
} = require('../services/fileService');

// ─── Multer: memory storage with strict limits & MIME validation ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1,
    fields: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!validateMimeType(file.mimetype)) {
      return cb(new Error(`File type "${file.mimetype}" is not allowed.`));
    }
    file.originalname = sanitizeFilename(file.originalname);
    cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// List all files
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const files = await listFiles(req.session.user.id);
    res.json({ files });
  } catch (err) { next(err); }
});

// Upload new file
router.post('/upload', requireAuth, uploadLimiter, handleUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadFile(req.session.user.id, req.file);
    res.status(201).json({ message: 'File uploaded successfully', file: result });
  } catch (err) { next(err); }
});

// Upload new version
router.post('/:fileId/version', requireAuth, uploadLimiter, handleUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!/^[0-9a-f-]{36}$/i.test(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    const result = await uploadFile(req.session.user.id, req.file, req.params.fileId);
    res.status(201).json({ message: 'New version uploaded', file: result });
  } catch (err) { next(err); }
});

// List versions
router.get('/:fileId/versions', requireAuth, async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    const versions = await getVersions(req.session.user.id, req.params.fileId);
    res.json({ versions });
  } catch (err) { next(err); }
});

// Get signed download URL — with IDOR protection
router.get('/:fileId/download', requireAuth, async (req, res, next) => {
  try {
    const { gcsPath } = req.query;
    if (!gcsPath) return res.status(400).json({ error: 'gcsPath query param required' });
    if (!gcsPath.startsWith(`users/${req.session.user.id}/`)) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }
    const url = await getDownloadUrl(gcsPath);
    res.json({ url });
  } catch (err) { next(err); }
});

// Restore a version
router.post('/:fileId/restore', requireAuth, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (!version || isNaN(parseInt(version))) {
      return res.status(400).json({ error: 'Valid version number is required' });
    }
    if (!/^[0-9a-f-]{36}$/i.test(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    const result = await restoreVersion(req.session.user.id, req.params.fileId, parseInt(version));
    res.json({ message: `Version ${version} restored`, result });
  } catch (err) { next(err); }
});

// Delete file (all versions)
router.delete('/:fileId', requireAuth, async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    const result = await deleteFile(req.session.user.id, req.params.fileId);
    res.json({ message: 'File deleted', ...result });
  } catch (err) { next(err); }
});

module.exports = router;