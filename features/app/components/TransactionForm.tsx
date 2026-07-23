"use client";

import React, { FormEvent, useState } from "react";

interface Account { id: string; name: string }
interface Category { id: string; name_ne: string; kind: "income" | "expense" }
interface Transaction { id: string; amount: number; kind: "income" | "expense" | "transfer"; transaction_date: string; note: string | null; account_id: string; category_id: string | null }
interface TransactionFormProps { t: Record<string, string>; accounts: Account[]; categories: Category[]; current: Transaction | null; initialKind: "income" | "expense"; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }

export function TransactionForm({ t, accounts, categories, current, initialKind, onCancel, onSave }: TransactionFormProps) {
  const [kind, setKind] = useState<"income" | "expense">(current?.kind === "income" ? "income" : current?.kind === "expense" ? "expense" : initialKind);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryId, setCategoryId] = useState(current?.category_id ?? "");
  const relevantCategories = categories.filter((category) => category.kind === kind);
  if (!accounts.length) return <section className="data-form"><h2>{t.newTransaction}</h2><p className="workspace-notice">{t.noAccounts}</p><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button></section>;
  return <form className="data-form transaction-form" onSubmit={onSave}>
    <h2>{current ? t.edit : t.newTransaction}</h2>
    <label>{t.transactionType}<select name="kind" value={kind} onChange={(e) => { setKind(e.target.value as "income" | "expense"); setAddingCategory(false); }}><option value="expense">{t.expense}</option><option value="income">{t.income}</option></select></label>
    <label>{t.account}<select name="account" defaultValue={current?.account_id ?? accounts[0]?.id}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <label>{t.category}<div className="category-choice">{addingCategory ? <input name="newCategory" required autoFocus placeholder={t.categoryName} /> : <div className="searchable-select"><input type="hidden" name="category" value={categoryId} /><button type="button" className="category-trigger" onClick={() => setCategoryOpen(!categoryOpen)}>{categoryId ? relevantCategories.find((c) => c.id === categoryId)?.name_ne : "Choose Category"}<span>⌄</span></button>{categoryOpen && <div className="category-menu"><input autoFocus value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} placeholder="Search Category" />{relevantCategories.filter((c) => c.name_ne.toLowerCase().includes(categoryQuery.toLowerCase())).map((category) => <button type="button" key={category.id} onClick={() => { setCategoryId(category.id); setCategoryOpen(false); setCategoryQuery(""); }}>{category.name_ne}</button>)}</div>}</div>}<button type="button" className="outline-button" onClick={() => setAddingCategory(!addingCategory)}>{addingCategory ? "Choose" : "Add"}</button></div></label>
    <label>{t.amount}<input name="amount" type="number" min="0.01" step="0.01" defaultValue={current?.amount ?? ""} required placeholder={t.amount} autoComplete="off" /></label>
    <label>{t.date}<input name="date" type="date" defaultValue={current?.transaction_date ?? new Date().toISOString().slice(0, 10)} required /></label>
    <label>{t.note}<input name="note" defaultValue={current?.note ?? ""} placeholder={kind === "income" ? "Income Topic" : "Expense Topic"} autoComplete="off" /></label>
    <div className="form-actions"><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button><button type="submit" className="primary-button">{t.save}</button></div>
  </form>;
}
