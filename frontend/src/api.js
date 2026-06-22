const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => apiFetch('/api/stats'),
  getSessions: () => apiFetch('/api/sessions'),
  getSession: (id) => apiFetch(`/api/sessions/${encodeURIComponent(id)}`),
  getPages: () => apiFetch('/api/pages'),
  getHeatmap: (page_url) => apiFetch(`/api/heatmap?page_url=${encodeURIComponent(page_url)}`),
};
