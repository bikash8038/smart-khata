"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { NepaliDatePicker } from "../../../components/ui/NepaliDatePicker";

import type { Category } from "../types/workspace";

interface Account { id: string; name: string }
interface Transaction { id: string; amount: number; kind: "income" | "expense" | "transfer"; transaction_date: string; note: string | null; account_id: string; to_account_id?: string | null; category_id: string | null }
interface TransactionFormProps {
  t: Record<string, string>;
  locale: "en" | "ne";
  accounts: Account[];
  categories: Category[];
  current: Transaction | null;
  initialKind: "income" | "expense" | "transfer";
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
  const initialKindValue = current?.kind ?? initialKind;
  const [kind, setKind] = useState<"income" | "expense" | "transfer">(initialKindValue);

  const defaultFromId = current?.account_id ?? accounts[0]?.id ?? "";
  const defaultToId = current?.to_account_id ?? (accounts.find((acc) => acc.id !== defaultFromId)?.id ?? "");

  const [fromAccountId, setFromAccountId] = useState(defaultFromId);
  const [toAccountId, setToAccountId] = useState(defaultToId);

  const initialMainCategoryId = useMemo(() => {
    if (!currentCategory) return "";
    if (currentCategory.is_main) return currentCategory.id;
    if (currentCategory.parent_id) return currentCategory.parent_id;
    return "";
  }, [currentCategory]);

  const [mainCategoryId, setMainCategoryId] = useState(initialMainCategoryId);
  const [addingCategory, setAddingCategory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(current?.transaction_date ?? new Date().toISOString().slice(0, 10));

  const mainCategories = useMemo(
    () => categories.filter((category) => category.kind === kind && category.is_main),
    [categories, kind]
  );

  // Compute activeMainCategoryId synchronously on every render
  const activeMainCategoryId = useMemo(() => {
    if (mainCategoryId && mainCategories.some((c) => c.id === mainCategoryId)) {
      return mainCategoryId;
    }
    return initialMainCategoryId || mainCategories[0]?.id || "";
  }, [mainCategoryId, mainCategories, initialMainCategoryId]);

  const label = (category: Category | undefined) =>
    category ? (locale === "ne" ? category.name_ne : (category.name_en || category.name_ne)) : "";

  if (!accounts.length) {
    return (
      <section className="data-form">
        <h2>{t.newTransaction}</h2>
        <p className="form-notice-info">{t.noAccounts}</p>
        <button type="button" className="text-button" onClick={onCancel}>
          {t.cancel}
        </button>
      </section>
    );
  }

  const changeKind = (value: "income" | "expense" | "transfer") => {
    setKind(value);
    if (value !== "transfer") {
      const newMains = categories.filter((c) => c.kind === value && c.is_main);
      const defaultMainId = newMains[0]?.id ?? "";
      setMainCategoryId(defaultMainId);
    } else {
      setMainCategoryId("");
      if (!toAccountId && accounts.length > 1) {
        const otherAcc = accounts.find((acc) => acc.id !== fromAccountId);
        if (otherAcc) setToAccountId(otherAcc.id);
      }
    }
    setAddingCategory(false);
  };

  const handleFromAccountChange = (id: string) => {
    setFromAccountId(id);
    if (id === toAccountId) {
      const otherAcc = accounts.find((acc) => acc.id !== id);
      setToAccountId(otherAcc?.id ?? "");
    }
  };

  const changeMainCategory = (id: string) => {
    setMainCategoryId(id);
    setAddingCategory(false);
  };

  return (
    <form className="data-form transaction-form" onSubmit={onSave}>
      <h2 className="modal-form-title">{kind === "transfer" ? (current ? (locale === "ne" ? "मौज्दात मिलान सम्पादन" : "Edit Balance Adjustment") : (locale === "ne" ? "मौज्दात मिलान" : "Balance Adjustment")) : (current ? t.edit : t.newTransaction)}</h2>
      
      {kind === "transfer" ? (
        <div className="form-row-2col">
          <input type="hidden" name="kind" value="transfer" />
          <label>
            {locale === "ne" ? "पठाउने खाता (From)" : "From Account"}
            <select name="account" value={fromAccountId} onChange={(event) => handleFromAccountChange(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            {locale === "ne" ? "प्राप्त गर्ने खाता (To)" : "To Account"}
            <select
              name="to_account"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              required
            >
              <option value="">{locale === "ne" ? "खाता छान्नुहोस्" : "Select Account"}</option>
              {accounts
                .filter((acc) => acc.id !== fromAccountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="form-row-2col">
          <label className="transaction-type-field">
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
        </div>
      )}

      {kind !== "transfer" && (
        <label>
          {locale === "ne" ? "क्याटेगोरी (मुख्य श्रेणी)" : "Category (Main Category)"}
          <div className="category-choice-wrapper">
            {addingCategory ? (
              <div className="new-subcategory-inputs">
                <input
                  name="newCategory_ne"
                  required
                  autoFocus
                  placeholder={locale === "ne" ? "नेपाली नयाँ क्याटेगोरी" : "Nepali new category"}
                />
                <input
                  name="newCategory_en"
                  placeholder={locale === "ne" ? "अंग्रेजी नयाँ क्याटेगोरी (वैकल्पिक)" : "English new category (optional)"}
                />
              </div>
            ) : (
              <select
                name="mainCategory"
                value={activeMainCategoryId}
                onChange={(event) => changeMainCategory(event.target.value)}
                required
                className="subcategory-select"
              >
                {mainCategories.length === 0 && (
                  <option value="">{locale === "ne" ? "क्याटेगोरी छान्नुहोस्" : "Choose Category"}</option>
                )}
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {label(category)}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="outline-button add-subcat-toggle-btn"
              onClick={() => setAddingCategory((adding) => !adding)}
            >
              {addingCategory ? (locale === "ne" ? "छान्नुहोस्" : "Choose") : (locale === "ne" ? "+ थप्नुहोस्" : "+ Add")}
            </button>
          </div>
          {mainCategories.length === 0 && !addingCategory && (
            <button type="button" className="seed-categories-button" onClick={onSeedMainCategories}>
              {locale === "ne" ? "डिफल्ट मुख्य श्रेणीहरू बनाउनुहोस्" : "Create default main categories"}
            </button>
          )}
        </label>
      )}

      <div className="form-row-2col amount-date-row">
        <label className="amount-input-label">
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

        <label className="date-input-label">
          {t.date}
          <NepaliDatePicker
            value={selectedDate}
            onChange={(newDateStr) => setSelectedDate(newDateStr)}
            locale={locale}
            name="date"
          />
        </label>
      </div>

      <label>
        {t.note}
        <input
          name="note"
          defaultValue={current?.note ?? ""}
          placeholder={
            kind === "income"
              ? (locale === "ne" ? "आम्दानी शीर्षक" : "Income Topic")
              : kind === "transfer"
              ? (locale === "ne" ? "स्थानान्तरण विवरण (वैकल्पिक)" : "Transfer Description (optional)")
              : (locale === "ne" ? "खर्च शीर्षक" : "Expense Topic")
          }
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
