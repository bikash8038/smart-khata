"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import type { Account, Category, Transaction, ConfirmDialogState, WorkspaceLocale, Page } from "../types/workspace";

export const starterMainCategories: Record<"income" | "expense", Array<{ en: string; ne: string }>> = {
  income: [
    { en: "Regular Income", ne: "नियमित आम्दानी" },
    { en: "Business & Work Income", ne: "व्यवसाय तथा कामबाट आम्दानी" },
    { en: "Investment & Property Income", ne: "लगानी र सम्पत्तिबाट आम्दानी" },
    { en: "Other Income Sources", ne: "अन्य स्रोतहरू" },
  ],
  expense: [
    { en: "Household & Daily Expenses", ne: "घरायसी तथा दैनिक खर्च" },
    { en: "Transportation", ne: "यातायात" },
    { en: "Health & Wellness", ne: "स्वास्थ्य तथा तन्दुरुस्ती" },
    { en: "Education", ne: "शिक्षा" },
    { en: "Personal Expenses", ne: "व्यक्तिगत खर्च" },
    { en: "Financial & Investment Expenses", ne: "वित्तीय तथा लगानी खर्च" },
  ],
};

export function useWorkspaceData(
  user: User,
  locale: WorkspaceLocale,
  t: Record<string, string>,
  setPage: (page: Page) => void
) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modal visibility states
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<"main" | "sub" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionKind, setNewTransactionKind] = useState<"income" | "expense">("expense");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const isCreatingStarterCategories = useRef(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Fetch all user ledger data
  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const [accountResult, categoryResult, transactionResult] = await Promise.all([
        supabase
          .from("accounts")
          .select("id,name,account_type,opening_balance")
          .order("created_at"),
        supabase
          .from("categories")
          .select("id,name_ne,name_en,kind,parent_id,is_main")
          .or(`user_id.eq.${user.id},is_system.eq.true`)
          .order("name_ne"),
        supabase
          .from("transactions")
          .select("id,amount,kind,transaction_date,note,account_id,category_id,created_at")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      setAccounts((accountResult.data ?? []) as Account[]);

      let loadedCategories = (categoryResult.data ?? []) as Category[];
      const missingMainCategories = (Object.keys(starterMainCategories) as Array<"income" | "expense">).flatMap((kind) =>
        starterMainCategories[kind]
          .filter((entry) => !loadedCategories.some((category) => category.kind === kind && category.is_main && category.name_en === entry.en))
          .map((entry) => ({ kind, ...entry }))
      );

      // Ensure each user has the standard main category headings.
      if (!categoryResult.error && missingMainCategories.length && !isCreatingStarterCategories.current) {
        isCreatingStarterCategories.current = true;
        const starterRows = missingMainCategories.map(({ kind, en, ne }) => ({
          user_id: user.id,
          name_ne: ne,
          name_en: en,
          kind,
          parent_id: null,
          is_main: true,
        }));
        const { data: createdCategories, error: createCategoriesError } = await supabase
          .from("categories")
          .insert(starterRows)
          .select("id,name_ne,name_en,kind,parent_id,is_main");

        if (createCategoriesError) {
          isCreatingStarterCategories.current = false;
        } else if (createdCategories) {
          loadedCategories = [...loadedCategories, ...(createdCategories as Category[])].sort((a, b) =>
            a.name_ne.localeCompare(b.name_ne)
          );
        }
      }

      setCategories(loadedCategories);
      setTransactions([...(transactionResult.data ?? []) as Transaction[]].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || (b.created_at ?? "").localeCompare(a.created_at ?? "")));

      if (accountResult.error || categoryResult.error || transactionResult.error) {
        const categorySchemaIsMissing = Boolean(categoryResult.error && /(?:is_main|parent_id)/i.test(categoryResult.error.message));
        setNotice(
          categorySchemaIsMissing
            ? (locale === "ne" ? "Category setup पूरा भएको छैन। Supabase SQL migration चलाउनुहोस्।" : "Category setup is incomplete. Run the Supabase SQL migration.")
            : t.loadError
        );
      }
    } catch {
      setNotice(t.networkError);
    } finally {
      setLoading(false);
    }
  }, [user.id, t.loadError, t.networkError, locale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Notice auto-clear logic
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Calculations
  const totals = useMemo(() => {
    return transactions.reduce(
      (result, row) => ({
        income: result.income + (row.kind === "income" ? Number(row.amount) : 0),
        expense: result.expense + (row.kind === "expense" ? Number(row.amount) : 0),
      }),
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const balance = useMemo(() => {
    const accountsOpeningSum = accounts.reduce(
      (sum, account) => sum + Number(account.opening_balance),
      0
    );
    return accountsOpeningSum + totals.income - totals.expense;
  }, [accounts, totals]);

  const formatMoney = useCallback(
    (value: number) => {
      return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en-NP", {
        style: "currency",
        currency: "NPR",
      }).format(value);
    },
    [locale]
  );

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice(t.dbUnavailable);
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const payload = {
        name: String(form.get("name")),
        account_type: String(form.get("type")),
        opening_balance: Number(form.get("openingBalance") || 0),
      };
      const { error } = editingAccount
        ? await supabase.from("accounts").update(payload).eq("id", editingAccount.id)
        : await supabase.from("accounts").insert({ user_id: user.id, ...payload });
      if (error) {
        setNotice(error.message);
        return;
      }
      formElement.reset();
      setNotice(editingAccount ? t.transactionUpdated : t.accountSaved);
      setEditingAccount(null);
      setShowAccountForm(false);
      load();
    } catch {
      setNotice(t.saveAccountError);
    }
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice(t.dbUnavailable);
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let categoryId = String(form.get("category")) || null;
    const newCategoryNe = String(form.get("newCategory_ne") || "").trim();
    const newCategoryEn = String(form.get("newCategory_en") || "").trim();
    if (newCategoryNe || newCategoryEn) {
      const parentCategoryId = String(form.get("mainCategory") || "");
      if (!parentCategoryId || !newCategoryNe || !newCategoryEn) { setNotice("Please complete the main category and both category names."); return; }
      const categoryResult = await supabase.from("categories").insert({ user_id: user.id, name_ne: newCategoryNe, name_en: newCategoryEn, kind: String(form.get("kind")), parent_id: parentCategoryId, is_main: false }).select("id").single();
      if (categoryResult.error) { setNotice(categoryResult.error.message); return; }
      categoryId = categoryResult.data.id;
    }
    const payload = {
      user_id: user.id,
      account_id: String(form.get("account")),
      category_id: categoryId,
      kind: String(form.get("kind")),
      amount: Number(form.get("amount")),
      transaction_date: String(form.get("date")),
      note: String(form.get("note")) || null,
    };

    try {
      const result = editingTransaction
        ? await supabase.from("transactions").update(payload).eq("id", editingTransaction.id)
        : await supabase.from("transactions").insert(payload);

      if (result.error) {
        setNotice(result.error.message);
        return;
      }
      formElement.reset();
      setNotice(editingTransaction ? t.transactionUpdated : t.transactionSaved);
      setEditingTransaction(null);
      setShowTransactionForm(false);
      load();
    } catch {
      setNotice(t.saveTransactionError);
    }
  }

  async function seedDefaultMainCategories() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice(t.dbUnavailable);
      return;
    }

    const { data: existingCategories, error: existingCategoriesError } = await supabase
      .from("categories")
      .select("kind,name_en")
      .eq("user_id", user.id)
      .eq("is_main", true);
    if (existingCategoriesError) {
      setNotice(existingCategoriesError.message);
      return;
    }

    const rows = (Object.keys(starterMainCategories) as Array<"income" | "expense">).flatMap((kind) =>
      starterMainCategories[kind].map(({ en, ne }) => ({
        user_id: user.id,
        name_ne: ne,
        name_en: en,
        kind,
        parent_id: null,
        is_main: true,
      }))
    ).filter((row) => !existingCategories?.some((category) => category.kind === row.kind && category.name_en === row.name_en));

    if (!rows.length) {
      setNotice(locale === "ne" ? "डिफल्ट मुख्य श्रेणीहरू पहिले नै छन्।" : "Default main categories already exist.");
      load();
      return;
    }
    const { error } = await supabase.from("categories").insert(rows);
    if (error) {
      setNotice(error.message);
      return;
    }
    setNotice(locale === "ne" ? "डिफल्ट मुख्य श्रेणीहरू तयार भए।" : "Default main categories are ready.");
    load();
  }

  async function removeTransaction(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setConfirmDialog({
      title: locale === "ne" ? "के तपाईं पक्का हुनुहुन्छ?" : "Are you sure?",
      message: t.deleteConfirm,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const { error } = await supabase.from("transactions").delete().eq("id", id);
          if (error) {
            setNotice(error.message);
            return;
          }
          setNotice(t.transactionDeleted);
          load();
        } catch {
          setNotice(t.deleteTransactionError);
        }
      },
    });
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const mode = String(form.get("mode")) as "main" | "sub";
      const payload = {
        user_id: user.id,
        name_ne: String(form.get("name_ne")).trim(),
        name_en: String(form.get("name_en")).trim(),
        kind: String(form.get("kind")),
        parent_id: mode === "main" ? null : String(form.get("parentCategory")),
        is_main: mode === "main",
      };
      if (!payload.name_ne || !payload.name_en || (mode === "sub" && !payload.parent_id)) { setNotice("Please complete all category fields."); return; }
      const { error } = editingCategory
        ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
        : await supabase.from("categories").insert(payload);
      if (error) {
        setNotice(error.message);
        return;
      }
      formElement.reset();
      setNotice(t.categorySaved);
      setCategoryFormMode(null);
      setEditingCategory(null);
      load();
    } catch {
      setNotice(t.saveCategoryError);
    }
  }

  async function removeCategory(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setConfirmDialog({
      title: locale === "ne" ? "के तपाईं पक्का हुनुहुन्छ?" : "Are you sure?",
      message: t.deleteConfirm,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const target = categories.find((category) => category.id === id);
          if (target?.is_main) await supabase.from("categories").delete().eq("parent_id", id);
          const { error } = await supabase.from("categories").delete().eq("id", id);
          if (error) {
            setNotice(error.message);
            return;
          }
          setNotice(t.categoryDeleted);
          load();
        } catch {
          setNotice(t.deleteCategoryError);
        }
      },
    });
  }

  async function addCategoryFromTransaction(name: string, kind: "income" | "expense", parentId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("categories").insert({ user_id: user.id, name_ne: name, name_en: name, kind, parent_id: parentId, is_main: false }).select("id").single();
    if (error) { setNotice(error.message); return null; }
    await load();
    return data?.id ?? null;
  }

  function editTransaction(item: Transaction) {
    setEditingTransaction(item);
    setPage("transactions");
    setShowTransactionForm(true);
  }

  async function startTransaction(kind: "income" | "expense" = "expense") {
    if (!categories.some((category) => category.kind === kind && category.is_main)) await load();
    setEditingTransaction(null);
    setNewTransactionKind(kind);
    setPage("transactions");
    setShowTransactionForm(true);
  }

  async function signOut() {
    setConfirmDialog({
      title: locale === "ne" ? "लग आउट गर्ने हो?" : "Sign Out?",
      message: locale === "ne" ? "के तपाईं आफ्नो खाताबाट बाहिर निस्कन चाहनुहुन्छ?" : "Are you sure you want to sign out from your account?",
      onConfirm: async () => {
        setConfirmDialog(null);
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      },
    });
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const category = categories.find((entry) => entry.id === item.category_id)?.name_ne ?? "";
      const term = query.trim().toLowerCase();
      return (
        (typeFilter === "all" || item.kind === typeFilter) &&
        (!term || `${item.note ?? ""} ${category}`.toLowerCase().includes(term))
      );
    });
  }, [transactions, categories, query, typeFilter]);

  return {
    accounts,
    categories,
    transactions,
    filteredTransactions,
    totals,
    balance,
    loading,
    notice,
    setNotice,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    confirmDialog,
    setConfirmDialog,

    // Modal visibility & edit states
    showAccountForm,
    setShowAccountForm,
    editingAccount,
    setEditingAccount,
    showTransactionForm,
    setShowTransactionForm,
    categoryFormMode,
    setCategoryFormMode,
    editingCategory,
    setEditingCategory,
    editingTransaction,
    setEditingTransaction,
    newTransactionKind,

    // Operations
    load,
    formatMoney,
    saveAccount,
    saveTransaction,
    removeTransaction,
    saveCategory,
    removeCategory,
    seedDefaultMainCategories,
    addCategoryFromTransaction,
    editTransaction,
    startTransaction,
    signOut,
  };
}
