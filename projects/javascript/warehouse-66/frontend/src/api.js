const BASE = '/api';
const STORAGE_KEY = 'wh66_auth';

function getToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch { return null; }
}

async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && token) {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
    return;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  register:       (b)             => req('/auth/register', { method: 'POST', body: b }),
  login:          (b)             => req('/auth/login',    { method: 'POST', body: b }),
  me:             ()              => req('/auth/me'),

  users:          ()              => req('/users'),
  updateUserRole: (id, role)      => req(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  deleteUser:     (id)            => req(`/users/${id}`, { method: 'DELETE' }),

  summary:        ()              => req('/summary'),
  log:            (limit = 100)   => req(`/audit-log?limit=${limit}`),
  clearLog:       ()              => req('/audit-log', { method: 'DELETE' }),

  materials:      ()              => req('/materials'),
  suppliers:      ()              => req('/suppliers'),
  documents:      ()              => req('/documents'),
  units:          ()              => req('/units'),

  storageList:    ()              => req('/storage-units'),
  addStorage:     (body)          => req('/storage-units', { method: 'POST', body }),

  suppliersCount: (matId)         => req(`/analytics/suppliers-count/${matId}`),
  suppliersOf:    (matId)         => req(`/analytics/suppliers-of-material/${matId}`),
  byBankCity:     (city)          => req(`/analytics/suppliers-by-bank-city?city=${encodeURIComponent(city)}`),
};

// Новые эндпоинты
export const apiExt = {
  ...api,
  oldOrders:     (days = 30) => req(`/storage-units/old?days=${days}`),
  topSuppliers:  (limit = 5) => req(`/analytics/top-suppliers?limit=${limit}`),
  warehouseStats:()           => req('/analytics/warehouse-stats'),
};
