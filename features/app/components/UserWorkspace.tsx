"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { FinanceModule, type FinanceSection } from "../../finance/components/FinanceModule";
import { personalCopy, type WorkspaceLocale } from "../content/personal-copy";

// Import modular components
import { MetricCard } from "./MetricCard";
import { AccountList } from "./AccountList";
import { TransactionList } from "./TransactionList";
import { AccountForm } from "./AccountForm";
import { TransactionForm } from "./TransactionForm";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import { TransactionToolbar } from "./TransactionToolbar";
import { Modal } from "./Modal";
import { FinancialCharts } from "./FinancialCharts";
import { MobileBottomNav } from "./MobileBottomNav";
import { AlertModal } from "../../../components/ui/AlertModal";

// Import styles
import "../styles/user-workspace.css";
import "../styles/personal-enhancements.css";
import "../styles/responsive-navigation.css";
import "../styles/interaction-polish.css";
import "../styles/dashboard-charts.css";

import { PageSkeleton } from "../../../components/ui/AppSkeleton";

type PersonalPage = "dashboard" | "transactions" | "accounts" | "categories";
type Page = PersonalPage | FinanceSection;

interface Account {
  id: string;
  name: string;
  account_type: string;
  opening_balance: number;
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
  created_at?: string;
}

const financialPages: FinanceSection[] = ["budgets", "loans", "goals", "reports", "notifications"];
const pages: Page[] = ["dashboard", "transactions", "accounts", "categories", ...financialPages];

