import React from 'react';
import { format } from 'date-fns';
import './FileCard.css';

function fileIcon(mimeType = '') {
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) return '📦';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑';
  return '📁';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileCard({ file, onDownload, onShare, onVersions, onDelete }) {
  return (
    <div className="file-card">
      <div className="file-icon">{fileIcon(file.mimeType)}</div>
      <div className="file-info">
        <div className="file-name" title={file.name}>{file.name}</div>
        <div className="file-meta">
          <span>{formatSize(file.size)}</span>
          <span className="dot">·</span>
          <span>{file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM d, yyyy') : '—'}</span>
          <span className="dot">·</span>
          <span className="badge">v{file.version}</span>
        </div>
      </div>
      <div className="file-actions">
        <button className="btn btn-sm btn-ghost" title="Download" onClick={() => onDownload(file)}>⬇</button>
        <button className="btn btn-sm btn-ghost" title="Versions" onClick={() => onVersions(file)}>🕓</button>
        <button className="btn btn-sm btn-ghost" title="Share" onClick={() => onShare(file)}>🔗</button>
        <button className="btn btn-sm btn-danger" title="Delete" onClick={() => onDelete(file)}>🗑</button>
      </div>
    </div>
  );
}