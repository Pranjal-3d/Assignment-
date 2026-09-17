'use client';

import type { AppData } from './Shell';
import styles from './KnowledgeBase.module.css';

const KB_ICONS: Record<string, string> = {
  'KB-01': '🔑', 'KB-02': '🌐', 'KB-03': '💻', 'KB-04': '📦',
  'KB-05': '🖨', 'KB-06': '📧', 'KB-07': '📡', 'KB-08': '💰',
  'KB-09': '🛡', 'KB-10': '🏠', 'ASSET-POLICY': '📋',
};

interface Props { data: AppData; }

export default function KnowledgeBase({ data }: Props) {
  const { kb } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>{kb.length} policy articles · {data.meta?.company ?? 'Veridian Corp'} IT Policies</p>
        </div>
      </div>

      <div className={styles.grid}>
        {kb.map(article => (
          <div key={article.id} className={`${styles.card} ${article.id === 'ASSET-POLICY' ? styles.cardWide : ''}`}>
            <div className={styles.cardTop}>
              <span className={styles.icon}>{KB_ICONS[article.id] ?? '📄'}</span>
              <div>
                <div className={styles.articleId}>{article.id}</div>
                <div className={styles.articleTitle}>{article.title}</div>
              </div>
            </div>
            <p className={styles.content}>{article.content}</p>
            <span className={styles.pill}>Policy Article</span>
          </div>
        ))}
      </div>
    </div>
  );
}
