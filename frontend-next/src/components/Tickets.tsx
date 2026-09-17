'use client';

import { useState } from 'react';
import type { AppData } from './Shell';
import { statusLabel } from '@/lib/utils';
import AnalysisModal from './AnalysisModal';
import styles from './Tickets.module.css';

type Filter = 'all' | 'active' | 'closed';

interface Props {
  data: AppData;
  onRefresh?: () => void;
}

const CAT_ICON: Record<string, string> = {
  Hardware: '💻', Network: '🌐', Access: '🔑', Software: '📦',
  Email: '📧', Security: '🛡', Equipment: '🖥', Unknown: '❓',
};

export default function Tickets({ data, onRefresh }: Props) {
  const { tickets, requests } = data;
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<string | null>(null);

  const filtered = tickets.filter(t => {
    if (filter === 'active') return !t.closed;
    if (filter === 'closed') return t.closed;
    return true;
  });

  const counts = {
    all: tickets.length,
    active: tickets.filter(t => !t.closed).length,
    closed: tickets.filter(t => t.closed).length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ticket Queue</h1>
          <p className={styles.subtitle}>{tickets.length} tickets · {counts.active} active · {counts.closed} closed</p>
        </div>
        <div className={styles.tabs}>
          {(['all', 'active', 'closed'] as Filter[]).map(f => (
            <button
              key={f}
              className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.tabCount}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Employee</th>
              <th>Category</th>
              <th>Issue</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className={t.closed ? styles.rowClosed : ''}>
                <td>
                  <span className={styles.tkId}>{t.id}</span>
                </td>
                <td>
                  <span className={styles.tkEmp}>{t.employee}</span>
                </td>
                <td>
                  <span className={styles.catChip}>
                    <span>{CAT_ICON[t.category] ?? '·'}</span>
                    {t.category}
                  </span>
                </td>
                <td className={styles.issueTd}>{t.issue}</td>
                <td>
                  <span className={`${styles.sb} ${styles[statusLabel(t.status)]}`}>{t.status}</span>
                </td>
                <td>
                  <button className={styles.reviewBtn} onClick={() => setModal(t.id)}>
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <AnalysisModal
          id={modal}
          type="ticket"
          requests={requests}
          tickets={tickets}
          onClose={() => setModal(null)}
          onOpenChat={() => setModal(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
