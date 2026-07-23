"use client";

import React from "react";

interface Budget {
  id: string;
  amount: number;
  period_start: string;
  period_end: string;
}

interface BudgetListProps {
  items: Budget[];
  onDelete: (id: string) => void;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

export function BudgetList({ items, onDelete, formatMoney, t }: BudgetListProps) {
  if (items.length === 0) {
    return (
      <section className="record-panel">
        <p className="empty-state">{t.noBudgets}</p>
      </section>
    );
  }

  return (
    <section className="record-panel">
      <h2>{t.yourBudgets}</h2>
      <div className="budget-list-rows">
        {items.map((item) => (
          <article className="record-row" key={item.id}>
            <div>
              <strong>
                {item.period_start} {t.to} {item.period_end}
              </strong>
              <p>{t.spendingLimit}</p>
            </div>
            <div className="record-amount-actions">
              <b>{formatMoney(Number(item.amount))}</b>
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
        ))}
      </div>
    </section>
  );
}
