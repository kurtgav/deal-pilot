const BASE = '/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
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
};
