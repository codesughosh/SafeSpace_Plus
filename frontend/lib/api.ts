import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — surface clean error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Journal ────────────────────────────────────────────────────────────────────
export const journalAPI = {
  list: (page = 1, limit = 10) =>
    api.get('/journal', { params: { page, limit } }),
  get: (id: string) => api.get(`/journal/${id}`),
  create: (data: object) => api.post('/journal', data),
  update: (id: string, data: object) => api.put(`/journal/${id}`, data),
  delete: (id: string) => api.delete(`/journal/${id}`),
  analyze: (id: string) => api.post(`/journal/${id}/analyze`),
};

// ── Mood ───────────────────────────────────────────────────────────────────────
export const moodAPI = {
  history: (days = 30) => api.get('/mood', { params: { days } }),
  log: (data: { score: number; note?: string; source?: string }) =>
    api.post('/mood', data),
};

// ── Chat ───────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sessions: () => api.get('/chat/sessions'),
  getSession: (id: string) => api.get(`/chat/sessions/${id}`),
  createSession: () => api.post('/chat/session'),
  sendMessage: (data: { message: string; sessionId: string }) =>
    api.post('/chat/message', data),
  summarize: (id: string) => api.post(`/chat/session/${id}/summarize`),
};

// ── Insights ───────────────────────────────────────────────────────────────────
export const insightsAPI = {
  dashboard: () => api.get('/insights/dashboard'),
  wordCloud: () => api.get('/insights/wordcloud'),
  recommendations: () => api.post('/insights/recommendations'),
  weeklyReport: () => api.post('/insights/weekly-report'),
};

// ── User ───────────────────────────────────────────────────────────────────────
export const userAPI = {
  onboarding: (data: object) => api.post('/user/onboarding', data),
  updateProfile: (data: object) => api.put('/user/profile', data),
  updatePreferences: (data: object) => api.put('/user/preferences', data),
  export: () => api.get('/user/export'),
  deleteData: () => api.delete('/user/data', { data: { confirmDelete: true } }),
};
