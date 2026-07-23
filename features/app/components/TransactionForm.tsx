"use client";

import React, { FormEvent, useState } from "react";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name_ne: string;
  kind: "income" | "expense";
}

interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  transaction_date: string;
  note: string | null;
  account_id: string;
  category_id: string | null;
}

interface TransactionFormProps {
  t: Record<string, string>;
  accounts: Account[];
  categories: Category[];
  current: Transaction | null;
  initialKind: "income" | "expense";
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

export function TransactionForm({
  t,
  accounts,
  categories,
  current,
  initialKind,
  onCancel,
  onSave,
}: TransactionFormProps) {
  const [kind, setKind] = useState<"income" | "expense">(
    current?.kind === "income"
      ? "income"
      : current?.kind === "expense"
      ? "expense"
      : initialKind
  );

  const relevantCategories = categories.filter(
    (category) => category.kind === kind
  );

  if (accounts.length === 0) {
    return (
      <section className="data-form">
        <h2>{t.newTransaction}</h2>
        <p className="workspace-notice">{t.noAccounts}</p>
        <button type="button" className="text-button" onClick={onCancel}>
          {t.cancel}
        </button>
      </section>
    );
  }

  return (
    <form className="data-form" onSubmit={onSave}>
      <h2>{current ? t.edit : t.newTransaction}</h2>
      
      <label>
        {t.transactionType}
        <select
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as "income" | "expense")}
        >
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
      </label>
      
      <label>
        {t.account}
        <select name="account" defaultValue={current?.account_id ?? accounts[0]?.id}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      
      <label>
        {t.category}
        <select
          name="category"
          key={kind}
          defaultValue={current?.kind === kind ? current.category_id ?? "" : ""}
        >
          <option value="">—</option>
          {relevantCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_ne}
            </option>
          ))}
        </select>
      </label>
      
      <label>
        {t.amount}
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={current?.amount ?? ""}
          required
          placeholder="0.00"
          autoComplete="off"
        />
      </label>
      
      <label>
        {t.date}
        <input
          name="date"
          type="date"
          defaultValue={
            current?.transaction_date ?? new Date().toISOString().slice(0, 10)
          }
          required
        />
      </label>
      
      <label>
        {t.note}
        <input
          name="note"
          defaultValue={current?.note ?? ""}
          placeholder="जैसे: बजार खर्च, तलब भुक्तानी"
          autoComplete="off"
        />
      </label>
      
      <div className="form-actions">
        <button type="button" className="text-button" onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className="primary-button">
          {t.save}
        </button>
      </div>
    </form>
  );
}
