export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface CriticalAlert {
  id: string;
  employee: string;
  email: string;
  request: string;
  status: string;
  category: string;
}

export interface SecurityTicket {
  id: string;
  employee: string;
  issue: string;
  status: string;
}

export interface Meta {
  company: string;
  agent_name: string;
  agent_full_name: string;
  week_label: string;
  week_short: string;
  first_date: string;
  last_date: string;
  critical_alerts: CriticalAlert[];
  security_tickets: SecurityTicket[];
}
export type TicketStatus = 'active' | 'closed';

export interface EmployeeRequest {
  id: string;
  employee: string;
  email: string;
  date: string;
  request: string;
  status: string;
  category: string;
  priority: Priority;
}

export interface Ticket {
  id: string;
  employee: string;
  issue: string;
  status: string;
  closed: boolean;
  category: string;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
}

export interface Stats {
  total_requests: number;
  open_tickets: number;
  closed_tickets: number;
  critical_count: number;
  high_priority: number;
  categories: Record<string, number>;
  statuses: Record<string, number>;
  priorities: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'aria';
  content: string;
  timestamp: string;
  geminiPowered?: boolean;
  responseMs?: number;
}

export interface ApiHealth {
  status: string;
  gemini: boolean;
  timestamp: string;
  version: string;
  agent: string;
}
