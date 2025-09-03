import api from './api';

/**
 * Dashboard-style summaries (match your backend routes)
 * GET /api/dashboard/statistics
 * GET /api/dashboard/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
 * GET /api/dashboard/status-breakdown?from=&to=
 * GET /api/dashboard/recent-shipments
 */
export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/statistics');
  return data;
}

export async function getRevenueSummary(from, to) {
  const { data } = await api.get('/dashboard/revenue', { params: { from, to } });
  return data;
}

export async function getStatusBreakdown(from, to) {
  const { data } = await api.get('/dashboard/status-breakdown', { params: { from, to } });
  return data;
}

export async function getRecentShipments(limit = 20) {
  const { data } = await api.get('/dashboard/recent-shipments', { params: { limit } });
  return Array.isArray(data) ? data : (data?.items || []);
}

/**
 * Time-range shipments; if you already expose /api/shipments?from&to in the backend,
 * this will work. Otherwise, adjust to your actual reporting endpoint.
 */
export async function getShipmentsByDateRange(from, to) {
  const { data } = await api.get('/shipments', { params: { from, to } });
  return Array.isArray(data) ? data : (data?.items || []);
}
