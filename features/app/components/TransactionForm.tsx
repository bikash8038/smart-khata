"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";

interface Account { id: string; name: string }
interface Category { id: string; name_ne: string; name_en: string | null; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface Transaction { id: string; amount: number; kind: "income" | "expense" | "transfer"; transaction_date: string; note: string | null; account_id: string; category_id: string | null }
interface TransactionFormProps {
  t: Record<string, string>;
  locale: "en" | "ne";
  accounts: Account[];
  categories: Category[];
  current: Transaction | null;
  initialKind: "income" | "expense";
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSeedMainCategories: () => void;
}

export function TransactionForm({
  t,
  locale,
  accounts,
  categories,
  current,
  initialKind,
  onCancel,
  onSave,
  onSeedMainCategories
}: TransactionFormProps) {
  const currentCategory = categories.find((category) => category.id === current?.category_id);
  const initialKindValue = current?.kind === "income" ? "income" : current?.kind === "expense" ? "expense" : initialKind;
  const [kind, setKind] = useState<"income" | "expense">(initialKindValue);

  const [mainCategoryId, setMainCategoryId] = useState(currentCategory?.parent_id ?? "");
  const [categoryId, setCategoryId] = useState(current?.category_id ?? "");
  const [addingCategory, setAddingCategory] = useState(false);

  const mainCategories = useMemo(
    () => categories.filter((category) => category.kind === kind && category.is_main),
    [categories, kind]
  );

  // Compute activeMainCategoryId synchronously on every render so it is never empty if mainCategories exist
  const activeMainCategoryId = useMemo(() => {
    if (mainCategoryId && mainCategories.some((c) => c.id === mainCategoryId)) {
      return mainCategoryId;
    }
    return currentCategory?.parent_id ?? mainCategories[0]?.id ?? "";
  }, [mainCategoryId, mainCategories, currentCategory]);

  useEffect(() => {
    if (activeMainCategoryId && activeMainCategoryId !== mainCategoryId) {
      setMainCategoryId(activeMainCategoryId);
    }
  }, [activeMainCategoryId, mainCategoryId]);

  const subcategories = useMemo(
    () => categories.filter((category) => category.kind === kind && !category.is_main && category.parent_id === activeMainCategoryId),
    [categories, kind, activeMainCategoryId]
  );

  const label = (category: Category | undefined) =>
    category ? (locale === "ne" ? category.name_ne : (category.name_en || category.name_ne)) : "";

  if (!accounts.length) {
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

  const changeKind = (value: "income" | "expense") => {
    setKind(value);
    const newMains = categories.filter((c) => c.kind === value && c.is_main);
    const defaultMainId = newMains[0]?.id ?? "";
    setMainCategoryId(defaultMainId);
    setCategoryId("");
    setAddingCategory(false);
  };

  const changeMainCategory = (id: string) => {
    setMainCategoryId(id);
    setCategoryId("");
    setAddingCategory(false);
  };

  return (
    <form className="data-form transaction-form" onSubmit={onSave}>
      <h2>{current ? t.edit : t.newTransaction}</h2>
      
      <label>
        {t.transactionType}
        <select name="kind" value={kind} onChange={(event) => changeKind(event.target.value as "income" | "expense")}>
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
        {locale === "ne" ? "मुख्य श्रेणी" : "Main Category"}
        <select
          name="mainCategory"
          value={activeMainCategoryId}
          onChange={(event) => changeMainCategory(event.target.value)}
          required
        >
          {mainCategories.length === 0 && (
            <option value="">{locale === "ne" ? "मुख्य श्रेणी छान्नुहोस्" : "Choose Main Category"}</option>
          )}
          {mainCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {label(category)}
            </option>
          ))}
        </select>
        {mainCategories.length === 0 && (
          <button type="button" className="seed-categories-button" onClick={onSeedMainCategories}>
            {locale === "ne" ? "डिफल्ट मुख्य श्रेणीहरू बनाउनुहोस्" : "Create default main categories"}
          </button>
        )}
      </label>

      <label>
        {locale === "ne" ? "उप-श्रेणी" : "Subcategory"}
        <div className="category-choice-wrapper">
          {addingCategory ? (
            <div className="new-subcategory-inputs">
              <input
                name="newCategory_ne"
                required
                autoFocus
                placeholder={locale === "ne" ? "नेपाली उप-श्रेणी" : "Nepali subcategory"}
              />
              <input
                name="newCategory_en"
                placeholder={locale === "ne" ? "अंग्रेजी उप-श्रेणी (वैकल्पिक)" : "English subcategory (optional)"}
              />
            </div>
          ) : (
            <select
              name="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!activeMainCategoryId}
              className="subcategory-select"
            >
              <option value="">{locale === "ne" ? "उप-श्रेणी छान्नुहोस्" : "Choose Subcategory"}</option>
              {subcategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {label(category)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="outline-button add-subcat-toggle-btn"
            disabled={!activeMainCategoryId}
            onClick={() => setAddingCategory((adding) => !adding)}
          >
            {addingCategory ? (locale === "ne" ? "छान्नुहोस्" : "Choose") : (locale === "ne" ? "+ थप्नुहोस्" : "+ Add")}
          </button>
        </div>
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
          placeholder={t.amount}
          autoComplete="off"
        />
      </label>

      <label>
        {t.date}
        <input
          name="date"
          type="date"
          defaultValue={current?.transaction_date ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </label>

      <label>
        {t.note}
        <input
          name="note"
          defaultValue={current?.note ?? ""}
          placeholder={kind === "income" ? (locale === "ne" ? "आम्दानी शीर्षक" : "Income Topic") : (locale === "ne" ? "खर्च शीर्षक" : "Expense Topic")}
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
