import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    client.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    client.post('/auth/login', data).then(r => r.data),
  me: () => client.get('/auth/me').then(r => r.data),
  logout: () => client.post('/auth/logout').then(r => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.post('/auth/change-password', data).then(r => r.data),
};

// --- Users ---
export const usersApi = {
  getProfile: () => client.get('/users/profile').then(r => r.data),
  updateProfile: (data: any) => client.put('/users/profile', data).then(r => r.data),
  getConnectedAccounts: () => client.get('/users/connected-accounts').then(r => r.data),
  disconnectYouTube: (channelId: string) => client.delete(`/users/disconnect/youtube/${channelId}`).then(r => r.data),
  disconnectInstagram: (accountId: string) => client.delete(`/users/disconnect/instagram/${accountId}`).then(r => r.data),
};

// --- Channels ---
export const channelsApi = {
  getAll: () => client.get('/channels').then(r => r.data),
  getOne: (id: string) => client.get(`/channels/${id}`).then(r => r.data),
  getSummary: () => client.get('/channels/summary/all').then(r => r.data),
  delete: (id: string) => client.delete(`/channels/${id}`).then(r => r.data),
};

// --- Posts ---
export const postsApi = {
  getAll: (params?: any) => client.get('/posts', { params }).then(r => r.data),
  getOne: (id: string) => client.get(`/posts/${id}`).then(r => r.data),
  create: (data: any) => client.post('/posts', data).then(r => r.data),
  update: (id: string, data: any) => client.put(`/posts/${id}`, data).then(r => r.data),
  delete: (id: string) => client.delete(`/posts/${id}`).then(r => r.data),
  getStatsSummary: () => client.get('/posts/stats/summary').then(r => r.data),
};

// --- YouTube ---
export const youtubeApi = {
  getAuthUrl: () => client.get('/youtube/auth').then(r => r.data),
  uploadVideo: (formData: FormData, onProgress?: (p: number) => void) =>
    client.post('/youtube/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    }).then(r => r.data),
  getVideos: (channelId: string) => client.get(`/youtube/videos/${channelId}`).then(r => r.data),
  getAnalytics: (channelId: string, range?: string) =>
    client.get(`/youtube/analytics/${channelId}`, { params: { range } }).then(r => r.data),
  getCategories: () => client.get('/youtube/categories').then(r => r.data),
};

// --- Instagram ---
export const instagramApi = {
  getAuthUrl: () => client.get('/instagram/auth').then(r => r.data),
  publish: (formData: FormData, onProgress?: (p: number) => void) =>
    client.post('/instagram/publish', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    }).then(r => r.data),
  getMedia: (accountId: string) => client.get(`/instagram/media/${accountId}`).then(r => r.data),
  getAnalytics: (accountId: string, range?: string) =>
    client.get(`/instagram/analytics/${accountId}`, { params: { range } }).then(r => r.data),
};

// --- Analytics ---
export const analyticsApi = {
  getOverview: (params?: { range?: string; platform?: string }) =>
    client.get('/analytics/overview', { params }).then(r => r.data),
  getChannel: (channelId: string, range?: string) =>
    client.get(`/analytics/channel/${channelId}`, { params: { range } }).then(r => r.data),
  getPost: (postId: string, range?: string) =>
    client.get(`/analytics/post/${postId}`, { params: { range } }).then(r => r.data),
  getTopPosts: (metric?: string, limit?: number) =>
    client.get('/analytics/top-posts', { params: { metric, limit } }).then(r => r.data),
};

// --- Admin ---
const adminClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    adminClient.post('/admin/login', data).then(r => r.data),
  me: () => adminClient.get('/admin/me').then(r => r.data),
  getStats: () => adminClient.get('/admin/stats').then(r => r.data),
  getUsers: (params?: any) => adminClient.get('/admin/users', { params }).then(r => r.data),
  toggleUser: (id: string) => adminClient.patch(`/admin/users/${id}/toggle-active`).then(r => r.data),
  deleteUser: (id: string) => adminClient.delete(`/admin/users/${id}`).then(r => r.data),
  getChannels: (params?: any) => adminClient.get('/admin/channels', { params }).then(r => r.data),
  getPosts: (params?: any) => adminClient.get('/admin/posts', { params }).then(r => r.data),
};

export default client;
