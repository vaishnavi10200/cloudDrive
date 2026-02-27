import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShareInfo, downloadSharedFile } from '../utils/api';
import { format } from 'date-fns';
import './SharePage.css';

export default function SharePage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getShareInfo(token)
      .then(setInfo)
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { downloadUrl } = await downloadSharedFile(token);
      window.open(downloadUrl, '_blank');
    } catch {
      setError('Download failed. Link may have expired.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="share-page">
      <div className="share-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
      </div>

      <div className="share-card">
        <div className="share-logo">
          <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px #6c63ff)' }}>☁</span>
          <span style={{ fontFamily: 'Syne', fontWeight: 800 }}>CloudDrive</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : error ? (
          <div className="share-error">
            <div style={{ fontSize: 48 }}>🔒</div>
            <h2>Link Unavailable</h2>
            <p>{error}</p>
            <a href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>Go to CloudDrive</a>
          </div>
        ) : (
          <>
            <div className="share-file-icon">📄</div>
            <h2 className="share-file-name">{info.fileName}</h2>
            <div className="share-meta">
              {info.expiresAt ? (
                <span>Expires {format(new Date(info.expiresAt), 'MMM d, yyyy h:mm a')}</span>
              ) : (
                <span>No expiry</span>
              )}
            </div>

            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 24 }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? '⏳ Preparing download...' : '⬇ Download File'}
            </button>

            <p className="share-footer">
              Shared securely via CloudDrive ·{' '}
              <a href="/">Create your own</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}