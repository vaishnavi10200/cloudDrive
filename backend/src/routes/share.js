const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { shareLimiter, downloadLimiter } = require('../middleware/security');
const { createShareToken, resolveToken, listUserShares, revokeToken } = require('../services/shareService');
const { getDownloadUrl } = require('../services/fileService');

// Create share link — rate limited
router.post('/create', requireAuth, shareLimiter, async (req, res, next) => {
  try {
    const { fileId, gcsPath, fileName, expiresHours = 24 } = req.body;
    if (!fileId || !gcsPath || !fileName) {
      return res.status(400).json({ error: 'fileId, gcsPath and fileName are required' });
    }
    // Ensure the file belongs to the requesting user (prevent IDOR)
    if (!gcsPath.startsWith(`users/${req.session.user.id}/`)) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }
    // Validate expiresHours
    const hours = parseInt(expiresHours);
    if (isNaN(hours) || hours < 0 || hours > 720) {
      return res.status(400).json({ error: 'expiresHours must be between 0 and 720 (30 days)' });
    }

    const token = await createShareToken(req.session.user.id, fileId, gcsPath, fileName, hours);
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${token}`;
    res.status(201).json({ token, shareUrl });
  } catch (err) { next(err); }
});

// List user's share links
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const shares = await listUserShares(req.session.user.id);
    res.json({ shares });
  } catch (err) { next(err); }
});

// Revoke a share link
router.delete('/:token', requireAuth, async (req, res, next) => {
  try {
    // Validate token format (UUID)
    if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    await revokeToken(req.params.token, req.session.user.id);
    res.json({ message: 'Share link revoked' });
  } catch (err) { next(err); }
});

// Public: get share file info (no auth needed, rate limited)
router.get('/info/:token', downloadLimiter, async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    const record = await resolveToken(req.params.token);
    if (!record) return res.status(404).json({ error: 'Share link not found or has expired' });

    // Only return safe metadata — never return gcsPath or userId to public
    res.json({
      fileName: record.fileName,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    });
  } catch (err) { next(err); }
});

// Public: get download URL (no auth needed, rate limited)
router.get('/download/:token', downloadLimiter, async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    const record = await resolveToken(req.params.token);
    if (!record) return res.status(404).json({ error: 'Share link not found or has expired' });

    const url = await getDownloadUrl(record.gcsPath, 15); // 15-min signed URL
    res.json({
      fileName: record.fileName,
      downloadUrl: url,
      expiresAt: record.expiresAt,
      downloadCount: record.downloadCount,
    });
  } catch (err) { next(err); }
});

module.exports = router;