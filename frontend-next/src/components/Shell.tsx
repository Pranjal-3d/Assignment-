'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Dashboard from './Dashboard';
import Chat from './Chat';
import Requests from './Requests';
import Tickets from './Tickets';
import KnowledgeBase from './KnowledgeBase';
import { api } from '@/lib/api';
import type { EmployeeRequest, Ticket, KBArticle, Stats, ApiHealth, Meta } from '@/lib/types';
import styles from './Shell.module.css';

export type View = 'dashboard' | 'chat' | 'requests' | 'tickets' | 'knowledge';

export interface AppData {
  requests: EmployeeRequest[];
  tickets: Ticket[];
  kb: KBArticle[];
  stats: Stats | null;
  health: ApiHealth | null;
  meta: Meta | null;
  loading: boolean;
}

export default function Shell() {
  const [view, setView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<AppData>({
    requests: [], tickets: [], kb: [], stats: null, health: null, meta: null, loading: true,
  });
  const [chatContext, setChatContext] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleSidebarClose = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const [requests, tickets, kb, stats, health, meta] = await Promise.all([
        api.requests(), api.tickets(), api.kb(), api.stats(), api.health(), api.meta(),
      ]);
      setData({ requests, tickets, kb, stats, health, meta, loading: false });
    } catch {
      setData(d => ({ ...d, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openChat = (reqId?: string) => {
    if (reqId) setChatContext(reqId);
    setView('chat');
  };

  return (
    <div className={styles.shell}>
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        view={view}
        setView={setView}
        open={sidebarOpen}
        onClose={handleSidebarClose}
        gemini={data.health?.gemini ?? false}
        requestCount={data.requests.length}
        ticketCount={data.tickets.length}
        company={data.meta?.company ?? ''}
        weekShort={data.meta?.week_short ?? ''}
      />
      <div className={`${styles.main} ${!sidebarOpen ? styles.mainExpanded : ''}`}>
        <TopBar
          view={view}
          onMenuClick={() => setSidebarOpen(o => !o)}
          gemini={data.health?.gemini ?? false}
          loading={data.loading}
          company={data.meta?.company}
        />
        <div className={styles.content}>
          {view === 'dashboard'  && <Dashboard data={data} onOpenChat={openChat} onRefresh={load} />}
          {view === 'chat'       && <Chat data={data} initialContext={chatContext} clearContext={() => setChatContext(null)} />}
          {view === 'requests'   && <Requests data={data} onOpenChat={openChat} onRefresh={load} />}
          {view === 'tickets'    && <Tickets data={data} onRefresh={load} />}
          {view === 'knowledge'  && <KnowledgeBase data={data} />}
        </div>
      </div>
    </div>
  );
}
