import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listFiles, getDownloadUrl, deleteFile } from '../utils/api';
import { useToast, ToastContainer } from '../hooks/useToast';
import Dropzone from '../components/Dropzone';
import FileCard from '../components/FileCard';
import VersionsModal from '../components/VersionsModal';
import ShareModal from '../components/ShareModal';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toasts, toast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [versionsFile, setVersionsFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadFiles = useCallback(async () => {
    try {
      const { files } = await listFiles();
      setFiles(files);
    } catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUploaded = (newFile) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.fileId === newFile.fileId);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = newFile;
        return updated;
      }
      return [newFile, ...prev];
    });
  };

  const handleDownload = async (file) => {
    try {
      const { url } = await getDownloadUrl(file.fileId, file.gcsPath);
      window.open(url, '_blank');
    } catch { toast.error('Failed to get download link'); }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}" and all its versions? This cannot be undone.`)) return;
    setDeleting(file.fileId);
    try {
      await deleteFile(file.fileId);
      setFiles(prev => prev.filter(f => f.fileId !== file.fileId));
      toast.success(`"${file.name}" deleted`);
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon-sm">☁</span>
          <span className="logo-text-sm">CloudDrive</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">📁 My Files</a>
          <a href="#" className="nav-item">🔗 Shared Links</a>
          <a href="#" className="nav-item">🕓 Recent</a>
        </nav>

        <div className="storage-info">
          <div className="storage-label">
            <span>Storage</span>
            <span className="storage-cap">5 GB Free</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min((files.length / 100) * 30, 100)}%` }} />
          </div>
          <span className="storage-sub">{files.length} file{files.length !== 1 ? 's' : ''} stored</span>
        </div>

        <div className="sidebar-user">
          <img src={user?.picture} alt="avatar" className="avatar" referrerPolicy="no-referrer" />
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="main-header">
          <div>
            <h1 className="main-title">My Files</h1>
            <p className="main-sub">Upload, manage, and share your files securely</p>
          </div>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <Dropzone onUploaded={handleUploaded} toast={toast} />

        {loading ? (
          <div className="files-loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="files-empty">
            <div style={{ fontSize: 48 }}>📭</div>
            <p>{search ? 'No files match your search.' : 'No files yet. Upload your first file above!'}</p>
          </div>
        ) : (
          <div className="files-list">
            <div className="files-count">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</div>
            {filtered.map(file => (
              <FileCard
                key={file.fileId}
                file={file}
                onDownload={handleDownload}
                onShare={setShareFile}
                onVersions={setVersionsFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {versionsFile && (
        <VersionsModal
          file={versionsFile}
          onClose={() => setVersionsFile(null)}
          toast={toast}
          onRefresh={loadFiles}
        />
      )}
      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
          toast={toast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}