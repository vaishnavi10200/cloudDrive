import axios from 'axios';

// With Vite proxy configured in vite.config.js,
// /api and /auth requests are automatically forwarded to localhost:5000
const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const getLoginUrl = () => '/auth/login'; // proxied to backend

// ─── Files ────────────────────────────────────────────────────────────────────
export const listFiles = () => api.get('/api/files').then(r => r.data);

export const uploadFile = (formData, onProgress) =>
  api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);

export const uploadNewVersion = (fileId, formData, onProgress) =>
  api.post(`/api/files/${fileId}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);

export const getVersions = (fileId) =>
  api.get(`/api/files/${fileId}/versions`).then(r => r.data);

export const getDownloadUrl = (fileId, gcsPath) =>
  api.get(`/api/files/${fileId}/download`, { params: { gcsPath } }).then(r => r.data);

export const restoreVersion = (fileId, version) =>
  api.post(`/api/files/${fileId}/restore`, { version }).then(r => r.data);

export const deleteFile = (fileId) =>
  api.delete(`/api/files/${fileId}`).then(r => r.data);

// ─── Sharing ──────────────────────────────────────────────────────────────────
export const createShareLink = (payload) =>
  api.post('/api/share/create', payload).then(r => r.data);

export const getMyShares = () =>
  api.get('/api/share/mine').then(r => r.data);

export const revokeShareLink = (token) =>
  api.delete(`/api/share/${token}`).then(r => r.data);

export const getShareInfo = (token) =>
  api.get(`/api/share/info/${token}`).then(r => r.data);

export const downloadSharedFile = (token) =>
  api.get(`/api/share/download/${token}`).then(r => r.data);

export default api;