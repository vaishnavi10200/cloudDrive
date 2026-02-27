import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getVersions, getDownloadUrl, restoreVersion, uploadNewVersion } from '../utils/api';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VersionsModal({ file, onClose, toast, onRefresh }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { versions } = await getVersions(file.fileId);
      setVersions(versions);
    } catch { toast.error('Failed to load versions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (v) => {
    try {
      const { url } = await getDownloadUrl(file.fileId, v.gcsPath);
      window.open(url, '_blank');
    } catch { toast.error('Failed to get download link'); }
  };

  const handleRestore = async (v) => {
    if (!window.confirm(`Restore version ${v.version} as the new latest version?`)) return;
    setRestoring(v.version);
    try {
      await restoreVersion(file.fileId, v.version);
      toast.success(`Version ${v.version} restored!`);
      onRefresh();
      load();
    } catch { toast.error('Restore failed'); }
    finally { setRestoring(null); }
  };

  const handleUploadNewVersion = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const formData = new FormData();
    formData.append('file', f);
    setUploading(true);
    try {
      await uploadNewVersion(file.fileId, formData);
      toast.success('New version uploaded!');
      onRefresh();
      load();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🕓 Version History</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          <strong style={{ color: 'var(--text)' }}>{file.name}</strong> · {versions.length} version{versions.length !== 1 ? 's' : ''}
        </p>

        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', marginBottom: 16, display: 'inline-flex' }}>
          {uploading ? '⏳ Uploading...' : '⬆ Upload new version'}
          <input type="file" hidden onChange={handleUploadNewVersion} disabled={uploading} />
        </label>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
            {versions.map((v) => (
              <div key={v.version} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--bg3)', border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge">v{v.version}</span>
                    {v.version === Math.max(...versions.map(x => x.version)) && (
                      <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 600 }}>LATEST</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {formatSize(v.size)} · {v.uploadedAt ? format(new Date(v.uploadedAt), 'MMM d, yyyy h:mm a') : '—'}
                    {v.restoredFrom && <span> · Restored from v{v.restoredFrom}</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(v)}>⬇</button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleRestore(v)}
                  disabled={!!restoring}
                >
                  {restoring === v.version ? '⏳' : '↩'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}