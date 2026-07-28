"use client";

import React, { FormEvent, useMemo, useState } from "react";

interface Account { id: string; name: string }
interface Category { id: string; name_ne: string; name_en: string | null; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface Transaction { id: string; amount: number; kind: "income" | "expense" | "transfer"; transaction_date: string; note: string | null; account_id: string; category_id: string | null }
interface TransactionFormProps { t: Record<string, string>; locale: "en" | "ne"; accounts: Account[]; categories: Category[]; current: Transaction | null; initialKind: "income" | "expense"; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }

export function TransactionForm({ t, locale, accounts, categories, current, initialKind, onCancel, onSave }: TransactionFormProps) {
  const currentCategory = categories.find((category) => category.id === current?.category_id);
  const [kind, setKind] = useState<"income" | "expense">(current?.kind === "income" ? "income" : current?.kind === "expense" ? "expense" : initialKind);
  const [mainCategoryId, setMainCategoryId] = useState(currentCategory?.parent_id ?? "");
  const [categoryId, setCategoryId] = useState(current?.category_id ?? "");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");

  const mainCategories = useMemo(() => categories.filter((category) => category.kind === kind && category.is_main), [categories, kind]);
  const subcategories = useMemo(() => categories.filter((category) => category.kind === kind && !category.is_main && category.parent_id === mainCategoryId), [categories, kind, mainCategoryId]);
  const normalizedCategoryQuery = categoryQuery.toLowerCase();
  const matchingSubcategories = subcategories.filter((category) => category.name_ne.toLowerCase().includes(normalizedCategoryQuery) || (category.name_en ?? "").toLowerCase().includes(normalizedCategoryQuery));
  const label = (category: Category | undefined) => category ? (locale === "ne" ? category.name_ne : (category.name_en || category.name_ne)) : "";

  if (!accounts.length) return <section className="data-form"><h2>{t.newTransaction}</h2><p className="workspace-notice">{t.noAccounts}</p><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button></section>;

  const changeKind = (value: "income" | "expense") => {
    setKind(value);
    setMainCategoryId("");
    setCategoryId("");
    setCategoryOpen(false);
    setCategoryQuery("");
    setAddingCategory(false);
  };

  const changeMainCategory = (id: string) => {
    setMainCategoryId(id);
    setCategoryId("");
    setCategoryOpen(false);
    setCategoryQuery("");
    setAddingCategory(false);
  };

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setCategoryOpen(false);
    setCategoryQuery("");
  };

  return <form className="data-form transaction-form" onSubmit={onSave}>
    <h2>{current ? t.edit : t.newTransaction}</h2>
    <label>{t.transactionType}<select name="kind" value={kind} onChange={(event) => changeKind(event.target.value as "income" | "expense")}><option value="expense">{t.expense}</option><option value="income">{t.income}</option></select></label>
    <label>{t.account}<select name="account" defaultValue={current?.account_id ?? accounts[0]?.id}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <label>{locale === "ne" ? "मुख्य श्रेणी" : "Main Category"}<select name="mainCategory" value={mainCategoryId} onChange={(event) => changeMainCategory(event.target.value)} required><option value="">{locale === "ne" ? "मुख्य श्रेणी छान्नुहोस्" : "Choose Main Category"}</option>{mainCategories.map((category) => <option key={category.id} value={category.id}>{label(category)}</option>)}</select></label>
    <label>{locale === "ne" ? "उप-श्रेणी" : "Subcategory"}<div className="category-choice">{addingCategory ? <><input name="newCategory_ne" required autoFocus placeholder={locale === "ne" ? "नेपाली उप-श्रेणी" : "Nepali subcategory"} /><input name="newCategory_en" required placeholder={locale === "ne" ? "अंग्रेजी उप-श्रेणी" : "English subcategory"} /></> : <div className="searchable-select"><input type="hidden" name="category" value={categoryId} /><button type="button" className="category-trigger" aria-expanded={categoryOpen} disabled={!mainCategoryId} onClick={() => mainCategoryId && setCategoryOpen((open) => !open)}>{categoryId ? label(subcategories.find((category) => category.id === categoryId)) : (locale === "ne" ? "उप-श्रेणी छान्नुहोस्" : "Choose Subcategory")}<span>v</span></button>{categoryOpen && <div className="category-menu"><input autoFocus value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder={locale === "ne" ? "उप-श्रेणी खोज्नुहोस्" : "Search Subcategory"} />{matchingSubcategories.length ? matchingSubcategories.map((category) => <button type="button" key={category.id} onPointerDown={(event) => { event.preventDefault(); selectCategory(category.id); }}>{label(category)}</button>) : <p className="category-empty">No subcategories yet. Use Add.</p>}</div>}</div>}<button type="button" className="outline-button" disabled={!mainCategoryId} onClick={() => { setAddingCategory((adding) => !adding); setCategoryOpen(false); }}>{addingCategory ? "Choose" : "Add"}</button></div></label>
    <label>{t.amount}<input name="amount" type="number" min="0.01" step="0.01" defaultValue={current?.amount ?? ""} required placeholder={t.amount} autoComplete="off" /></label>
    <label>{t.date}<input name="date" type="date" defaultValue={current?.transaction_date ?? new Date().toISOString().slice(0, 10)} required /></label>
    <label>{t.note}<input name="note" defaultValue={current?.note ?? ""} placeholder={kind === "income" ? "Income Topic" : "Expense Topic"} autoComplete="off" /></label>
    <div className="form-actions"><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button><button type="submit" className="primary-button">{t.save}</button></div>
  </form>;
}
