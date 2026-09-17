'use client';

import { useState, useEffect } from 'react';
import type { View } from './Shell';
import styles from './TopBar.module.css';

const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat with ARIA',
  requests: 'Employee Requests',
  tickets: 'Ticket Queue',
  knowledge: 'Knowledge Base',
};

interface Props {
  view: View;
  onMenuClick: () => void;
  gemini: boolean;
  loading: boolean;
  company?: string;
}

export default function TopBar({ view, onMenuClick, gemini, loading, company }: Props) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.company}>{company || 'Veridian Corp'}</span>
          <span className={styles.sep}>/</span>
          <span className={styles.page}>{VIEW_LABELS[view]}</span>
        </div>
      </div>

      <div className={styles.right}>
        {loading && <span className={styles.loading}>Loading…</span>}
        <div className={styles.modelChip}>
          <span className={`${styles.modelDot} ${gemini ? styles.modelDotOn : ''}`} />
          <span>{gemini ? 'Gemini 1.5 Flash' : 'Demo mode'}</span>
        </div>
        <span className={styles.clock}>{time}</span>
        <div className={styles.avatar}>IT</div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
