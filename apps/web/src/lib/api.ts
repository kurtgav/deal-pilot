import { supabase } from './supabase';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/**
 * All protected /api/* endpoints require a Supabase JWT in the
 * Authorization header. We fetch the current session right before each
 * request — supabase-js handles auto-refresh internally, so this returns
 * the freshest token without us managing expiry.
 */
async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const auth = await authHeader();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(opts?.headers ?? {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Request failed');
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getLeads: () => request<any[]>('/leads'),
  getLead: (id: string) => request<any>(`/leads/${id}`),
  createLead: (data: any) => request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadStatus: (id: string, status: string) => request<any>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  startSession: (leadId: string) => request<any>('/sessions/start', { method: 'POST', body: JSON.stringify({ leadId }) }),
  endSession: (id: string) => request<any>(`/sessions/${id}/end`, { method: 'PATCH' }),
  getSession: (id: string) => request<any>(`/sessions/${id}`),
  generateHandoff: (sessionId: string) => request<any>('/handoff/generate', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  getHandoff: (sessionId: string) => request<any>(`/handoff/${sessionId}`),
  getHandoffs: () => request<any[]>('/handoff'),
  getKnowledge: (resource: string) => request<any[]>(`/knowledge/${resource}`),
  createKnowledge: (resource: string, data: any) => request<any>(`/knowledge/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  updateKnowledge: (resource: string, id: string, data: any) => request<any>(`/knowledge/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKnowledge: (resource: string, id: string) => request<void>(`/knowledge/${resource}/${id}`, { method: 'DELETE' }),
  getAdminRoles: () => request<{ id: string; name: string; description: string }[]>('/admin/roles'),
  getAdminUsers: () => request<{ id: string; email: string | null; createdAt: string; roles: string[] }[]>('/admin/users'),
  setUserRole: (id: string, role: string) => request<{ userId: string; role: string }>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};
