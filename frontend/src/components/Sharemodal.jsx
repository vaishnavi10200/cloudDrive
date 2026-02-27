import React, { useState } from 'react';
import { createShareLink } from '../utils/api';

export default function ShareModal({ file, onClose, toast }) {
  const [expiresHours, setExpiresHours] = useState(24);
  const [shareUrl, setShareUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { shareUrl } = await createShareLink({
        fileId: file.fileId,
        gcsPath: file.gcsPath,
        fileName: file.name,
        expiresHours: Number(expiresHours),
      });
      setShareUrl(shareUrl);
      toast.success('Share link created!');
    } catch { toast.error('Failed to create share link'); }
    finally { setCreating(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🔗 Share File</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Create a shareable link for <strong style={{ color: 'var(--text)' }}>{file.name}</strong>
        </p>

        <label>Link expires after</label>
        <select value={expiresHours} onChange={e => setExpiresHours(e.target.value)} style={{ marginBottom: 20 }}>
          <option value={1}>1 hour</option>
          <option value={24}>24 hours</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
          <option value={0}>Never</option>
        </select>

        {!shareUrl ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={creating}>
            {creating ? '⏳ Creating...' : '🔗 Generate Share Link'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: '12px 14px', background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 10,
              fontSize: 13, color: 'var(--text-muted)',
              wordBreak: 'break-all',
            }}>
              {shareUrl}
            </div>
            <button className="btn btn-success" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShareUrl(''); }} style={{ alignSelf: 'center' }}>
              Generate another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}