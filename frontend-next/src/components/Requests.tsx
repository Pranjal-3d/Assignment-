'use client';

import { useState } from 'react';
import type { AppData } from './Shell';
import type { Priority } from '@/lib/types';
import { statusLabel, priorityClass } from '@/lib/utils';
import AnalysisModal from './AnalysisModal';
import styles from './Requests.module.css';

const PRIORITIES: Array<Priority | 'all'> = ['all', 'Critical', 'High', 'Medium', 'Low'];

interface Props {
  data: AppData;
  onOpenChat: (reqId: string) => void;
  onRefresh?: () => void;
}

export default function Requests({ data, onOpenChat, onRefresh }: Props) {
  const { requests } = data;
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<string | null>(null);

  const filtered = requests.filter(r => {
    const matchP = filter === 'all' || r.priority === filter;
    const q = search.toLowerCase();
    const matchS = !q || r.id.toLowerCase().includes(q) || r.employee.toLowerCase().includes(q) || r.request.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    return matchP && matchS;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employee Requests</h1>
          <p className={styles.subtitle}>{requests.length} requests · {data.meta?.week_short ?? 'Week 21–25 Sep 2026'}</p>
        </div>
        <input
          className={styles.search}
          placeholder="Search requests…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {PRIORITIES.map(p => {
          const count = p === 'all' ? requests.length : requests.filter(r => r.priority === p).length;
          return (
            <button
              key={p}
              className={`${styles.tab} ${filter === p ? styles.tabActive : ''}`}
              onClick={() => setFilter(p)}
            >
              {p === 'all' ? 'All' : p}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.map(r => (
          <div key={r.id} className={`${styles.card} ${styles[priorityClass(r.priority)]}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <span className={styles.reqId}>{r.id}</span>
                <span className={styles.dot}>·</span>
                <span className={styles.date}>{r.date}</span>
              </div>
              <div className={styles.badges}>
                <span className={styles.cat}>{r.category}</span>
                <span className={`${styles.pri} ${styles[`pri${r.priority}`]}`}>{r.priority}</span>
              </div>
            </div>

            <div className={styles.employee}>
              <span className={styles.empName}>{r.employee}</span>
              <span className={styles.empEmail}>{r.email}</span>
            </div>

            <blockquote className={styles.quote}>"{r.request}"</blockquote>

            <div className={styles.cardBot}>
              <span className={`${styles.status} ${styles[statusLabel(r.status)]}`}>{r.status}</span>
              <div className={styles.actions}>
                <button className={styles.chatBtn} onClick={() => onOpenChat(r.id)}>
                  <ChatIcon /> Chat
                </button>
                <button className={styles.analyzeBtn} onClick={() => setModal(r.id)}>
                  <BotIcon /> Analyze
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <AnalysisModal
          id={modal}
          type="req"
          requests={requests}
          tickets={[]}
          onClose={() => setModal(null)}
          onOpenChat={(id: string) => { setModal(null); onOpenChat(id); }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function BotIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/></svg>; }
function ChatIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
