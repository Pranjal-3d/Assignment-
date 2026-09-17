'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppData } from './Shell';
import type { ChatMessage, EmployeeRequest } from '@/lib/types';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import styles from './Chat.module.css';

interface Props {
  data: AppData;
  initialContext: string | null;
  clearContext: () => void;
}

const QUICK = [
  { label: 'Account locked out', msg: "I'm locked out of my account after multiple failed password attempts." },
  { label: 'VPN expired',        msg: 'My VPN credentials have expired, I cannot connect remotely.' },
  { label: 'Phishing email',     msg: 'I received a suspicious email asking for my login credentials.' },
  { label: 'Software install',   msg: 'I need to install software that is not in the approved catalog.' },
  { label: 'Laptop dead',        msg: "My laptop won't turn on at all — it's completely dead." },
  { label: 'Mailbox full',       msg: "My mailbox is completely full and I can't send or receive emails." },
];

export default function Chat({ data, initialContext, clearContext }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<string | null>(initialContext);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter out Resolved and Rejected requests from the chatbot sidebar
  const activeRequests = data.requests.filter(
    r => r.status !== 'Resolved' && r.status !== 'Rejected'
  );

  const selectContext = (id: string | null) => {
    if (context === id) {
      // Clear context
      setContext(null);
      clearContext();
      setSessionId(`session_${Date.now()}`);
      setMessages([]);
    } else {
      // New session for selected customer request
      setContext(id);
      setSessionId(id ? `session_${id}_${Date.now()}` : `session_${Date.now()}`);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
      setSessionId(`session_${initialContext}_${Date.now()}`);
      setMessages([]);
    }
  }, [initialContext]);

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: formatTime(),
    };

    setMessages(m => [...m, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Thinking placeholder
    const thinkId = `think_${Date.now()}`;
    setMessages(m => [...m, { id: thinkId, role: 'aria', content: '__thinking__', timestamp: '' }]);

    try {
      const res = await api.chat(text.trim(), sessionId, context ?? undefined);
      setMessages(m => m.map(msg =>
        msg.id === thinkId
          ? { id: thinkId, role: 'aria', content: res.reply, timestamp: formatTime(), geminiPowered: res.gemini_powered, responseMs: res.response_time_ms }
          : msg
      ));
    } catch {
      setMessages(m => m.map(msg =>
        msg.id === thinkId
          ? { ...msg, content: '⚠️ Connection error. Please check backend connection.' }
          : msg
      ));
    }
    setSending(false);
  }, [sending, sessionId, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleReset = async () => {
    await api.resetChat(sessionId).catch(() => {});
    setMessages([]);
    clearContext();
    setContext(null);
    setSessionId(`session_${Date.now()}`);
  };

  const contextReq = context ? data.requests.find(r => r.id === context) : null;

  return (
    <div className={styles.layout}>
      {/* Chat column */}
      <div className={styles.chatCol}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.ariaIcon}><BotIcon /></div>
            <div>
              <div className={styles.chatTitle}>ARIA</div>
              <div className={styles.chatSub}>Automated Resolution &amp; IT Assistant · Policy-grounded</div>
            </div>
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>Clear</button>
        </div>

        {/* Context badge */}
        {contextReq && (
          <div className={styles.contextBadge}>
            <span className={styles.contextId}>{contextReq.id}</span>
            <span className={styles.contextName}>{contextReq.employee}</span>
            <span className={styles.contextIssue}>{contextReq.request}</span>
            <button className={styles.contextX} onClick={() => selectContext(null)}>✕</button>
          </div>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><BotIcon /></div>
              <div className={styles.emptyTitle}>Ask me anything about IT support</div>
              <div className={styles.emptyDesc}>I can help with passwords, VPN, laptops, software, printers, email, security incidents, and more — all grounded in {data.meta?.company ?? 'Veridian Corp'} policy.</div>
            </div>
          )}
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          <div ref={messagesEnd} />
        </div>

        {/* Quick prompts (only when no messages) */}
        {messages.length === 0 && (
          <div className={styles.quickRow}>
            {QUICK.map(q => (
              <button key={q.label} className={styles.chip} onClick={() => send(q.msg)}>
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className={styles.inputWrap}>
          <div className={styles.inputBox}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your IT issue…"
              rows={1}
              maxLength={2000}
              disabled={sending}
            />
            <div className={styles.inputActions}>
              <span className={styles.charCount}>{input.length}/2000</span>
              <button
                className={styles.sendBtn}
                onClick={() => send(input)}
                disabled={!input.trim() || sending}
                aria-label="Send"
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <p className={styles.disclaimer}>{data.meta?.agent_name ?? 'ARIA'} responds based solely on {data.meta?.company ?? 'Veridian Corp'} IT policies. For emergencies, contact IT directly.</p>
        </div>
      </div>

      {/* Context sidebar */}
      <div className={styles.contextSidebar}>
        <div className={styles.csTitle}>Active Requests</div>
        <p className={styles.csHint}>Select an open request to start a new chat session:</p>
        <div className={styles.csList}>
          {activeRequests.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-3)' }}>
              All employee requests are resolved!
            </div>
          ) : (
            activeRequests.map(r => (
              <button
                key={r.id}
                className={`${styles.csItem} ${context === r.id ? styles.csItemActive : ''}`}
                onClick={() => selectContext(r.id)}
              >
                <span className={styles.csItemId}>{r.id}</span>
                <span className={styles.csItemName}>{r.employee}</span>
                <span className={styles.csItemIssue}>{r.request}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const isThinking = msg.content === '__thinking__';

  return (
    <div className={`${styles.msg} ${isUser ? styles.msgUser : styles.msgAria}`}>
      {!isUser && (
        <div className={styles.msgAvatar}><BotIcon /></div>
      )}
      <div className={styles.msgBubble}>
        {isThinking ? (
          <div className={styles.thinking}>
            <span /><span /><span />
          </div>
        ) : (
          <div
            className={styles.msgContent}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}
        {!isThinking && (
          <div className={styles.msgMeta}>
            {isUser ? 'You' : 'ARIA'} · {msg.timestamp}
            {!isUser && msg.geminiPowered !== undefined && (
              <span className={styles.metaTag}>{msg.geminiPowered ? 'Gemini' : 'Demo'}</span>
            )}
            {msg.responseMs ? <span className={styles.metaMs}>{msg.responseMs}ms</span> : null}
          </div>
        )}
      </div>
      {isUser && <div className={styles.msgAvatarUser}>YOU</div>}
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function BotIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>; }
function SendIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