export function UserWorkspace({ user, initialPage }: { user: User; initialPage?: string }) {
  const [page, setPage] = useState<Page>(
    pages.includes(initialPage as Page) ? (initialPage as Page) : "dashboard"
  );
  const [locale, setLocale] = useState<WorkspaceLocale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_khata_locale");
      if (saved === "en" || saved === "ne") return saved as WorkspaceLocale;
    }
    return "en";
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modal visibility states
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionKind, setNewTransactionKind] = useState<"income" | "expense">("expense");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Initialize day greeting state directly to avoid useEffect setState linter warnings
  const [dayGreeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  });

  const t = personalCopy[locale];

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
          .select("id,name_ne,kind")
          .or(`user_id.eq.${user.id},is_system.eq.true`)
          .order("name_ne"),
        supabase
          .from("transactions")
          .select("id,amount,kind,transaction_date,note,account_id,category_id,created_at")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      setAccounts((accountResult.data ?? []) as Account[]);
      setCategories((categoryResult.data ?? []) as Category[]);
      setTransactions([...(transactionResult.data ?? []) as Transaction[]].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || (b.created_at ?? "").localeCompare(a.created_at ?? "")));

      if (accountResult.error || categoryResult.error || transactionResult.error) {
        setNotice(t.loadError);
      }
    } catch {
      setNotice(t.networkError);
    } finally {
      setLoading(false);
    }
  }, [user.id, t.loadError, t.networkError]);

  // Load data asynchronously on mount and update with a setTimeout wrapper
  // to avoid synchronous setState warning inside the React rendering cycle
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

  // Sync locale preference from Supabase user profile table
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.locale && (data.locale === "en" || data.locale === "ne")) {
          setLocale(data.locale as WorkspaceLocale);
          if (typeof window !== "undefined") {
            localStorage.setItem("smart_khata_locale", data.locale);
          }
        }
      });
  }, [user.id]);

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

  async function setLanguage(nextLocale: WorkspaceLocale) {
    setLocale(nextLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_khata_locale", nextLocale);
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from("profiles").update({ locale: nextLocale }).eq("id", user.id);
    }
  }

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
    const newCategory = String(form.get("newCategory") || "").trim();
    if (newCategory) {
      const categoryResult = await supabase.from("categories").insert({ user_id: user.id, name_ne: newCategory, name_en: newCategory, kind: String(form.get("kind")) }).select("id").single();
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
      const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        name_ne: String(form.get("name")),
        name_en: String(form.get("name")),
        kind: String(form.get("kind")),
      });
      if (error) {
        setNotice(error.message);
        return;
      }
      formElement.reset();
      setNotice(t.categorySaved);
      setShowCategoryForm(false);
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

  async function addCategoryFromTransaction(name: string, kind: "income" | "expense") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("categories").insert({ user_id: user.id, name_ne: name, name_en: name, kind }).select("id").single();
    if (error) { setNotice(error.message); return null; }
    await load();
    return data?.id ?? null;
  }

  function editTransaction(item: Transaction) {
    setEditingTransaction(item);
    setPage("transactions");
    setShowTransactionForm(true);
  }

  function startTransaction(kind: "income" | "expense" = "expense") {
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

  const initial = (user.user_metadata.full_name || user.email || "U")
    .slice(0, 1)
    .toUpperCase();

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

  // Navigate function passed to children
  const handlePageChange = (targetPage: Page) => {
    setPage(targetPage);
  };

  // If a planning page is selected, wrap the FinanceModule inside the WorkspaceFrame
  if (financialPages.includes(page as FinanceSection)) {
    return (
      <WorkspaceFrame
        user={user}
        initial={initial}
        locale={locale}
        setLocale={setLanguage}
        page={page}
        setPage={handlePageChange}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onAddTransaction={startTransaction}
        onSignOut={signOut}
        t={t}
      >
        <FinanceModule section={page as FinanceSection} user={user} t={t} locale={locale} />
      </WorkspaceFrame>
    );
  }

  return (
    <WorkspaceFrame
      user={user}
      initial={initial}
      locale={locale}
      setLocale={setLanguage}
      page={page}
      setPage={handlePageChange}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      onAddTransaction={startTransaction}
      onSignOut={signOut}
      t={t}
    >
      <section className="workspace-page">
        <div className="page-title">
          <div>
            <h1>
              {page === "dashboard"
                ? `${dayGreeting}, ${
                    user.user_metadata.full_name || user.email?.split("@")[0] || "there"
                  }`
                : page === "transactions"
                ? t.transactions
                : page === "accounts"
                ? t.accounts
                : t.categories}
            </h1>
            <p>
              {page === "dashboard"
                ? t.privateSummary
                : page === "transactions"
                ? t.manageTransactions
                : page === "accounts"
                ? t.noAccounts
                : t.manageCategories}
            </p>
          </div>
          <div className="title-action-buttons">
            {page === "transactions" && (
              <button
                type="button"
                className="primary-button page-action"
                onClick={() => startTransaction()}
              >
                {t.newTransaction}
              </button>
            )}
            {page === "accounts" && (
              <button
                type="button"
                className="primary-button page-action"
                onClick={() => setShowAccountForm(true)}
              >
                {t.addAccount}
              </button>
            )}
            {page === "categories" && (
              <button
                type="button"
                className="primary-button page-action"
                onClick={() => setShowCategoryForm(true)}
              >
                {t.addCategory}
              </button>
            )}
          </div>
        </div>

        {notice && (
        <div className="workspace-notice">
          <span className="notice-text">{notice}</span>
          <button type="button" className="notice-close" onClick={() => setNotice("")} aria-label="Close">×</button>
          <div className="notice-progress-bar" />
          </div>
        )}

        {loading ? (
          <PageSkeleton />
        ) : (
          <>
            {page === "dashboard" && (
              <>
                <section className="quick-actions">
                  <div>
                    <p>{t.quickActions}</p>
                    <span>{t.setupDescription}</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="outline-button"
                      onClick={() => startTransaction("expense")}
                    >
                      {t.addExpense}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => startTransaction("income")}
                    >
                      {t.addIncome}
                    </button>
                  </div>
                </section>

                <section className="summary-grid">
                  <MetricCard label={t.totalBalance} value={formatMoney(balance)} className="balance" icon="💳" />
                  <MetricCard label={t.monthlyIncome} value={formatMoney(totals.income)} className="income" icon="📈" />
                  <MetricCard label={t.monthlyExpense} value={formatMoney(totals.expense)} className="expense" icon="📉" />
                </section>

                {/* Dashboard Interactive Charts and Graphs Section */}
                <FinancialCharts
                  transactions={transactions}
                  categories={categories}
                  formatMoney={formatMoney}
                  t={t}
                  locale={locale}
                />

                {(accounts.length === 0 || transactions.length === 0) && (
                  <section className="setup-card">
                    <div>
                      <h2>{t.getStarted}</h2>
                      <p>{t.setupDescription}</p>
                    </div>
                    {accounts.length === 0 && (
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => setShowAccountForm(true)}
                      >
                        {t.addFirstAccount}
                      </button>
                    )}
                    {accounts.length > 0 && transactions.length === 0 && (
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => startTransaction()}
                      >
                        {t.addFirstTransaction}
                      </button>
                    )}
                  </section>
                )}
              </>
            )}

            {page === "accounts" && (
              <AccountList
                items={accounts}
                transactions={transactions}
                empty={t.noAccounts}
                formatMoney={formatMoney}
                t={t}
                onEdit={(account) => { setEditingAccount(account); setShowAccountForm(true); }}
              />
            )}

            {page === "categories" && (
              <CategoryList items={categories} t={t} onDelete={removeCategory} />
            )}

            {(page === "dashboard" || page === "transactions") && (
              <>
                {page === "transactions" && (
                  <TransactionToolbar
                    t={t}
                    query={query}
                    typeFilter={typeFilter}
                    onQuery={setQuery}
                    onType={setTypeFilter}
                  />
                )}
                <TransactionList
                  items={page === "dashboard" ? transactions.slice(0, 6) : filteredTransactions}
                  accounts={accounts}
                  categories={categories}
                  formatMoney={formatMoney}
                  t={t}
                  onEdit={editTransaction}
                  onDelete={removeTransaction}
                  title={page === "dashboard" ? t.recentTransactions : undefined}
                />
              </>
            )}
          </>
        )}

        {showAccountForm && (
          <Modal onClose={() => { setShowAccountForm(false); setEditingAccount(null); }}>
            <AccountForm t={t} current={editingAccount} onCancel={() => { setShowAccountForm(false); setEditingAccount(null); }} onSave={saveAccount} />
          </Modal>
        )}

        {showTransactionForm && (
          <Modal
            onClose={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
          >
            <TransactionForm
              key={editingTransaction?.id ?? "new"}
              t={t}
              accounts={accounts}
              categories={categories}
              current={editingTransaction}
              initialKind={newTransactionKind}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
              onSave={saveTransaction}
            />
          </Modal>
        )}

        {showCategoryForm && (
          <Modal onClose={() => setShowCategoryForm(false)}>
            <CategoryForm t={t} onCancel={() => setShowCategoryForm(false)} onSave={saveCategory} />
          </Modal>
        )}
        {confirmDialog && (
          <AlertModal
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={locale === "ne" ? "हुन्छ" : "Yes, Proceed"}
            cancelLabel={locale === "ne" ? "रद्द" : "Cancel"}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </section>
    </WorkspaceFrame>
  );
}

interface WorkspaceFrameProps {
  children: React.ReactNode;
  user: User;
  initial: string;
  locale: WorkspaceLocale;
  setLocale: (value: WorkspaceLocale) => void;
  page: Page;
  setPage: (page: Page) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  onAddTransaction: () => void;
  onSignOut: () => void;
  t: Record<string, string>;
}

function WorkspaceFrame({
  children,
  user,
  initial,
  locale,
  setLocale,
  page,
  setPage,
  mobileMenuOpen,
  setMobileMenuOpen,
  onAddTransaction,
  onSignOut,
  t,
}: WorkspaceFrameProps) {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const primary: Array<[Page, string]> = [
    ["dashboard", t.dashboard],
    ["transactions", t.transactions],
    ["accounts", t.accounts],
    ["categories", t.categories],
  ];

  const planning: Array<[Page, string]> = [
    ["budgets", t.budgets],
    ["loans", t.loans],
    ["goals", t.goals],
    ["reports", t.reports],
    ["notifications", t.notifications],
  ];

  const getPageIcon = (key: Page) => {
    switch (key) {
      case "dashboard":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
          </svg>
        );
      case "transactions":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        );
      case "accounts":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        );
      case "categories":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
      case "budgets":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "loans":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </svg>
        );
      case "goals":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "reports":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        );
      case "notifications":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      default:
        return <span>•</span>;
    }
  };

  const renderNavLink = ([key, label]: [Page, string]) => (
    <a
      key={key}
      href={`/personal/${key}`}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        setPage(key);
        setMobileMenuOpen(false);
      }}
      className={page === key ? "active" : ""}
    >
      <span className="nav-icon" aria-hidden="true">
        {getPageIcon(key)}
      </span>
      <span className="nav-text">{label}</span>
    </a>
  );

  return (
    <div className="workspace-shell">
      {/* Sidebar - Visible on Desktop */}
      <aside className={`workspace-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-heading">
          <p className="workspace-brand">
            <span className="brand-mark">S</span>
            <span className="nav-text">Smart Khata</span>
          </p>
          <button
            type="button"
            className="mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>
        
        <p className="workspace-mode nav-text">{t.personal}</p>
        
        <nav>
          {primary.map(renderNavLink)}
          <p className="workspace-nav-label nav-text">{t.planning}</p>
          {planning.map(renderNavLink)}
        </nav>

        <section className="sidebar-profile">
          <span className="workspace-avatar">{initial}</span>
          <div className="nav-text">
            <strong>{user.user_metadata.full_name || user.email}</strong>
            <small>{t.personal}</small>
            <select
              className="locale-select"
              aria-label={t.language}
              value={locale}
              onChange={(event) => setLocale(event.target.value as WorkspaceLocale)}
            >
              <option value="en">{t.english}</option>
              <option value="ne">{t.nepali}</option>
            </select>
          </div>
        </section>

        <button type="button" className="signout-button" onClick={onSignOut}>
          <span className="nav-icon">↪</span>
          <span className="nav-text">{t.signOut}</span>
        </button>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="workspace-main">
        <header className="workspace-topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>
          <p className="mobile-top-brand">Smart Khata</p>
        </header>

        {children}

        {/* Floating Action Button for Transactions on Mobile */}
        {page === "transactions" && (
          <button
            type="button"
            className="mobile-action-fab"
            aria-label={t.newTransaction}
            onClick={onAddTransaction}
          >
            +
          </button>
        )}

        {/* Native bottom navigation bar for mobile app experience */}
        <MobileBottomNav page={page} setPage={setPage} t={t} onOpenMoreMenu={() => setMobileMoreOpen(true)} />
      </main>

      {/* Slide-up Bottom Sheet Modal for Mobile "More" Hub */}
      {mobileMoreOpen && (
        <div className="bottom-sheet-backdrop" onClick={() => setMobileMoreOpen(false)}>
          <div className="bottom-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <h3>{t.moreFeatures}</h3>
              <button
                type="button"
                className="bottom-sheet-close-btn"
                onClick={() => setMobileMoreOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="bottom-sheet-grid">
              <button
                type="button"
                className={`bottom-sheet-item ${page === "budgets" ? "active" : ""}`}
                onClick={() => {
                  setPage("budgets");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle purple">{getPageIcon("budgets")}</span>
                <span className="grid-label">{t.budgets}</span>
              </button>
              <button
                type="button"
                className={`bottom-sheet-item ${page === "loans" ? "active" : ""}`}
                onClick={() => {
                  setPage("loans");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle orange">{getPageIcon("loans")}</span>
                <span className="grid-label">{t.loans}</span>
              </button>
              <button
                type="button"
                className={`bottom-sheet-item ${page === "goals" ? "active" : ""}`}
                onClick={() => {
                  setPage("goals");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle green">{getPageIcon("goals")}</span>
                <span className="grid-label">{t.goals}</span>
              </button>
              <button
                type="button"
                className={`bottom-sheet-item ${page === "reports" ? "active" : ""}`}
                onClick={() => {
                  setPage("reports");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle blue">{getPageIcon("reports")}</span>
                <span className="grid-label">{t.reports}</span>
              </button>
              <button
                type="button"
                className={`bottom-sheet-item ${page === "categories" ? "active" : ""}`}
                onClick={() => {
                  setPage("categories");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle teal">{getPageIcon("categories")}</span>
                <span className="grid-label">{t.categories}</span>
              </button>
              <button
                type="button"
                className={`bottom-sheet-item ${page === "notifications" ? "active" : ""}`}
                onClick={() => {
                  setPage("notifications");
                  setMobileMoreOpen(false);
                }}
              >
                <span className="grid-icon-circle pink">{getPageIcon("notifications")}</span>
                <span className="grid-label">{t.notifications}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
