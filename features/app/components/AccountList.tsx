"use client";

import React from "react";

interface Account {
  id: string;
  name: string;
  account_type: string;
  opening_balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  account_id: string;
}

interface AccountListProps {
  items: Account[];
  transactions: Transaction[];
  empty: string;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
  locale: "en" | "ne";
  onEdit: (item: Account) => void;
}

export function AccountList({ items, transactions, empty, formatMoney, t, locale, onEdit }: AccountListProps) {
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "cash":
        return t.cash;
      case "bank":
        return t.bank;
      case "wallet":
        return t.wallet || "Digital Wallet";
      case "credit_card":
        return t.card || "Credit Card";
      default:
        return t.other || "Other";
    }
  };

  return (
    <section className="account-grid">
      {items.length === 0 ? (
        <section className="record-panel w-full">
          <p className="empty-state">{empty}</p>
        </section>
      ) : (
        items.map((item) => {
          const flow = transactions
            .filter((row) => row.account_id === item.id)
            .reduce(
              (sum, row) =>
                sum +
                (row.kind === "income"
                  ? Number(row.amount)
                  : row.kind === "expense"
                  ? -Number(row.amount)
                  : 0),
              0
            );
          
          const currentBalance = Number(item.opening_balance) + flow;
          const typeClass = `card-type-${item.account_type}`;

          return (
            <article className={`premium-account-card ${typeClass}`} key={item.id}>
              {/* Glossy overlay reflections */}
              <div className="card-glass-glow" />
              
              <div className="card-top-row">
                <span className="card-badge">{getAccountTypeLabel(item.account_type)}</span>
                {/* SVG Card Chip Graphic */}
                <svg className="card-chip" viewBox="0 0 48 36" fill="none">
                  <rect width="48" height="36" rx="6" fill="white" fillOpacity="0.15"/>
                  <rect x="6" y="6" width="36" height="24" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                  <line x1="24" y1="6" x2="24" y2="30" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                  <line x1="6" y1="18" x2="42" y2="18" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
                </svg>
              </div>

              <div className="card-mid-row">
                <p className="card-holder-label">{locale === "ne" ? "खाताको नाम" : "ACCOUNT NAME"}</p>
                <h3 className="card-title-name">{item.name}</h3>
              </div>

              <div className="card-bottom-row">
                <div>
                  <p className="card-balance-label">{locale === "ne" ? "कुल मौज्दात" : "CURRENT BALANCE"}</p>
                  <strong className="card-balance-val">{formatMoney(currentBalance)}</strong>
                  <span className="card-opening-balance">
                    {t.openingBalance || "Opening"}: {formatMoney(Number(item.opening_balance))}
                  </span>
                </div>
                
                <button 
                  type="button" 
                  className="card-edit-action-btn" 
                  onClick={() => onEdit(item)}
                  title={t.edit}
                >
                  ✏️
                </button>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
