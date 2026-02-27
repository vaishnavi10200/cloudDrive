const { bucket } = require('../config/gcs');
const { v4: uuidv4 } = require('uuid');

/**
 * Build the GCS object path for a user's file version.
 * Pattern: users/{userId}/files/{fileId}/v{version}/{originalName}
 */
function buildPath(userId, fileId, version, fileName) {
  return `users/${userId}/files/${fileId}/v${version}/${fileName}`;
}

/**
 * Upload a new file or new version of an existing file.
 * Returns metadata of the uploaded file.
 */
async function uploadFile(userId, file, existingFileId = null) {
  const fileId = existingFileId || uuidv4();
  const versions = existingFileId ? await getVersions(userId, fileId) : [];
  const newVersion = versions.length + 1;

  const gcsPath = buildPath(userId, fileId, newVersion, file.originalname);
  const blob = bucket.file(gcsPath);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        userId,
        fileId,
        version: String(newVersion),
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  return {
    fileId,
    version: newVersion,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    gcsPath,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * List all unique files for a user (latest version of each).
 */
async function listFiles(userId) {
  const prefix = `users/${userId}/files/`;
  const [files] = await bucket.getFiles({ prefix });

  // Group by fileId, keep only latest version per fileId
  const fileMap = {};
  for (const file of files) {
    const meta = file.metadata?.metadata || {};
    const { fileId, version, originalName, uploadedAt } = meta;
    if (!fileId) continue;

    const versionNum = parseInt(version || '1', 10);
    if (!fileMap[fileId] || versionNum > fileMap[fileId].version) {
      fileMap[fileId] = {
        fileId,
        name: originalName || file.name.split('/').pop(),
        version: versionNum,
        size: parseInt(file.metadata.size || 0),
        mimeType: file.metadata.contentType,
        gcsPath: file.name,
        uploadedAt: uploadedAt || file.metadata.timeCreated,
      };
    }
  }

  return Object.values(fileMap).sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );
}

/**
 * List all versions of a specific file.
 */
async function getVersions(userId, fileId) {
  const prefix = `users/${userId}/files/${fileId}/`;
  const [files] = await bucket.getFiles({ prefix });

  return files
    .map((f) => {
      const meta = f.metadata?.metadata || {};
      return {
        version: parseInt(meta.version || '1', 10),
        name: meta.originalName || f.name.split('/').pop(),
        size: parseInt(f.metadata.size || 0),
        mimeType: f.metadata.contentType,
        gcsPath: f.name,
        uploadedAt: meta.uploadedAt || f.metadata.timeCreated,
      };
    })
    .sort((a, b) => b.version - a.version);
}

/**
 * Generate a signed download URL (valid 1 hour).
 */
async function getDownloadUrl(gcsPath, expiresMinutes = 60) {
  const file = bucket.file(gcsPath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresMinutes * 60 * 1000,
  });
  return url;
}

/**
 * Delete a file (all versions).
 */
async function deleteFile(userId, fileId) {
  const prefix = `users/${userId}/files/${fileId}/`;
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((f) => f.delete()));
  return { deleted: files.length };
}

/**
 * Restore a specific version by re-uploading it as the new latest version.
 */
async function restoreVersion(userId, fileId, targetVersion) {
  const versions = await getVersions(userId, fileId);
  const target = versions.find((v) => v.version === targetVersion);
  if (!target) throw new Error(`Version ${targetVersion} not found`);

  const srcFile = bucket.file(target.gcsPath);
  const [buffer] = await srcFile.download();

  const newVersion = Math.max(...versions.map((v) => v.version)) + 1;
  const newPath = buildPath(userId, fileId, newVersion, target.name);
  const destFile = bucket.file(newPath);

  await destFile.save(buffer, {
    metadata: {
      contentType: target.mimeType,
      metadata: {
        userId,
        fileId,
        version: String(newVersion),
        originalName: target.name,
        uploadedAt: new Date().toISOString(),
        restoredFrom: String(targetVersion),
      },
    },
  });

  return { fileId, newVersion, restoredFrom: targetVersion };
}

module.exports = { uploadFile, listFiles, getVersions, getDownloadUrl, deleteFile, restoreVersion };