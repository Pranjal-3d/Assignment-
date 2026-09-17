'use client';

import type { View } from './Shell';
import styles from './Sidebar.module.css';

const NAV = [
  { id: 'dashboard' as View,  label: 'Dashboard',         icon: GridIcon },
  { id: 'chat'      as View,  label: 'Chat with ARIA',    icon: ChatIcon },
  { id: 'requests'  as View,  label: 'Employee Requests', icon: InboxIcon },
  { id: 'tickets'   as View,  label: 'Ticket Queue',      icon: TicketIcon },
  { id: 'knowledge' as View,  label: 'Knowledge Base',    icon: BookIcon },
];

interface Props {
  view: View;
  setView: (v: View) => void;
  open: boolean;
  gemini: boolean;
  requestCount: number;
  ticketCount: number;
  company: string;
  weekShort: string;
}

export default function Sidebar({ view, setView, open, gemini, requestCount, ticketCount, company, weekShort }: Props) {
  const counts: Partial<Record<View, number>> = {
    requests: requestCount,
    tickets: ticketCount,
  };

  return (
    <aside className={`${styles.sidebar} ${!open ? styles.hidden : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <LogoIcon />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>ARIA</span>
          <span className={styles.logoSub}>IT Support Agent</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${view === item.id ? styles.active : ''}`}
            onClick={() => setView(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
            {counts[item.id] !== undefined && (
              <span className={styles.badge}>{counts[item.id]}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.statusRow}>
          <span className={`${styles.dot} ${gemini ? styles.dotOn : styles.dotDim}`} />
          <span className={styles.statusText}>
            {gemini ? 'Gemini connected' : 'Demo mode'}
          </span>
        </div>
        <div className={styles.company}>
          <span>{company || 'Veridian Corp'}</span>
          <span className={styles.week}>{weekShort || '—'}</span>
        </div>
      </div>
    </aside>
  );
}

/* ── Inline SVG icons (no dependency) ─────────────────────────────────────── */
function LogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect width="18" height="18" rx="4" fill="white" />
      <path d="M5 9l3 3 5-5" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function ChatIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function InboxIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>; }
function TicketIcon(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>; }
function BookIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
