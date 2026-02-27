const { bucket } = require('../config/gcs');
const { v4: uuidv4 } = require('uuid');

const SHARE_INDEX = 'share-index.json'; // stored in bucket root

async function loadIndex() {
  const file = bucket.file(SHARE_INDEX);
  try {
    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  } catch {
    return {};
  }
}

async function saveIndex(index) {
  const file = bucket.file(SHARE_INDEX);
  await file.save(JSON.stringify(index, null, 2), {
    metadata: { contentType: 'application/json' },
  });
}

/**
 * Create a share token for a file version.
 * @param {string} userId - owner
 * @param {string} fileId
 * @param {string} gcsPath - specific version path
 * @param {string} fileName
 * @param {number} expiresHours - 0 = never
 */
async function createShareToken(userId, fileId, gcsPath, fileName, expiresHours = 24) {
  const token = uuidv4();
  const index = await loadIndex();

  index[token] = {
    token,
    userId,
    fileId,
    gcsPath,
    fileName,
    createdAt: new Date().toISOString(),
    expiresAt: expiresHours > 0
      ? new Date(Date.now() + expiresHours * 3600 * 1000).toISOString()
      : null,
    downloadCount: 0,
  };

  await saveIndex(index);
  return token;
}

/**
 * Resolve a share token → returns share record or null if invalid/expired.
 */
async function resolveToken(token) {
  const index = await loadIndex();
  const record = index[token];
  if (!record) return null;

  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return null; // expired
  }

  // Increment download count
  record.downloadCount += 1;
  await saveIndex(index);
  return record;
}

/**
 * List all share links created by a user.
 */
async function listUserShares(userId) {
  const index = await loadIndex();
  return Object.values(index).filter((r) => r.userId === userId);
}

/**
 * Revoke a share token.
 */
async function revokeToken(token, userId) {
  const index = await loadIndex();
  if (!index[token] || index[token].userId !== userId) {
    throw new Error('Share token not found or unauthorized');
  }
  delete index[token];
  await saveIndex(index);
}

module.exports = { createShareToken, resolveToken, listUserShares, revokeToken };