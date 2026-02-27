import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../utils/api';
import './Dropzone.css';

export default function Dropzone({ onUploaded, toast }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(formData, setProgress);
      toast.success(`✓ "${file.name}" uploaded successfully`);
      onUploaded(result.file);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      setFileName('');
    }
  }, [onUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}>
      <input {...getInputProps()} />
      {uploading ? (
        <div className="dropzone-uploading">
          <div className="upload-spinner" />
          <div className="upload-text">
            <span>Uploading <strong>{fileName}</strong></span>
            <span className="upload-pct">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : isDragActive ? (
        <div className="dropzone-inner active-inner">
          <div className="drop-icon">📂</div>
          <p>Drop it here!</p>
        </div>
      ) : (
        <div className="dropzone-inner">
          <div className="drop-icon">☁</div>
          <p><strong>Drag & drop</strong> a file here</p>
          <p className="drop-sub">or click to browse · max 100 MB</p>
        </div>
      )}
    </div>
  );
}