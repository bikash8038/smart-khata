"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { FinanceModule, type FinanceSection } from "../../finance/components/FinanceModule";

// Custom Hooks & Types
import { useWorkspaceLocale } from "../hooks/useWorkspaceLocale";
import { useWorkspaceNavigation } from "../hooks/useWorkspaceNavigation";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import type { Page, WorkspaceLocale } from "../types/workspace";

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
import { AlertModal } from "../../../components/ui/AlertModal";
import { PageSkeleton } from "../../../components/ui/AppSkeleton";
import { UserManagement } from "./UserManagement";
import { ProfileSettings } from "./ProfileSettings";
import { BankStatementView } from "./BankStatementView";

// Import styles
import "../styles/user-workspace.css";
import "../styles/personal-enhancements.css";
import "../styles/responsive-navigation.css";
import "../styles/interaction-polish.css";
import "../styles/dashboard-charts.css";
import "../styles/profile-settings.css";

export function UserWorkspace({ user, initialPage }: { user: User; initialPage?: string }) {
  const { locale, setLanguage, t } = useWorkspaceLocale(user);
  const { page, setPage, mobileMenuOpen, setMobileMenuOpen, financialPages } = useWorkspaceNavigation(initialPage);

  const {
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
    formatMoney,
    saveAccount,
    saveTransaction,
    removeTransaction,
    saveCategory,
    removeCategory,
    importCategories,
    seedDefaultMainCategories,
    editTransaction,
    startTransaction,
    signOut,
  } = useWorkspaceData(user, locale, t, setPage);

  // View mode for Transactions page (list view vs electronic bank statement view)
  const [txViewMode, setTxViewMode] = useState<"list" | "statement">("list");

  // Initialize day greeting state directly to avoid useEffect setState linter warnings
  const [dayGreeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  });

  const initial = (user.user_metadata.full_name || user.email || "U")
    .slice(0, 1)
    .toUpperCase();

  // If a planning page is selected, wrap the FinanceModule inside the WorkspaceFrame
  if (financialPages.includes(page as FinanceSection)) {
    return (
      <WorkspaceFrame
        user={user}
        initial={initial}
        locale={locale}
        setLocale={setLanguage}
        page={page}
        setPage={setPage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onAddTransaction={startTransaction}
        onSignOut={signOut}
        t={t}
        userRole={userRole}
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
      setPage={setPage}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      onAddTransaction={startTransaction}
      onSignOut={signOut}
      t={t}
      userRole={userRole}
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
                : page === "categories"
                ? t.categories
                : t.userManagement}
            </h1>
            <p>
              {page === "dashboard"
                ? t.privateSummary
                : page === "transactions"
                ? t.manageTransactions
                : page === "accounts"
                ? (locale === "ne" ? "आफ्नो बैंक खाता, नगद र डिजिटल वालेटहरू व्यवस्थापन गर्नुहोस्।" : "Manage your bank accounts, cash, and digital wallets.")
                : page === "categories"
                ? t.manageCategories
                : t.adminPanel}
            </p>
          </div>
          <div className={`title-action-buttons ${page === "categories" ? "category-page-actions" : ""}`}>
            {page === "transactions" && (
              <button
                type="button"
                className="primary-button page-action transaction-page-action"
                onClick={() => startTransaction()}
              >
                {t.newTransaction}
              </button>
            )}
            {page === "accounts" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="outline-button page-action"
                  onClick={() => startTransaction("transfer")}
                >
                  {locale === "ne" ? "मौज्दात मिलान" : "Balance Adjustment"}
                </button>
                <button
                  type="button"
                  className="primary-button page-action"
                  onClick={() => setShowAccountForm(true)}
                >
                  {t.addAccount}
                </button>
              </div>
            )}
            {page === "categories" && (
              <>
                <button
                  type="button"
                  className="primary-button page-action"
                  onClick={() => { setEditingCategory(null); setCategoryFormMode("main"); }}
                >
                  Add Main Category
                </button>
                <button type="button" className="outline-button page-action" onClick={() => { setEditingCategory(null); setCategoryFormMode("sub"); }}>Add Subcategory</button>
              </>
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
                  <MetricCard label={t.totalBalance} value={formatMoney(balance)} className="balance" icon="💳" onClick={() => setPage("accounts")} />
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
                locale={locale}
                onEdit={(account) => { setEditingAccount(account); setShowAccountForm(true); }}
              />
            )}

            {page === "categories" && (
              <CategoryList 
                items={categories} 
                t={t} 
                locale={locale} 
                onEdit={(category) => { setEditingCategory(category); setCategoryFormMode(category.is_main ? "main" : "sub"); }} 
                onDelete={removeCategory} 
                userRole={userRole}
                onImportExcel={importCategories}
              />
            )}

            {page === "users" && (
              <UserManagement
                user={user}
                locale={locale}
                t={t}
                currentUserRole={userRole}
              />
            )}

            {page === "profile" && (
              <ProfileSettings
                user={user}
                locale={locale}
                t={t}
                onSignOut={signOut}
              />
            )}

            {(page === "dashboard" || page === "transactions") && (
              <>
                {page === "transactions" && (
                  <>
                    <div className="transactions-view-tab-container">
                      <div className="transactions-view-tabs">
                        <button
                          type="button"
                          className={`tx-view-tab-btn ${txViewMode === "list" ? "active" : ""}`}
                          onClick={() => setTxViewMode("list")}
                          title={t.listView || "List View"}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          <span>{t.listView || "List View"}</span>
                        </button>
                        <button
                          type="button"
                          className={`tx-view-tab-btn ${txViewMode === "statement" ? "active" : ""}`}
                          onClick={() => setTxViewMode("statement")}
                          title={t.statementView || "Statement View"}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <span>{t.statementView || "Statement View"}</span>
                        </button>
                      </div>
                    </div>

                    <TransactionToolbar
                      t={t}
                      locale={locale}
                      accounts={accounts}
                      query={query}
                      typeFilter={typeFilter}
                      accountFilter={accountFilter}
                      fromDate={fromDate}
                      toDate={toDate}
                      onQuery={setQuery}
                      onType={setTypeFilter}
                      onAccount={setAccountFilter}
                      onFromDate={setFromDate}
                      onToDate={setToDate}
                    />
                  </>
                )}
                {page === "transactions" && txViewMode === "statement" ? (
                  <BankStatementView
                    transactions={transactions}
                    accounts={accounts}
                    categories={categories}
                    user={user}
                    fromDate={fromDate}
                    toDate={toDate}
                    accountFilter={accountFilter}
                    query={query}
                    typeFilter={typeFilter}
                    formatMoney={formatMoney}
                    t={t}
                    locale={locale}
                  />
                ) : (
                  <TransactionList
                    items={page === "dashboard" ? transactions.slice(0, 6) : filteredTransactions}
                    accounts={accounts}
                    categories={categories}
                    formatMoney={formatMoney}
                    t={t}
                    locale={locale}
                    onEdit={editTransaction}
                    onDelete={removeTransaction}
                    title={page === "dashboard" ? t.recentTransactions : undefined}
                  />
                )}
              </>
            )}
          </>
        )}

        {showAccountForm && (
          <Modal onClose={() => { setShowAccountForm(false); setEditingAccount(null); }}>
            <AccountForm t={t} locale={locale} current={editingAccount} onCancel={() => { setShowAccountForm(false); setEditingAccount(null); }} onSave={saveAccount} />
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
              locale={locale}
              accounts={accounts}
              categories={categories}
              current={editingTransaction}
              initialKind={newTransactionKind}
              onSeedMainCategories={seedDefaultMainCategories}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
              onSave={saveTransaction}
            />
          </Modal>
        )}

        {categoryFormMode && (
          <Modal onClose={() => { setCategoryFormMode(null); setEditingCategory(null); }}>
            <CategoryForm t={t} locale={locale} mode={categoryFormMode} current={editingCategory} categories={categories} userRole={userRole} onCancel={() => { setCategoryFormMode(null); setEditingCategory(null); }} onSave={saveCategory} />
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
  onAddTransaction: (kind?: "income" | "expense") => void;
  onSignOut: () => void;
  t: Record<string, string>;
  userRole: "user" | "admin" | "super_admin";
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
  userRole,
}: WorkspaceFrameProps) {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const primary: Array<[Page, string]> = [
    ["dashboard", t.dashboard],
    ["transactions", t.transactions],
    ["accounts", t.accounts],
    ["categories", t.categories],
  ];

  if (userRole === "admin" || userRole === "super_admin") {
    primary.push(["users", t.userManagement]);
  }

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
      case "users":
        return (
          <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

        <section 
          className="sidebar-profile" 
          style={{ cursor: "pointer" }}
          onClick={() => setPage("profile")}
        >
          <span className="workspace-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initial
            )}
          </span>
          <div className="nav-text">
            <strong>{user.user_metadata.full_name || user.email}</strong>
            <small>{t.personal}</small>
            <select
              className="locale-select"
              aria-label={t.language}
              value={locale}
              onChange={(event) => {
                event.stopPropagation();
                setLocale(event.target.value as WorkspaceLocale);
              }}
              onClick={(event) => event.stopPropagation()}
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

      {/* Mobile Drawer Overlay - Gyan Punja style */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <p className="workspace-brand">
                <span className="brand-mark">S</span>
                <span className="nav-text">Smart Khata</span>
              </p>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="mobile-drawer-links">
              {primary.map(([key, label]) => (
                <a
                  key={key}
                  href={`/personal/${key}`}
                  className={`mobile-drawer-link ${page === key ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(key);
                    setMobileMenuOpen(false);
                  }}
                >
                  {label}
                </a>
              ))}
              
              <div className="mobile-drawer-section-title">{t.planning}</div>
              
              {planning.map(([key, label]) => (
                <a
                  key={key}
                  href={`/personal/${key}`}
                  className={`mobile-drawer-link ${page === key ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(key);
                    setMobileMenuOpen(false);
                  }}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Profile section placed at bottom directly after links (no empty gap) */}
            <div className="mobile-drawer-profile-section">
              <button
                type="button"
                className="mobile-drawer-profile-trigger"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <span className="workspace-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }}>
                  {user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initial
                  )}
                </span>
                <div className="profile-trigger-info">
                  <strong>{user.user_metadata.full_name || user.email}</strong>
                  <small>{userRole === "super_admin" ? (locale === "ne" ? "सुपर एडमिन" : "Super Admin") : userRole === "admin" ? (locale === "ne" ? "एडमिन" : "Admin") : (locale === "ne" ? "प्रयोगकर्ता" : "User")}</small>
                </div>
                <span className="profile-trigger-arrow">{isProfileExpanded ? "▲" : "▼"}</span>
              </button>

              {isProfileExpanded && (
                <div className="mobile-drawer-profile-dropdown">
                  <button
                    type="button"
                    className="dropdown-item-link"
                    onClick={() => {
                      setPage("profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    👤 {locale === "ne" ? "व्यक्तिगत विवरण" : "Personal Info"}
                  </button>

                  <button
                    type="button"
                    className="dropdown-item-link"
                    onClick={() => {
                      setPage("profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    🔒 {locale === "ne" ? "सुरक्षा र पासवर्ड" : "Security & Password"}
                  </button>

                  {/* Language selector inside profile menu */}
                  <div className="dropdown-language-item">
                    <span>🌐 {locale === "ne" ? "भाषा (Language)" : "Language"}</span>
                    <select
                      className="locale-select drawer-locale-select"
                      aria-label={t.language}
                      value={locale}
                      onChange={(event) => {
                        setLocale(event.target.value as WorkspaceLocale);
                      }}
                    >
                      <option value="en">English</option>
                      <option value="ne">नेपाली</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="dropdown-item-link logout-item"
                    onClick={() => {
                      onSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    ↪ {t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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

        {/* Floating Action Buttons for Transactions on Mobile */}
        {page === "transactions" && (
          <div className="mobile-fab-container">
            <button
              type="button"
              className="mobile-action-fab expense-fab"
              aria-label={locale === "ne" ? "खर्च थप्नुहोस्" : "Add Expense"}
              title={locale === "ne" ? "खर्च थप्नुहोस्" : "Add Expense"}
              onClick={() => onAddTransaction("expense")}
            >
              −
            </button>
            <button
              type="button"
              className="mobile-action-fab income-fab"
              aria-label={locale === "ne" ? "आम्दानी थप्नुहोस्" : "Add Income"}
              title={locale === "ne" ? "आम्दानी थप्नुहोस्" : "Add Income"}
              onClick={() => onAddTransaction("income")}
            >
              +
            </button>
          </div>
        )}
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
              {(userRole === "admin" || userRole === "super_admin") && (
                <button
                  type="button"
                  className={`bottom-sheet-item ${page === "users" ? "active" : ""}`}
                  onClick={() => {
                    setPage("users");
                    setMobileMoreOpen(false);
                  }}
                >
                  <span className="grid-icon-circle teal">{getPageIcon("users")}</span>
                  <span className="grid-label">{t.userManagement}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
