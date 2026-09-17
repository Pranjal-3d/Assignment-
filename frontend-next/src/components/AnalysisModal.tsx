'use client';

import { useState, useEffect, useRef } from 'react';
import type { EmployeeRequest, Ticket } from '@/lib/types';
import { api } from '@/lib/api';
import styles from './AnalysisModal.module.css';

interface Props {
  id: string;
  type: 'req' | 'ticket';
  requests: EmployeeRequest[];
  tickets: Ticket[];
  onClose: () => void;
  onOpenChat: (id: string) => void;
  onRefresh?: () => void;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^<]*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export default function AnalysisModal({ id, type, requests, tickets, onClose, onOpenChat, onRefresh }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const req = type === 'req' ? requests.find(r => r.id === id) : null;
  const ticket = type === 'ticket' ? tickets.find(t => t.id === id) : null;

  const handleResolve = async () => {
    try {
      if (type === 'ticket') {
        await api.updateTicket(id, 'Resolved', true);
      } else {
        await api.updateRequest(id, 'Resolved');
      }
      onRefresh?.();
      onClose();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleReject = async () => {
    try {
      if (type === 'ticket') {
        await api.updateTicket(id, 'Rejected', true);
      } else {
        await api.updateRequest(id, 'Rejected');
      }
      onRefresh?.();
      onClose();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleReopen = async () => {
    try {
      if (type === 'ticket') {
        await api.updateTicket(id, 'In Progress', false);
      } else {
        await api.updateRequest(id, 'In Progress');
      }
      onRefresh?.();
      onClose();
    } catch {
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        if (type === 'req') {
          const r = await api.analyze(id);
          setAnalysis(r.analysis);
        } else if (ticket) {
          const msg = `Analyze active ticket ${ticket.id}: Employee ${ticket.employee}, Issue: "${ticket.issue}", Status: "${ticket.status}". What action should IT take?`;
          const r = await api.analyzeTicket(msg);
          setAnalysis(r.reply);
        }
      } catch {
        setAnalysis('⚠️ Analysis failed. Please check backend connection.');
      }
      setLoading(false);
    };
    run();
  }, [id, type, ticket]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const subtitle = req
    ? `${req.employee} · ${req.email} · ${req.date}`
    : ticket ? `${ticket.employee} · ${ticket.status}` : '';

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.headIcon}><BotIcon /></div>
            <div>
              <div className={styles.headTitle}>ARIA Analysis — {id}</div>
              <div className={styles.headSub}>{subtitle}</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadWrap}>
              <div className={styles.dots}><span /><span /><span /></div>
              <p className={styles.loadText}>Analyzing {id}…</p>
            </div>
          ) : (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis ?? '') }}
            />
          )}
        </div>

        {/* Footer */}
        <div className={styles.foot}>
          {req && (
            <button className={styles.chatBtn} onClick={() => onOpenChat(id)}>
              <ChatIcon /> Continue in Chat
            </button>
          )}
          {((ticket && !ticket.closed) || (req && req.status !== 'Resolved' && req.status !== 'Rejected')) ? (
            <>
              <button className={styles.resolveBtn} onClick={handleResolve}>
                ✓ Mark Resolved
              </button>
              <button className={styles.rejectBtn} onClick={handleReject}>
                ✕ Reject / Close
              </button>
            </>
          ) : (
            <button className={styles.chatBtn} onClick={handleReopen}>
              🔄 Re-open Ticket
            </button>
          )}
          <button className={styles.closeBtn2} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function BotIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>; }
function ChatIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
