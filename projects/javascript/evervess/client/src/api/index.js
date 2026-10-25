import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, async error => {
  const orig = error.config;
  if (error.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    try {
      const rt = localStorage.getItem('refreshToken');
      const res = await axios.post('http://localhost:5000/api/auth/refresh', { refreshToken: rt });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      orig.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return api(orig);
    } catch {
      localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
