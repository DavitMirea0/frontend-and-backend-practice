import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
});

// ── Interceptor запроса: подставляем access-токен ──────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor ответа: автообновление токена при 401 ─────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const accessToken  = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!accessToken || !refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
      try {
        const res = await apiClient.post('/auth/refresh', { refreshToken });
        if (res.data.refresh_expired) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return Promise.reject(error);
        }
        localStorage.setItem('accessToken',  res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  register: async (email, password, firstName, lastName, role = 'user') => {
    const res = await apiClient.post('/auth/register', { email, password, first_name: firstName, last_name: lastName, role });
    return res.data;
  },
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.accessToken)  localStorage.setItem('accessToken',  res.data.accessToken);
    if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
    return res.data;
  },
  refresh: async (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  me: async () => { const res = await apiClient.get('/auth/me'); return res.data; },
  logout: () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); },

  // Users (admin)
  getUsers:    async ()       => { const res = await apiClient.get('/users'); return res.data; },
  getUser:     async (id)     => { const res = await apiClient.get(`/users/${id}`); return res.data; },
  updateUser:  async (id, p)  => { const res = await apiClient.put(`/users/${id}`, p); return res.data; },
  blockUser:   async (id)     => { const res = await apiClient.delete(`/users/${id}`); return res.data; },

  // Products
  getProducts:   async ()      => { const res = await apiClient.get('/products'); return res.data; },
  getProduct:    async (id)    => { const res = await apiClient.get(`/products/${id}`); return res.data; },
  createProduct: async (p)     => { const res = await apiClient.post('/products', p); return res.data; },
  updateProduct: async (id, p) => { const res = await apiClient.put(`/products/${id}`, p); return res.data; },
  deleteProduct: async (id)    => { const res = await apiClient.delete(`/products/${id}`); return res.data; },
};
