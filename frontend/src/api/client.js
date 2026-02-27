import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : rediriger vers /login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Ne pas rediriger si on est déjà sur la page login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Universités ───────────────────────────────
export const universitesAPI = {
  getAll: () => api.get('/universites'),
  getOne: (id) => api.get(`/universites/${id}`),
};

// ── Filières ──────────────────────────────────
export const filieresAPI = {
  getAll: (params) => api.get('/filieres', { params }),
  getOne: (id) => api.get(`/filieres/${id}`),
};

// ── Matières ──────────────────────────────────
export const matieresAPI = {
  getAll: (params) => api.get('/matieres', { params }),
  getOne: (id) => api.get(`/matieres/${id}`),
};

// ── Documents ─────────────────────────────────
export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getOne: (id) => api.get(`/documents/${id}`),
  upload: (formData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/documents/${id}`),
  vote: (id, note) => api.post(`/documents/${id}/vote`, { note }),
  downloadUrl: (id) => `${API_URL}/api/documents/${id}/download`,
};

// ── Recherche ─────────────────────────────────
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
};

// ── Stats ─────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
};

export default api;
