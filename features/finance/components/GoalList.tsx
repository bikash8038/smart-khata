"use client";

import React from "react";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

interface GoalListProps {
  items: Goal[];
  onDelete: (id: string) => void;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

export function GoalList({ items, onDelete, formatMoney, t }: GoalListProps) {
  if (items.length === 0) {
    return (
      <section className="record-panel">
        <p className="empty-state">{t.noGoals}</p>
      </section>
    );
  }

  return (
    <section className="record-panel">
      <h2>{t.yourGoals}</h2>
      <div className="goal-list-container">
        {items.map((item) => {
          const progressPercent = Math.min(
            100,
            Math.round((Number(item.current_amount) / Number(item.target_amount)) * 100)
          );
          
          return (
            <article className="record-row goal-row" key={item.id}>
              <div className="goal-details-wrapper">
                <strong>{item.title}</strong>
                <p>
                  {t.savingsLabel}: {formatMoney(Number(item.current_amount))} / {formatMoney(Number(item.target_amount))}
                  {item.target_date ? ` · ${t.date}: ${item.target_date}` : ""}
                </p>
                <div className="goal-progress-bar-wrapper">
                  <div className="goal-progress-track">
                    <span
                      className="goal-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="goal-progress-percent">{progressPercent}%</span>
                </div>
              </div>
              <div className="record-amount-actions">
                <span className="row-actions">
                  <button
                    type="button"
                    className="action-btn-red"
                    onClick={() => onDelete(item.id)}
                    title={t.remove}
                    aria-label={t.remove}
                  >
                    <svg className="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
