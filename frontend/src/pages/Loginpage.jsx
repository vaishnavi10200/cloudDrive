import React, { useEffect, useState } from 'react';
import { getLoginUrl } from '../utils/api';
import './LoginPage.css';

export default function LoginPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError('Authentication failed. Please try again.');
  }, []);

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="grid-lines" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">☁</div>
          <span className="logo-text">CloudDrive</span>
        </div>

        <h1 className="login-title">Your files,<br />everywhere.</h1>
        <p className="login-sub">
          Secure cloud storage with Google Cloud. Upload, version, and share your files instantly.
        </p>

        {error && <div className="login-error">⚠ {error}</div>}

        <a href={getLoginUrl()} className="google-btn">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.5 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36.5 24 36.5c-5.2 0-9.5-3-11.3-7.4l-6.6 4.9C9.6 39.5 16.3 44 24 44z"/>
            <path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6.1l6.2 5.2C42.9 36.1 44 31.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </a>

        <div className="login-features">
          <div className="feature"><span>🔒</span> OAuth 2.0 Security</div>
          <div className="feature"><span>📦</span> 5 GB Free Storage</div>
          <div className="feature"><span>🔗</span> Easy File Sharing</div>
          <div className="feature"><span>📜</span> File Versioning</div>
        </div>
      </div>
    </div>
  );
}