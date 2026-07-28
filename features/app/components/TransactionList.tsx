"use client";

import React, { useMemo, useState } from "react";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name_ne: string;
  name_en: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  transaction_date: string;
  note: string | null;
  account_id: string;
  category_id: string | null;
  created_at?: string;
}

interface TransactionListProps {
  items: Transaction[];
  accounts: Account[];
  categories: Category[];
  formatMoney: (value: number) => string;
  t: Record<string, string>;
  locale: "en" | "ne";
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
  title?: string;
}

export function TransactionList({
  items,
  accounts,
  categories,
  formatMoney,
  t,
  locale,
  onEdit,
  onDelete,
  title,
}: TransactionListProps) {
  const [limit, setLimit] = useState("25");
  const sortedItems = useMemo(() => [...items].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || (b.created_at ?? "").localeCompare(a.created_at ?? "")), [items]);
  const visibleItems = title ? sortedItems : limit === "all" ? sortedItems : sortedItems.slice(0, Number(limit));
  const getAccountName = (id: string) => {
    return accounts.find((item) => item.id === id)?.name || t.account;
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return null;
    const category = categories.find((item) => item.id === id);
    return category ? (locale === "ne" ? category.name_ne : category.name_en || category.name_ne) : null;
  };

  return (
    <section className="record-panel">
      <div className="transaction-list-heading"><h2>{title || t.recentTransactions}</h2>{!title && <label className="transaction-show-menu">Show <select value={limit} onChange={(event) => setLimit(event.target.value)}><option value="25">25</option><option value="50">50</option><option value="75">75</option><option value="100">100</option><option value="all">All</option></select></label>}</div>
      
      {visibleItems.length === 0 ? (
        <p className="empty-state">{t.noTransactions}</p>
      ) : (
        <div className="transaction-rows-container">
          {visibleItems.map((item) => {
            const catName = getCategoryName(item.category_id);
            const accName = getAccountName(item.account_id);
            
            return (
              <article className="record-row" key={item.id}>
                <div className="record-info">
                  <span className={`transaction-type-indicator ${item.kind}`}>
                    {item.kind === "income" ? (
                      <svg className="indicator-svg income" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="17" y1="7" x2="7" y2="17" />
                        <polyline points="17 17 7 17 7 7" />
                      </svg>
                    ) : (
                      <svg className="indicator-svg expense" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <strong>
                      {item.note || catName || (item.kind === "income" ? t.income : t.expense)}
                    </strong>
                    <p className="transaction-sub-info">
                      {item.note && catName && <span className={`category-badge ${item.kind}`}>{catName}</span>}
                      <span className="account-badge">{accName}</span>
                      <span className="date-badge">{item.transaction_date}</span>
                    </p>
                  </div>
                </div>
                
                <div className="record-amount-actions">
                  <div className="transaction-meta-row">
                    <b className={`transaction-amount ${item.kind}`}>
                      {item.kind === "income" ? "+ " : "− "}
                      {formatMoney(Number(item.amount))}
                    </b>
                  </div>
                  
                  <span className="row-actions">
                    <button
                      type="button"
                      className="action-btn-blue"
                      onClick={() => onEdit(item)}
                      title={t.edit}
                      aria-label={t.edit}
                    >
                      <svg className="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                    </button>
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
      )}
    </section>
  );
}
