"use client";

import React, { useMemo, useState } from "react";
import { getStatementDateHeaderInfo, formatAmPmTime } from "../../../lib/nepali-date";

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
  to_account_id?: string | null;
  category_id: string | null;
  created_at?: string;
  runningBalance?: number;
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

  // Format amount without currency prefix (NPR / रू.) for detail rows
  const formatRowAmountOnly = (amount: number) => {
    const formatted = formatMoney(amount);
    return formatted.replace(/^(NPR|रू\.)\s*/i, "").trim();
  };

  // Sort items descending by transaction_date, then created_at
  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        b.transaction_date.localeCompare(a.transaction_date) ||
        (b.created_at ?? "").localeCompare(a.created_at ?? "") ||
        b.id.localeCompare(a.id)
    );
  }, [items]);

  const visibleItems = title ? sortedItems : limit === "all" ? sortedItems : sortedItems.slice(0, Number(limit));

  const getAccountName = (id: string) => {
    return accounts.find((item) => item.id === id)?.name || t.account;
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return null;
    const category = categories.find((item) => item.id === id);
    return category ? (locale === "ne" ? category.name_ne : category.name_en || category.name_ne) : null;
  };

  // Group visible items by transaction_date
  const groupedTransactions = useMemo(() => {
    const groups: Array<{
      date: string;
      closingBalance: number;
      items: Transaction[];
    }> = [];

    const map = new Map<string, Transaction[]>();

    visibleItems.forEach((tx) => {
      const list = map.get(tx.transaction_date) || [];
      list.push(tx);
      map.set(tx.transaction_date, list);
    });

    map.forEach((dayItems, date) => {
      // The first item in dayItems (due to descending sort) is the latest entry on that day,
      // so its running balance represents the Closing Balance for that day.
      const closingBalance = dayItems[0]?.runningBalance ?? 0;
      groups.push({
        date,
        closingBalance,
        items: dayItems,
      });
    });

    return groups;
  }, [visibleItems]);

  return (
    <section className="record-panel statement-view-panel">
      {/* Top Section Heading & Menu */}
      <div className="transaction-list-heading">
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span>{title || t.recentTransactions}</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: "600",
              backgroundColor: "#e2e8f0",
              color: "#334155",
              padding: "2px 8px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
            }}
          >
            {locale === "ne" ? `जम्मा: ${sortedItems.length}` : `Total: ${sortedItems.length}`}
          </span>
          {limit !== "all" && sortedItems.length > Number(limit) && (
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: "500",
                color: "#64748b",
              }}
            >
              ({locale === "ne" ? `${limit} वटा देखाइएको` : `showing ${limit}`})
            </span>
          )}
        </h2>
        {!title && (
          <label className="transaction-show-menu">
            Show{" "}
            <select value={limit} onChange={(event) => setLimit(event.target.value)}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
              <option value="all">All</option>
            </select>
          </label>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <p className="empty-state">{t.noTransactions}</p>
      ) : (
        <div className="statement-groups-wrapper">
          {groupedTransactions.map((group) => {
            const headerInfo = getStatementDateHeaderInfo(group.date, locale);

            return (
              <div className="statement-day-card" key={group.date}>
                {/* Daily Header: Top-Left Date & Top-Right Closing Balance with NPR currency */}
                <div className="statement-day-header">
                  <div className="statement-header-left">
                    <div className="statement-bs-title">{headerInfo.fullBsDateStr}</div>
                    <div className="statement-ad-sub">({headerInfo.adFormatted})</div>
                  </div>

                  <div className="statement-header-right">
                    <span className="statement-closing-label">
                      {locale === "ne" ? "अन्तिम मौजदात" : "CLOSING BALANCE"}
                    </span>
                    <span className="statement-closing-amount">{formatMoney(group.closingBalance)}</span>
                  </div>
                </div>

                {/* Day Transactions List */}
                <div className="statement-day-rows">
                  {group.items.map((item) => {
                    const catName = getCategoryName(item.category_id);
                    const accName = getAccountName(item.account_id);
                    const timeFormatted = formatAmPmTime(item.created_at, locale);

                    return (
                      <article className="record-row statement-record-row" key={item.id}>
                        {/* Left Side: Indicator & Note / Category / Account / Left-Aligned Time */}
                        <div className="record-info">
                          <span className={`transaction-type-indicator ${item.kind}`}>
                            {item.kind === "income" ? (
                              <svg
                                className="indicator-svg income"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="7" y1="17" x2="17" y2="7" />
                                <polyline points="7 7 17 7 17 17" />
                              </svg>
                            ) : item.kind === "expense" ? (
                              <svg
                                className="indicator-svg expense"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="17" y1="7" x2="7" y2="17" />
                                <polyline points="17 17 7 17 7 7" />
                              </svg>
                            ) : (
                              <svg
                                className="indicator-svg transfer"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="17 1 21 5 17 9" />
                                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                <polyline points="7 23 3 19 7 15" />
                                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                              </svg>
                            )}
                          </span>
                          <div className="record-text-block">
                            <strong className="transaction-item-title">
                              {item.note || catName || (item.kind === "income" ? t.income : item.kind === "transfer" ? t.transfer : t.expense)}
                            </strong>
                            <p className="transaction-sub-info">
                              {item.note && catName && (
                                <span className={`category-badge ${item.kind}`}>{catName}</span>
                              )}
                              <span className="account-badge">
                                {item.kind === "transfer" ? `${accName} ➜ ${item.to_account_id ? getAccountName(item.to_account_id) : "?"}` : accName}
                              </span>
                            </p>
                            {timeFormatted && (
                              <div className="time-badge-wrapper">
                                <span className="time-badge" title="Time">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "4px" }}
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  {timeFormatted}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Amount without NPR prefix (Slightly smaller) & Edit/Delete actions */}
                        <div className="record-amount-actions">
                          <div className="transaction-meta-row">
                            <b className={`transaction-amount ${item.kind}`}>
                              {item.kind === "income" ? "+ " : item.kind === "transfer" ? "⇆ " : "− "}
                              {formatRowAmountOnly(Number(item.amount))}
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
                              <svg
                                className="action-icon-svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
                              <svg
                                className="action-icon-svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
