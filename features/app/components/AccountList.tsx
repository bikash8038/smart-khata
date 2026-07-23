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
  onEdit: (item: Account) => void;
}

export function AccountList({ items, transactions, empty, formatMoney, t, onEdit }: AccountListProps) {
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "cash":
        return `💵 ${t.cash}`;
      case "bank":
        return `🏦 ${t.bank}`;
      case "wallet":
        return `📱 ${t.wallet || "Digital Wallet"}`;
      case "credit_card":
        return `💳 ${t.card || "Credit Card"}`;
      default:
        return `📁 ${t.other || "Other"}`;
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

          return (
            <article className="account-card" key={item.id}>
              <span className="account-type-badge">{getAccountTypeLabel(item.account_type)}</span>
              <h2>{item.name}</h2>
              <strong className="account-balance">{formatMoney(currentBalance)}</strong>
              <span className="opening-balance-label">
                {t.openingBalance || "Opening Balance"}: {formatMoney(Number(item.opening_balance))}
              </span>
              <button type="button" className="account-edit-button" onClick={() => onEdit(item)}>{t.edit}</button>
            </article>
          );
        })
      )}
    </section>
  );
}
