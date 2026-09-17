import type { EmployeeRequest, Ticket, KBArticle, Stats, ApiHealth, Meta } from './types';

// Use environment variable for backend URL on Render, or default to relative path
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  health: () => get<ApiHealth>('/api/health'),
  requests: () => get<EmployeeRequest[]>('/api/requests'),
  tickets: () => get<Ticket[]>('/api/tickets'),
  kb: () => get<KBArticle[]>('/api/kb'),
  stats: () => get<Stats>('/api/stats'),
  meta: () => get<Meta>('/api/meta'),

  chat: (message: string, sessionId: string, requestContext?: string) =>
    post<{ reply: string; gemini_powered: boolean; response_time_ms: number }>('/api/chat', {
      message,
      session_id: sessionId,
      request_context: requestContext,
    }),

  analyze: (reqId: string) =>
    post<{ analysis: string; gemini_powered: boolean }>(`/api/chat/analyze/${reqId}`, {}),

  analyzeTicket: (message: string) =>
    post<{ reply: string; gemini_powered: boolean }>('/api/chat', {
      message,
      session_id: `ticket_${Date.now()}`,
    }),

  resetChat: (sessionId: string) =>
    post<{ status: string }>('/api/chat/reset', { session_id: sessionId }),

  updateTicket: (id: string, status: string, closed: boolean) =>
    post<{ status: string; ticket: Ticket }>(`/api/tickets/${id}/update`, { status, closed }),

  updateRequest: (id: string, status: string) =>
    post<{ status: string; request: EmployeeRequest }>(`/api/requests/${id}/update`, { status }),
};
