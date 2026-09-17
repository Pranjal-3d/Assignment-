'use client';

import { useState } from 'react';
import type { AppData } from './Shell';
import { api } from '@/lib/api';
import styles from './Dashboard.module.css';
import { priorityClass, statusLabel } from '@/lib/utils';
import AnalysisModal from './AnalysisModal';

interface Props {
  data: AppData;
  onOpenChat: (reqId?: string) => void;
  onRefresh?: () => void;
}

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;

export default function Dashboard({ data, onOpenChat, onRefresh }: Props) {
  const { requests, tickets, stats, meta } = data;
  const active = tickets.filter(t => !t.closed);
  const [modal, setModal] = useState<{ id: string; type: 'req' | 'ticket' } | null>(null);

  const s = stats ?? { total_requests: 0, open_tickets: 0, critical_count: 0, closed_tickets: 0, priorities: {} as Record<string, number>, categories: {} as Record<string, number> };
  // Critical alerts driven entirely by the backend — excludes resolved/closed items
  const alerts = (meta?.critical_alerts ?? []).filter(a => a.status !== 'Resolved' && a.status !== 'Rejected');

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Operations Dashboard</h1>
          <p className={styles.subtitle}>{meta?.week_label ?? 'Loading…'}</p>
        </div>
        <button className={styles.ctaBtn} onClick={() => onOpenChat()}>
          <BotIcon /> Ask ARIA
        </button>
      </div>

      {/* Security / Critical Alerts — rendered dynamically from backend */}
      {alerts.map(alert => (
        <div key={alert.id} className={styles.alert}>
          <div className={styles.alertIcon}><AlertIcon /></div>
          <div className={styles.alertBody}>
            <strong>
              {alert.category === 'Security' ? 'Security Incident' : 'Critical Alert'} — {alert.id} · {alert.employee}
            </strong>
            <span>{alert.request} — Status: {alert.status}</span>
          </div>
          <button className={styles.alertAction} onClick={() => setModal({ id: alert.id, type: 'req' })}>
            Analyze →
          </button>
        </div>
      ))}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Requests', value: s.total_requests, sub: 'This week' },
          { label: 'Open Tickets',   value: s.open_tickets,  sub: 'Needs attention' },
          { label: 'Security Alerts',value: s.critical_count, sub: 'Urgent', urgent: true },
          { label: 'Resolved',       value: s.closed_tickets, sub: 'Closed tickets' },
        ].map((c) => (
          <div key={c.label} className={`${styles.statCard} ${c.urgent ? styles.statCardUrgent : ''}`}>
            <span className={styles.statValue}>{c.value}</span>
            <span className={styles.statLabel}>{c.label}</span>
            <span className={`${styles.statSub} ${c.urgent ? styles.statSubUrgent : ''}`}>{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {/* Recent Requests */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Recent Requests</span>
            <span className={styles.cardCount}>{requests.length}</span>
          </div>
          <div className={styles.reqList}>
            {requests.slice(0, 8).map(r => (
              <button key={r.id} className={styles.reqRow} onClick={() => setModal({ id: r.id, type: 'req' })}>
                <span className={styles.reqId}>{r.id}</span>
                <span className={`${styles.pDot} ${styles[priorityClass(r.priority)]}`} />
                <span className={styles.reqName}>{r.employee}</span>
                <span className={styles.reqIssue}>{r.request}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tickets */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Active Tickets</span>
            <span className={styles.cardCount}>{active.length}</span>
          </div>
          <div className={styles.tkList}>
            {active.map(t => (
              <button key={t.id} className={styles.tkRow} onClick={() => setModal({ id: t.id, type: 'ticket' })}>
                <span className={styles.tkId}>{t.id}</span>
                <span className={styles.tkEmp}>{t.employee}</span>
                <span className={styles.tkIssue}>{t.issue}</span>
                <span className={`${styles.sbadge} ${styles[statusLabel(t.status)]}`}>{t.status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Chart */}
        <div className={styles.card}>
          <div className={styles.cardHead}><span className={styles.cardTitle}>Priority Breakdown</span></div>
          <div className={styles.chart}>
            {PRIORITY_ORDER.map(p => {
              const count = s.priorities[p] ?? 0;
              const pct = s.total_requests ? Math.round((count / s.total_requests) * 100) : 0;
              return (
                <div key={p} className={styles.barRow}>
                  <div className={styles.barMeta}>
                    <span className={styles.barLabel}>{p}</span>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={`${styles.barFill} ${styles[`fill${p}`]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className={styles.card}>
          <div className={styles.cardHead}><span className={styles.cardTitle}>By Category</span></div>
          <div className={styles.catList}>
            {Object.entries(s.categories ?? {})
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div key={cat} className={styles.catRow}>
                  <span className={styles.catName}>{cat}</span>
                  <div className={styles.catBar}>
                    <div className={styles.catFill} style={{ width: `${(count / (s.total_requests || 1)) * 100}%` }} />
                  </div>
                  <span className={styles.catCount}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {modal && (
        <AnalysisModal
          id={modal.id}
          type={modal.type}
          requests={requests}
          tickets={tickets}
          onClose={() => setModal(null)}
          onOpenChat={(id) => { setModal(null); onOpenChat(id); }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function BotIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>; }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
