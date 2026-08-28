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
  const [newTransactionKind, setNewTransactionKind] = useState<"income" | "expense" | "transfer">("expense");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const isCreatingStarterCategories = useRef(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | "super_admin">("user");

  // Fetch all user ledger data
  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const [accountResult, categoryResult, transactionResult, profileResult, exclusionResult] = await Promise.all([
        supabase
          .from("accounts")
          .select("id,name,account_type,opening_balance")
          .order("created_at"),
        supabase
          .from("categories")
          .select("id,name_ne,name_en,kind,parent_id,is_main,is_system")
          .or(`user_id.eq.${user.id},is_system.eq.true`)
          .order("name_ne"),
        supabase
          .from("transactions")
          .select("id,amount,kind,transaction_date,note,account_id,to_account_id,category_id,created_at")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("role, status, scheduled_deletion_date")
          .eq("id", user.id)
          .single()
          .then(async (res) => {
            if (res.error && res.error.code === "42703") {
              return supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            }
            return res;
          })
          .catch(() => {
            return supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();
          }),
        supabase
          .from("category_exclusions")
          .select("category_id")
          .eq("user_id", user.id)
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

      const excludedIds = ((exclusionResult?.data ?? []) as Array<{ category_id: string }>).map((ex) => ex.category_id);
      const visibleCategories = loadedCategories.filter((cat) => {
        if (excludedIds.includes(cat.id)) return false;
        if (cat.parent_id && excludedIds.includes(cat.parent_id)) return false;
        return true;
      });

      setCategories(visibleCategories);
      setTransactions([...(transactionResult.data ?? []) as Transaction[]].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || (b.created_at ?? "").localeCompare(a.created_at ?? "")));

      if (profileResult.data?.role) {
        setUserRole(profileResult.data.role as "user" | "admin" | "super_admin");
      }

      if (profileResult.data && 'scheduled_deletion_date' in profileResult.data && profileResult.data.scheduled_deletion_date) {
        // Automatically reverse account deletion request
        await supabase
          .from("profiles")
          .update({
            status: "Active",
            scheduled_deletion_date: null
          })
          .eq("id", user.id);

        setNotice(
          locale === "ne"
            ? "तपाईंको खाता मेटाउने अनुरोध रद्द गरिएको छ र पुन: सक्रिय गरिएको छ!"
            : "Your account deletion request has been cancelled and reactivated!"
        );
      }

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
    const kind = String(form.get("kind"));
    const payload = {
      user_id: user.id,
      account_id: String(form.get("account")),
      category_id: kind === "transfer" ? null : categoryId,
      kind: kind,
      amount: Number(form.get("amount")),
      transaction_date: String(form.get("date")),
      note: String(form.get("note")) || null,
      to_account_id: kind === "transfer" ? String(form.get("to_account")) : null,
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
      const isSystemChecked = form.get("is_system") === "on";

      const payload: Record<string, unknown> = {
        name_ne: String(form.get("name_ne")).trim(),
        name_en: String(form.get("name_en")).trim(),
        kind: String(form.get("kind")),
        parent_id: mode === "main" ? null : String(form.get("parentCategory")),
        is_main: mode === "main",
      };

      if (userRole === "super_admin") {
        payload.is_system = isSystemChecked;
        payload.user_id = isSystemChecked ? null : user.id;
      } else {
        payload.is_system = false;
        payload.user_id = user.id;
      }

      if (!payload.name_ne || !payload.name_en || (mode === "sub" && !payload.parent_id)) {
        setNotice("Please complete all category fields.");
        return;
      }

      // Duplicate validation checks (case-insensitive for both Nepali and English names)
      const nameNe = String(payload.name_ne).trim().toLowerCase();
      const nameEn = String(payload.name_en).trim().toLowerCase();
      const kind = String(payload.kind);
      const parentId = payload.parent_id ? String(payload.parent_id) : null;

      if (mode === "main") {
        const dup = categories.find((cat) => 
          cat.is_main && 
          cat.kind === kind && 
          cat.id !== editingCategory?.id && 
          (cat.name_ne.toLowerCase() === nameNe || 
           (cat.name_en && cat.name_en.toLowerCase() === nameEn))
        );
        if (dup) {
          setNotice(
            locale === "ne"
              ? "यो मुख्य क्याटेगोरी पहिले नै उपलब्ध छ।"
              : "This main category already exists."
          );
          return;
        }
      } else {
        const dup = categories.find((cat) => 
          !cat.is_main && 
          cat.parent_id === parentId && 
          cat.id !== editingCategory?.id && 
          (cat.name_ne.toLowerCase() === nameNe || 
           (cat.name_en && cat.name_en.toLowerCase() === nameEn))
        );
        if (dup) {
          setNotice(
            locale === "ne"
              ? "यो सब-क्याटेगोरी यस मुख्य क्याटेगोरी अन्तर्गत पहिले नै उपलब्ध छ।"
              : "This subcategory already exists under this main category."
          );
          return;
        }
      }

      if (editingCategory) {
        if (editingCategory.is_system && userRole !== "super_admin") {
          const { error: exclusionError } = await supabase
            .from("category_exclusions")
            .insert({ user_id: user.id, category_id: editingCategory.id });

          if (exclusionError) throw exclusionError;

          const { error: insertCopyError } = await supabase
            .from("categories")
            .insert(payload);

          if (insertCopyError) throw insertCopyError;
        } else {
          const { error } = await supabase
            .from("categories")
            .update(payload)
            .eq("id", editingCategory.id);

          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }

      formElement.reset();
      setNotice(t.categorySaved);
      setCategoryFormMode(null);
      setEditingCategory(null);
      load();
    } catch (err) {
      const error = err as Error;
      setNotice(error?.message || t.saveCategoryError);
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
          if (!target) return;

          if (target.is_system && userRole !== "super_admin") {
            const { data: subs, error: subsError } = await supabase
              .from("categories")
              .select("id")
              .eq("parent_id", id);

            if (subsError) throw subsError;

            const idsToExclude = [id];
            if (subs) {
              subs.forEach((s) => idsToExclude.push(s.id));
            }

            const rowsToInsert = idsToExclude.map((catId) => ({
              user_id: user.id,
              category_id: catId,
            }));

            const { error: excludeError } = await supabase
              .from("category_exclusions")
              .insert(rowsToInsert);

            if (excludeError) throw excludeError;
          } else {
            if (target.is_main) {
              await supabase.from("categories").delete().eq("parent_id", id);
            }
            const { error } = await supabase.from("categories").delete().eq("id", id);
            if (error) throw error;
          }

          setNotice(t.categoryDeleted);
          load();
        } catch (err) {
          const error = err as Error;
          setNotice(error?.message || t.deleteCategoryError);
        }
      },
    });
  }

  async function importCategories(parsedItems: Array<{ kind: "income" | "expense"; mainNe: string; mainEn: string; subNe: string; subEn: string }>) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      // Fetch all existing system categories to check duplicates in-memory
      const { data: dbSystemCats, error: fetchError } = await supabase
        .from("categories")
        .select("id,name_ne,name_en,kind,parent_id,is_main,is_system")
        .eq("is_system", true);

      if (fetchError) throw fetchError;
      const systemCats: Category[] = (dbSystemCats || []) as Category[];

      const mainCategoriesMap = new Map<string, { kind: "income" | "expense"; ne: string; en: string; subs: Array<{ ne: string; en: string }> }>();

      for (const item of parsedItems) {
        const key = `${item.kind}:${item.mainEn.toLowerCase()}`;
        if (!mainCategoriesMap.has(key)) {
          mainCategoriesMap.set(key, {
            kind: item.kind,
            ne: item.mainNe,
            en: item.mainEn,
            subs: [],
          });
        }
        if (item.subNe && item.subEn) {
          const subsList = mainCategoriesMap.get(key)!.subs;
          if (!subsList.some((s) => s.en.toLowerCase() === item.subEn.toLowerCase())) {
            subsList.push({
              ne: item.subNe,
              en: item.subEn,
            });
          }
        }
      }

      let totalImported = 0;

      for (const mainCat of mainCategoriesMap.values()) {
        let mainId = "";

        // Check duplicates for main categories (case-insensitive for both Nepali and English names)
        const existingMain = systemCats.find((cat) =>
          cat.is_main &&
          cat.kind === mainCat.kind &&
          (cat.name_ne.toLowerCase() === mainCat.ne.toLowerCase() ||
           (cat.name_en && cat.name_en.toLowerCase() === mainCat.en.toLowerCase()))
        );

        if (existingMain) {
          mainId = existingMain.id;
        } else {
          const { data: newMain, error: insertMainError } = await supabase
            .from("categories")
            .insert({
              user_id: null,
              name_ne: mainCat.ne,
              name_en: mainCat.en,
              kind: mainCat.kind,
              is_main: true,
              parent_id: null,
              is_system: true,
            })
            .select("id")
            .single();

          if (insertMainError) throw insertMainError;
          mainId = newMain.id;
          
          systemCats.push({
            id: mainId,
            name_ne: mainCat.ne,
            name_en: mainCat.en,
            kind: mainCat.kind,
            parent_id: null,
            is_main: true,
            is_system: true,
          });
          totalImported++;
        }

        for (const sub of mainCat.subs) {
          // Check duplicates for subcategories under this main ID (case-insensitive for both Nepali and English names)
          const existingSub = systemCats.find((cat) =>
            !cat.is_main &&
            cat.parent_id === mainId &&
            (cat.name_ne.toLowerCase() === sub.ne.toLowerCase() ||
             (cat.name_en && cat.name_en.toLowerCase() === sub.en.toLowerCase()))
          );

          if (!existingSub) {
            const { data: newSub, error: insertSubError } = await supabase
              .from("categories")
              .insert({
                user_id: null,
                name_ne: sub.ne,
                name_en: sub.en,
                kind: mainCat.kind,
                is_main: false,
                parent_id: mainId,
                is_system: true,
              })
              .select("id")
              .single();

            if (insertSubError) throw insertSubError;

            systemCats.push({
              id: newSub.id,
              name_ne: sub.ne,
              name_en: sub.en,
              kind: mainCat.kind,
              parent_id: mainId,
              is_main: false,
              is_system: true,
            });
            totalImported++;
          }
        }
      }

      setNotice(
        locale === "ne"
          ? `सफलतापूर्वक ${totalImported} वटा क्याटेगोरी/सब-क्याटेगोरी आयात गरियो!`
          : `Successfully imported ${totalImported} categories/subcategories!`
      );
      await load();
    } catch (err) {
      const error = err as Error;
      setNotice(
        locale === "ne"
          ? `आयात गर्न असफल भयो: ${error.message}`
          : `Failed to import: ${error.message}`
      );
    }
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

  async function startTransaction(kind: "income" | "expense" | "transfer" = "expense") {
    if (!categories.some((category) => category.kind === kind && category.is_main)) await load();
    setEditingTransaction(null);
    setNewTransactionKind(kind);
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

  const transactionsWithRunningBalance = useMemo(() => {
    // Sort chronologically ascending to compute accurate cumulative running balances
    const sortedAsc = [...transactions].sort(
      (a, b) =>
        a.transaction_date.localeCompare(b.transaction_date) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? "") ||
        a.id.localeCompare(b.id)
    );

    const accountBalances: Record<string, number> = {};
    accounts.forEach((acc) => {
      accountBalances[acc.id] = Number(acc.opening_balance) || 0;
    });

    let globalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.opening_balance) || 0), 0);

    const balanceMap = new Map<string, number>();

    sortedAsc.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.kind === "income") {
        accountBalances[tx.account_id] = (accountBalances[tx.account_id] || 0) + amt;
        globalBalance += amt;
      } else if (tx.kind === "expense") {
        accountBalances[tx.account_id] = (accountBalances[tx.account_id] || 0) - amt;
        globalBalance -= amt;
      } else if (tx.kind === "transfer") {
        accountBalances[tx.account_id] = (accountBalances[tx.account_id] || 0) - amt;
        if (tx.to_account_id) {
          accountBalances[tx.to_account_id] = (accountBalances[tx.to_account_id] || 0) + amt;
        }
      }

      balanceMap.set(
        tx.id,
        accountFilter !== "all" ? (accountBalances[accountFilter] || 0) : globalBalance
      );
    });

    return transactions.map((tx) => ({
      ...tx,
      runningBalance: balanceMap.get(tx.id) ?? 0,
    }));
  }, [transactions, accounts, accountFilter]);

  const filteredTransactions = useMemo(() => {
    return transactionsWithRunningBalance.filter((item) => {
      if (accountFilter !== "all") {
        if (item.kind === "transfer") {
          if (item.account_id !== accountFilter && item.to_account_id !== accountFilter) {
            return false;
          }
        } else if (item.account_id !== accountFilter) {
          return false;
        }
      }
      if (typeFilter !== "all" && item.kind !== typeFilter) {
        return false;
      }
      if (fromDate && item.transaction_date < fromDate) {
        return false;
      }
      if (toDate && item.transaction_date > toDate) {
        return false;
      }
      if (query.trim()) {
        const category = categories.find((entry) => entry.id === item.category_id)?.name_ne ?? "";
        const term = query.trim().toLowerCase();
        const match = `${item.note ?? ""} ${category}`.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [transactionsWithRunningBalance, accountFilter, typeFilter, fromDate, toDate, query, categories]);

  return {
    accounts,
    categories,
    transactions,
    filteredTransactions,
    userRole,
    totals,
    balance,
    loading,
    notice,
    setNotice,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    accountFilter,
    setAccountFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
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
    importCategories,
    seedDefaultMainCategories,
    addCategoryFromTransaction,
    editTransaction,
    startTransaction,
    signOut,
  };
}
