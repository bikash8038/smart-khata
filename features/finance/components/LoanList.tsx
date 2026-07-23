"use client";

import React from "react";

interface Loan {
  id: string;
  person_name: string;
  direction: "borrowed" | "lent";
  principal_amount: number;
  outstanding_amount: number;
  due_date: string | null;
}

interface LoanListProps {
  items: Loan[];
  onDelete: (id: string) => void;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

export function LoanList({ items, onDelete, formatMoney, t }: LoanListProps) {
  if (items.length === 0) {
    return (
      <section className="record-panel">
        <p className="empty-state">{t.noLoans}</p>
      </section>
    );
  }

  return (
    <section className="record-panel">
      <h2>{t.loanDetails}</h2>
      <div className="loan-list-rows">
        {items.map((item) => (
          <article className="record-row" key={item.id}>
            <div>
              <strong>{item.person_name}</strong>
              <p>
                <span className={`direction-badge ${item.direction}`}>
                  {item.direction === "borrowed" ? t.borrowedLoan : t.lentLoan}
                </span>
                {item.due_date ? ` · ${t.dueDateLabel}: ${item.due_date}` : ""}
              </p>
            </div>
            <div className="record-amount-actions">
              <div className="loan-amounts">
                <b>{formatMoney(Number(item.outstanding_amount))} {t.outstanding}</b>
                <small className="principal-label">
                  ({t.principalAmount}: {formatMoney(Number(item.principal_amount))})
                </small>
              </div>
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
